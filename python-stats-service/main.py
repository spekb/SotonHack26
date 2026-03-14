from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import User, Conversation
from stats import calculate_stats
from gemini import generate_conversation_prompt
from database import client, db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get a conversation prompt for two matched users
@app.post("/api/conversation-prompt")
async def get_conversation_prompt(target_language: str, native_language: str, difficulty: str = "beginner"):
    prompt = generate_conversation_prompt(target_language, native_language, difficulty)
    return prompt

# Process a completed conversation and get stats
@app.post("/api/process-conversation")
async def process_conversation(user: User):
    if not user.conversations:
        return {"stats": None, "error": "No conversations yet"}

    conversation = user.conversations[-1]
    stats = calculate_stats(user)

    await db.users.update_one(
        {"id": user.id},
        {
            "$push": {"conversations": conversation.dict()},
            "$set": {"total_time": user.total_time + conversation.length},
            "$addToSet": {"vocab": {"$each": conversation.vocab}}
        },
        upsert=True
    )

    return {"stats": stats}