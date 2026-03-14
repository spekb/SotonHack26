from collections import Counter
from datetime import datetime, timezone, timedelta
from models import User, Conversation

def calculate_stats(user: User):
    return {
        "new_words_this_week": get_new_words_this_week(user.conversations),
        "most_used_words": Counter(user.vocab).most_common(10),
        "total_interactions": len(user.conversations),
        "total_convo_time_seconds": user.total_time,
        "activity_heatmap": get_activity_heatmap(user.conversations),
        "popular_topics": get_popular_topics(user.conversations),
        "avg_words_per_session": get_avg_words(user.conversations),
        "avg_words_per_turn": get_avg_words_per_turn(user.conversations),
        "new_words_per_minute": get_new_words_per_minute(user.conversations),
    }

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
    # vocab is list[list[str]], so we count all words across all lists for each conversation
    total_words = sum(sum(len(turn) for turn in c.vocab) for c in conversations)
    return total_words / len(conversations)

def get_avg_words_per_turn(conversations: list[Conversation]):
    total_turns = sum(len(c.vocab) for c in conversations)
    if total_turns == 0: return 0
    total_words = sum(len(turn) for c in conversations for turn in c.vocab)
    return total_words / total_turns

def get_new_words_per_minute(conversations: list[Conversation]):
    total_minutes = sum(c.length for c in conversations) / 60
    if total_minutes == 0: return 0
    total_new_words = sum(len(turn) for c in conversations for turn in c.new_vocab)
    return total_new_words / total_minutes
