from collections import Counter
from datetime import datetime, timezone, timedelta
from models import User, Conversation

CEFR_TO_INDEX = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4, "C2": 5}

def calculate_stats(user: User):
    return {
        "new_words_this_week": get_new_words_this_week(user.conversations),
        "most_used_words": Counter(user.vocab).most_common(10),
        "total_interactions": len(user.conversations),
        "total_convo_time_seconds": user.total_time,
        "activity_heatmap": get_activity_heatmap(user.conversations),
        "popular_topics": get_popular_topics(user.conversations),
        "avg_words_per_session": get_avg_words(user.conversations),
        "new_words_per_minute": get_new_words_per_minute(user.conversations),
        "weekly_conversation_counts": get_weekly_conversation_counts(user.conversations),  # NEW
        "skill_level": user.skill_level,  # NEW
        "cefr_level": duolingo_to_cefr(user.skill_level),        # e.g. "B2"
        "cefr_index": duolingo_to_cefr_index(user.skill_level),  # e.g. 3
        "learning_lang": user.learning_langs[0] if user.learning_langs else "Unknown",
        "vocab_size": len(user.vocab),
    }

def duolingo_to_cefr(skill_level: int) -> str:
    if skill_level <= 10:
        return "A1"
    elif skill_level <= 30:
        return "A2"
    elif skill_level <= 60:
        return "B1"
    elif skill_level <= 100:
        return "B2"
    elif skill_level <= 130:
        return "C1"
    else:
        return "C2"

def duolingo_to_cefr_index(skill_level: int) -> int:
    mapping = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4, "C2": 5}
    return mapping[duolingo_to_cefr(skill_level)]

def get_weekly_conversation_counts(conversations: list[Conversation]):
    """Returns conversation counts for the last 8 weeks, oldest first."""
    now = datetime.now(timezone.utc)
    weeks = []
    for i in range(7, -1, -1):  # 8 weeks ago to this week
        week_start = now - timedelta(weeks=i+1)
        week_end = now - timedelta(weeks=i)
        count = sum(1 for c in conversations if week_start <= c.datestamp < week_end)
        weeks.append(count)
    return weeks

def get_popular_topics(conversations: list[Conversation]):
    all_topics = [t for c in conversations for t in c.topics]
    return Counter(all_topics).most_common(5)

def get_activity_heatmap(conversations: list[Conversation]):
    dates = [c.datestamp.date().isoformat() for c in conversations]
    return Counter(dates)

def get_new_words_this_week(conversations: list[Conversation]):
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = [c for c in conversations if c.datestamp >= week_ago]
    # new_vocab is list[list[str]], so we flatten it
    return list({w for c in recent for turn in c.new_vocab for w in turn})

def get_avg_words(conversations: list[Conversation]):
    if not conversations:
        return 0
    total_words = sum(len(c.vocab) for c in conversations)  # no more nested loop
    return total_words / len(conversations)

def get_new_words_per_minute(conversations: list[Conversation]):
    total_minutes = sum(c.length for c in conversations) / 60
    if total_minutes == 0: return 0
    total_new_words = sum(len(turn) for c in conversations for turn in c.new_vocab)
    return total_new_words / total_minutes
