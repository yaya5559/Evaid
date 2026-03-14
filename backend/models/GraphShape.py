from enum import Enum
from dataclasses import dataclass
<<<<<<< HEAD
from pydantic import BaseModel
from uuid import UUID
=======
>>>>>>> 8a57c48f (graph model)

class NodeType(str, Enum):
    PERSON = 'person'
    LOCATION = "location"
    EVENT = "event"
    EVIDENCE = "evidence"

<<<<<<< HEAD

=======
>>>>>>> 8a57c48f (graph model)
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
<<<<<<< HEAD
    reason : str 
    source: EdgeSource 
=======
    type : str 
    source: str 
>>>>>>> 8a57c48f (graph model)
    confidence: float | None = None


@dataclass
class GraphResponse:
<<<<<<< HEAD
    case_id: UUID
=======
    case_id: int
>>>>>>> 8a57c48f (graph model)
    nodes: list[GraphNode]
    edges: list[GraphEdge]






