import os
from azure.ai.documentintelligence import DocumentIntelligenceClient
from typing import Optional
from models.evidenceShape import ExtractedSignal, ExtractorInput
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential

#converts any supported files
#into markdown
class DocumentExtractor:
    SUPPORTED_TYPES = {
        "image/jpeg", "image/png", "image/tiff", "image/bmp",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }


    def __init__(self):
        endpoint = os.environ["DOCUMENT_INTELLIGENCE_ENDPOINT"]
        key = os.environ["DOCUMENT_INTELLIGENCE_KEY"]
        self.client = DocumentIntelligenceClient(endpoint, AzureKeyCredential(key))

    def extract_to_markdown(self, file_bytes: bytes, content_type: str)->str:

        poller = self.client.begin_analyze_document(
            "prebuilt-layout",
            body=file_bytes,
            content_type=content_type,
            output_content_format="markdown",
        )
        result = poller.result()#analyzed doc data(text, layout, tables etc)
        markdown = result.content

        #append hints so LLM knows what was visually emphasized
        style_tags = set()# store uniques style tags
        if result.styles:
            for style in result.styles:
                if getattr(style, "is_handwritten", False):#if attr is handwritten
                    style_tags.add("<style:handwritten>")
                if getattr(style, "font_weight", None) == "bold":#is the text bold
                    style_tags.add("<style:bold>")
        if style_tags:
            markdown += "\n\n<!-- Visual styles detected: " + ", ".join(style_tags) + " -->"
        
        return markdown