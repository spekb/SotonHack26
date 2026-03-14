from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import User, Conversation
from stats import calculate_stats, duolingo_to_cefr, duolingo_to_cefr_index
from gemini import generate_conversation_prompt
from database import client, db

CEFR_TO_INDEX = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4, "C2": 5}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        return {
            "stats": {
                "new_words_this_week": [],
                "most_used_words": [],
                "total_interactions": 0,
                "total_convo_time_seconds": 0,
                "activity_heatmap": {},
                "popular_topics": [],
                "avg_words_per_session": 0,
                "new_words_per_minute": 0,
                "weekly_conversation_counts": [0,0,0,0,0,0,0,0],
                "skill_level": user.skill_level,
                "cefr_level": duolingo_to_cefr(user.skill_level) if user.skill_level > 0 else user.cefr_level,
                "cefr_index": duolingo_to_cefr_index(user.skill_level) if user.skill_level > 0 else CEFR_TO_INDEX.get(user.cefr_level, 0),
                "learning_lang": user.learning_langs[0] if user.learning_langs else "Unknown",
            }
        }

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