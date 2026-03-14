from pydantic import BaseModel
from datetime import datetime

class Participant(BaseModel):
    name: str
    id: str

class Conversation(BaseModel):
    id: str                        # NEW
    vocab: list[str]               # changed from list[list[str]]
    new_vocab: list[list[str]]
    participants: list[Participant]
    topics: list[str]
    datestamp: datetime
    length: int

class User(BaseModel):
    id: str
    name: str
    total_time: float
    conversations: list[Conversation]
    vocab: list[str]
    native_lang: str
    learning_langs: list[str]
    skill_level: int
    cefr_level: str = "A1"   # NEW — default A1