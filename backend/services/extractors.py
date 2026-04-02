import os
from typing import Optional
from models.evidenceShape import ExtractedSignal, ExtractorInput
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential

class ImageExtractor:
    type = "ImageExtractor"

    def __init__(
            self,
            vision_endpoint: Optional[str] = None,
            vision_key: Optional[str] = None,
            text_extractor=None,
            language: str = "en",

    ) ->  None:
        endpoint = vision_endpoint or os.environ["VISION_ENDPOINT"]
        key = vision_key or os.environ["VISION_KEY"]

        self.client = ImageAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key),
        )
        self.text_extractor = text_extractor
        self.language = language
        

    def extract(self, extractor_input:ExtractorInput):
        if not extractor_input.attachment_kind.startswith("image/"):
            raise ValueError(
                f"ImageExtractor cannot handle '{extractor_input.attachment_kind}'"
            )
        
        result = self.client.analyze(
            image_data=extractor_input.file_bytes,
            visual_features=[VisualFeatures.READ],
            language=self.language,
            model_version="latest",
        )

        return result
        


         