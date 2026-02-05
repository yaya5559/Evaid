# Author: Bria Tran
# Date: January 28th, 2026
# This file handles our "Smart AI Evidence Brain" using Azure Cosmos DB
# We are using a Hybrid Approach: Azure SQL handles the users/cases
# while Cosmos DB handles the "messy" AI data like text and vectors

import os
import uuid  # used for generating unique IDs for our NoSQL documents
from datetime import datetime
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

class EvidenceService:
    def __init__(self):
        # set up connection to Cosmos DB same idea as our SQL connection but for NoSQL
        url = os.getenv("COSMOS_URI")
        key = os.getenv("COSMOS_KEY")
        self.client = CosmosClient(url, credential=key)
        self.database = self.client.get_database_client("EvaideDB")
        
        # set up Azure OpenAI client so we can convert text into vectors
        self.ai_client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_version="2024-02-01"
        )

    def create_container_with_ai_policy(self):
        # this function creates our Evidence container in Cosmos DB with AI vector support
        # we only need to run this once to set everything up
        # after that the container will be ready to store evidence files
        
        # vector policy tells Cosmos how to store our AI embeddings
        # each embedding is a list of 1536 numbers (required by OpenAI's model)
        # we save them at the path "/vector_data" in each document
        vector_policy = {
            "vectorEmbeddings": [
                {
                    "path": "/vector_data",  # where the vector array gets stored
                    "dataType": "float32",   # numbers with decimals
                    "distanceFunction": "cosine",  # how to measure similarity between vectors
                    "dimensions": 1536  # text-embedding-3-small always outputs 1536 numbers
                }
            ]
        }

        # indexing policy makes searches faster by using the diskANN algorithm
        # diskANN is optimized for searching through lots of vectors quickly
        indexing_policy = {
            "vectorIndexes": [
                {"path": "/vector_data", "type": "diskANN"}
            ]
        }

        try:
            # create the container with caseId as the partition key
            # this groups all evidence for one case together physically
            # is supposed to make it faster when we're searching within a specific case
            container = self.database.create_container_if_not_exists(
                id="Evidence",
                partition_key=PartitionKey(path="/caseId"),
                indexing_policy=indexing_policy,
                vector_embedding_policy=vector_policy
            )
            print("Successfully set up the AI Evidence Container!")
            return container
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error during container setup: {e}")
            raise

    def save_new_evidence(self, caseId, userId, fileName, fileUrl, summary, extractedText, metadata):
        # this function saves a new evidence file to Cosmos DB
        # it takes all the info about the file and converts the summary into a vector
        # then it stores everything as a JSON document in the Evidence container
        
        # Step 1: convert the AI summary text into a vector
        # OpenAI's embedding model reads the text and outputs numbers that represent its meaning
        # similar text will have similar numbers
        res = self.ai_client.embeddings.create(input=summary, model="text-embedding-3-small")
        vector = res.data[0].embedding

        # Step 2: build the evidence document as a Python dictionary which will get saved as JSON in Cosmos DB
        # each field stores different info about the evidence file
        evidence_item = {
            "id": str(uuid.uuid4()),      # unique ID for this document
            "caseId": caseId,             # links to the case in our SQL database
            "userId": userId,             # who uploaded it (links to SQL database)
            "fileName": fileName,         # original filename
            "fileUrl": fileUrl,           # where the actual file is stored in Blob Storage
            "aiSummary": summary,         # the text summary we got from AI
            "extractedText": extractedText,  # OCR text or document content
            "metadata": metadata,         # extra info like GPS, timestamps, etc
            "vector_data": vector,        # the 1536 numbers for semantic search
            "uploadDate": datetime.utcnow().isoformat(),  # when this was uploaded
            "isDeleted": False            # soft delete flag
        }

        # Step 3: save to Cosmos DB
        # upsert means "update if exists insert if new"
        # but since we're using a new uuid each time i believe this will always insert
        container = self.database.get_container_client("Evidence")
        container.upsert_item(evidence_item)
        print(f"File {fileName} has been processed and stored in the AI Brain.")

    def find_similar_evidence(self, search_text):
        # this function searches for evidence using AI semantic search
        # instead of matching exact keywords, it finds files with similar MEANING
        # for example: searching "gun" might also find "firearm" or "weapon"
        # returns the top 5 most similar pieces of evidence
        
        # Step 1: convert the search text into a vector
        res = self.ai_client.embeddings.create(input=search_text, model="text-embedding-3-small")
        search_vector = res.data[0].embedding

        # Step 2: query Cosmos DB using VectorDistance function
        # VectorDistance compares our search_vector to each document's vector_data
        # it calculates how "close" they are in meaning (lower distance = more similar)
        # we order by distance so the most similar results come first
        query = """
            SELECT TOP 5 c.fileName, c.caseId, c.aiSummary, 
            VectorDistance(c.vector_data, @search_vector) AS similarityScore
            FROM c 
            WHERE c.isDeleted = false
            ORDER BY VectorDistance(c.vector_data, @search_vector)
        """
        
        # Step 3: run the query
        # enable_cross_partition_query=True lets us search across all cases
        # we pass in our search_vector as a parameter to the query
        container = self.database.get_container_client("Evidence")
        results = container.query_items(
            query=query, 
            parameters=[{"name": "@search_vector", "value": search_vector}],
            enable_cross_partition_query=True
        )
        
        # results will have fileName, caseId, aiSummary, and similarityScore
        return list(results)