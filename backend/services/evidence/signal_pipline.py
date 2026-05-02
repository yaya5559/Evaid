from models.evidenceShape import ExtractedSignal
from services.database import get_db_connection
from openai import AzureOpenAI
import os
import re, json


def run_universal_extraction(markdown: str, attachement_id: str, cursor) -> list[ExtractedSignal]:
    cursor.execute(
        "SELECT name, regex_pattern FROM SignalTypeDefinition "
        "WHERE scope = 'universal' AND regex_pattern IS NOT NULL"
    )
    definitions = cursor.fetchall()
    signals = []
    for name, pattern in definitions:
        for match in re.finditer(pattern, markdown, re.IGNORECASE):
            signals.append(ExtractedSignal(
                signal_type=name,
                raw_value=match.group(),
                normalized_value=match.group().lower().strip(),
                confidence=0.96,
                source_locator={
                    "method": "regex",
                    "char_start": match.start(),
                    "char_end": match.end(),
                    "attachement_id": str(attachement_id),
                }
            ))
    return signals


def detect_platform(markdown: str) -> tuple[str, float, str]:
    """return platform name, confidence, and reasoning"""
    client = AzureOpenAI(
        api_key=os.environ["openAi_keys"],
        api_version=os.environ["openai_api_version"],
        azure_endpoint=os.environ["openAi_endpoint"],
    )
    response = client.chat.completions.create(
        model="Evaidmodel",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an intelligence analyst. Extract entities with character offsets."},
            {"role": "user", "content": f"""Identify what platform or document type this text came from.
                    Do not limit yourself to known platforms — name what you observe.
                    Examples: Discord export, Telegram screenshot, X/Twitter post, Bank statement, Minecraft chat log, Unknown
                    Text (first 2000 chars):
                    {markdown[:2000]}
                    Respond ONLY in JSON:
                    {{"platform": "...", "confidence": 0.0-1.0, "reasoning": "one sentence"}}"""}
        ]
    )
    result = json.loads(response.choices[0].message.content)
    return result["platform"], result["confidence"], result["reasoning"]


def load_case_hints(case_id: str, cursor) -> list[dict]:
    cursor.execute(
        "SELECT name, llm_hint FROM SignalTypeDefinition "
        "WHERE scope = 'custom' and case_id = ?",
        (case_id,)
    )
    rows = cursor.fetchall()
    return [{"name": r[0], "hint": r[1]} for r in rows]


def load_agent_context(evidence_id: str, cursor) -> str | None:
    """Load the agent's note for this evidence item to inject into the LLM prompt."""
    cursor.execute(
        "SELECT agent_context FROM EvidenceItem WHERE Id = ?",
        (evidence_id,)
    )
    row = cursor.fetchone()
    if row and row[0]:
        return row[0].strip()
    return None


def run_llm_extraction(
    markdown: str, platform_hint: str, case_id: str, attachment_id: str, cursor,
    evidence_id: str = None
) -> list[ExtractedSignal]:
    custom_hints = load_case_hints(case_id, cursor)
    hints_block = ""

    if custom_hints:
        hints_block = "The investigator flagged these signal types as relevant:\n"
        hints_block += "\n".join([f"- {h['name']}: {h['hint']}" for h in custom_hints])

    # Inject agent context note if provided
    agent_context_block = ""
    if evidence_id:
        agent_context = load_agent_context(evidence_id, cursor)
        if agent_context:
            agent_context_block = f"""
Investigator's note about this evidence:
\"\"\"{agent_context}\"\"\"
Use this context to guide your extraction — pay special attention to entities or patterns 
the investigator has highlighted.
"""

    client = AzureOpenAI(
        api_key=os.environ["openAi_keys"],
        api_version=os.environ["openai_api_version"],
        azure_endpoint=os.environ["openAi_endpoint"],
    )

    response = client.chat.completions.create(
        model="Evaidmodel",
        response_format={"type": "json_object"},
        max_tokens=4000,
        messages=[
            {
                "role": "system",
                "content": "You are an intelligence analyst. Extract identifiers with exact character offsets into a JSON array."
            },
            {
                "role": "user",
                "content":
                f"""Platform context: {platform_hint}
                    (Use as context only — do NOT limit extraction to this platform's known patterns)

                    {agent_context_block}
                    {hints_block}

                    Extract EVERY entity that could identify:
                        - A person (real name, alias, handle, gamertag, display name)
                        - An account (username, user ID, profile URL, invite code)
                        - A community (server name, group name, channel)
                        - A service or platform
                        - Any other identifier you consider significant
                    
                    Include character offsets (char_start, char_end) pointing to exactly where in the text you found it.

                    Full text:
                    {markdown}

                    Return ONLY a JSON object with a 'results' key containing the array
                    [{{
                        "signal_type": "descriptive_snake_case_name",
                        "raw_value": "exactly what you saw",
                        "normalized_value": "cleaned lowercase",
                        "confidence": 0.0,
                        "char_start": 0,
                        "char_end": 0,
                        "reasoning": "one sentence"
                    }}]
                """
            }]
    )
    items = json.loads(response.choices[0].message.content)["results"]

    return [
        ExtractedSignal(
            signal_type=i["signal_type"],
            raw_value=i["raw_value"],
            normalized_value=i["normalized_value"],
            confidence=i["confidence"],
            source_locator={
                "method": "llm",
                "platform": platform_hint,
                "char_start": i.get("char_start"),
                "char_end": i.get("char_end"),
                "reasoning": i["reasoning"],
                "attachment_id": str(attachment_id)
            }
        ) for i in items
    ]
