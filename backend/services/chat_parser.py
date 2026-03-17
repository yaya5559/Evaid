# Author: Bria Tran
# Date: February 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
#
# handles parsing chat logs in txt, json, and csv formats
# basically takes raw file bytes and turns them into a list of messages
# each message has a username, the message text, and a timestamp

import json
import csv
import logging
import re
from io import StringIO
from dateutil import parser as date_parser

logger = logging.getLogger(__name__)


# tries to take whatever timestamp string we get and convert it to ISO format
# ISO format is something like 2024-01-15T14:30:00 which is what we want to store consistently
# dateutil is really good at parsing weird date formats so im using that
# if it cant parse it just return "N/A" instead of crashing everything
def normalize_timestamp(ts_string):
    try:
        return date_parser.parse(ts_string).isoformat()
    except Exception:
        # couldnt parse it
        return "N/A"


# main parsing function that figures out what kind of file it is and parses it
# returns a tuple: (list of messages, list of errors)
# returning errors separately instead of throwing exceptions so the
# upload endpoint can show the user what went wrong without crashing
def parse_chat_log(file_bytes, content_type):
    # errors='ignore' means if theres some weird character it just skips it
    decoded_file = file_bytes.decode('utf-8', errors='ignore')

    messages = []
    errors = []

    # JSON TYPE
    # check content_type first but also check if the file itself looks like json
    if 'json' in content_type or decoded_file.strip().startswith(('{', '[')):
        try:
            data = json.loads(decoded_file)

            # some json exports are just a list of messages at the top level
            # others wrap them in {"messages": [...]}
            raw_msgs = data if isinstance(data, list) else data.get("messages", [])

            for m in raw_msgs:
                # try a few different key names since different apps export differently
                messages.append({
                    "username":  m.get("username") or m.get("user") or "Unknown",
                    "message":   m.get("message")  or m.get("text")  or "",
                    "timestamp": normalize_timestamp(m.get("timestamp") or m.get("date", ""))
                })

        except Exception as e:
            error_msg = f"JSON parsing failed: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)

    # CSV TYPE
    # check content type, but if the first line has commas its probably csv
    elif 'csv' in content_type or (',' in decoded_file.splitlines()[0] if decoded_file.splitlines() else False):
        try:
            # DictReader uses the header row as keys automatically i believe
            f = StringIO(decoded_file)
            reader = csv.DictReader(f)

            for row in reader:
                # again trying different column name variations
                # some exports use "content" instead of "message", etc.
                messages.append({
                    "username":  row.get("username") or row.get("user")    or "Unknown",
                    "message":   row.get("message")  or row.get("content") or "",
                    "timestamp": normalize_timestamp(row.get("timestamp")  or row.get("time", ""))
                })

        except Exception as e:
            error_msg = f"CSV parsing failed: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)

    # TXT TYPE IN PROGRESS
    # trying to support these formats:
    #   [2024-01-01 12:00:00] Username: message here
    #   (2024-01-01 12:00) Username: message here
    #   Username: message here  <-- no timestamp at all
    elif 'plain' in content_type or 'text' in content_type:
        try:
            # it optionally match a timestamp wrapped in [] or ()
            # then matches "Username:"
            # then matches the rest as the message
            # the ?P<name> syntax names the capture groups so i can reference them by name
            pattern = re.compile(
                r'^[\[\(]?(?P<timestamp>[^\]\)]+?)[\]\)]?\s+(?P<username>[^:]+?):\s+(?P<message>.+)$'
            )

            # fallback for lines with no timestamp at all, just "Username: message"
            simple_pattern = re.compile(r'^(?P<username>[^:]+?):\s+(?P<message>.+)$')

            for line in decoded_file.splitlines():
                line = line.strip()

                # skip blank lines
                if not line:
                    continue

                match = pattern.match(line)
                if match:
                    messages.append({
                        "username":  match.group("username").strip(),
                        "message":   match.group("message").strip(),
                        "timestamp": normalize_timestamp(match.group("timestamp").strip())
                    })
                else:
                    # try the simpler pattern with no timestamp
                    simple_match = simple_pattern.match(line)
                    if simple_match:
                        messages.append({
                            "username":  simple_match.group("username").strip(),
                            "message":   simple_match.group("message").strip(),
                            "timestamp": "N/A"
                        })
                    else:
                        # line didnt match anything, just log and skip it
                        logger.warning(f"couldn't parse this line, skipping: {line[:80]}")

        except Exception as e:
            error_msg = f"TXT parsing failed: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)

    # return both the messages and any errors
    return messages, errors
