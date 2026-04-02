<<<<<<< HEAD
﻿
=======

>>>>>>> origin/main

import fitz  # fitz is the import name for pymupdf, kind of confusing naming but thats just how it is
import docx
import io


# takes raw file bytes and the content type and returns extracted text as a string
# content_type is like "image/png" or "application/pdf" which all comes from the upload
# returns an error string if something goes wrong instead of crashing
def extract_text_from_evidence(file_bytes: bytes, content_type: str) -> str:
    extracted_text = ""

    try:
        if "pdf" in content_type:
            # fitz.open can open a pdf directly from bytes using the stream parameter
            # had to look this up apparently you cant just pass bytes directly, needs stream=
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                # get_text() pulls all the embedded text out of the page
                extracted_text += page.get_text() + "\n"
            doc.close()

        elif "image" in content_type:
            # opens images directly the same way as pdfs
            # figure out the filetype from the content_type string "image/png" -> "png", "image/jpeg" -> "jpeg"
            filetype = content_type.split("/")[-1]

            # fitz wants "jpeg" not "jpg" so normalize that
            if filetype == "jpg":
                filetype = "jpeg"

            doc = fitz.open(stream=file_bytes, filetype=filetype)
            for page in doc:
                extracted_text += page.get_text() + "\n"
            doc.close()

        elif "wordprocessingml" in content_type or "docx" in content_type:
            # word docs dont need OCR since the text is already there as actual text
            # python-docx can just read it directly paragraph by paragraph
            doc = docx.Document(io.BytesIO(file_bytes))
            extracted_text = "\n".join([para.text for para in doc.paragraphs])

    except Exception as e:
        # return a string describing the error if something goes wrong
        # the caller (evidence_service) will store this in the metadata
        # so the preview window for later shows the user that extraction failed
        return f"Extraction Error: {str(e)}"

    # strip() cleans up any leading/trailing whitespace or extra newlines
    return extracted_text.strip()

