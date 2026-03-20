from enum import Enum
from dataclasses import dataclass
<<<<<<< HEAD
=======
from pydantic import BaseModel
from uuid import UUID
>>>>>>> e40537b6 (upload evidence done)

class NodeType(str, Enum):
    PERSON = 'person'
    LOCATION = "location"
    EVENT = "event"
    EVIDENCE = "evidence"

class EdgeSource(str, Enum):
    AI = "AI"
    USER="USER"


@dataclass
class GraphNode:
    id: str
    type:NodeType
    label: str
    source: str

@dataclass
class GraphEdge:
    id: str
    From: str #node id
    to: str #node id
    type : str 
    source: str 
    confidence: float | None = None


@dataclass
class GraphResponse:
    case_id: UUID
    nodes: list[GraphNode]
    edges: list[GraphEdge]






