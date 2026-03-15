from enum import Enum
from dataclasses import dataclass
<<<<<<< HEAD
from pydantic import BaseModel

from uuid import UUID

=======
>>>>>>> 2932d978 (graph backend)

class NodeType(str, Enum):
    PERSON = 'person'
    LOCATION = "location"
    EVENT = "event"
    EVIDENCE = "evidence"

<<<<<<< HEAD

=======
>>>>>>> 2932d978 (graph backend)
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
    type : str 
    source: str 
    confidence: float | None = None


@dataclass
class GraphResponse:
    case_id: UUID
    nodes: list[GraphNode]
    edges: list[GraphEdge]






