from enum import Enum
from dataclasses import dataclass
from pydantic import BaseModel
from uuid import UUID

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
    reason : str 
    source: EdgeSource 
    confidence: float | None = None


@dataclass
class GraphResponse:
    case_id: UUID
    nodes: list[GraphNode]
    edges: list[GraphEdge]






