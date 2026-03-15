# import google.generativeai as genai # type: ignore
# import os, json
# from dotenv import load_dotenv

# load_dotenv()

# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# model = genai.GenerativeModel("gemma-3-1b-it")

# def generate_conversation_prompt(target_language: str, native_language: str, difficulty: str = "beginner") -> dict:
#     prompt = f"""
#     You are helping two people practice {target_language} together. 
#     One or both speakers are native {native_language} speakers learning {target_language}.
#     Difficulty level: {difficulty}

#     Generate a conversation starter to get them talking. Return ONLY valid JSON with:
#     - topic: the conversation topic (e.g. "Ordering food at a restaurant")
#     - opening_line: a suggested opening line in {target_language}
#     - opening_line_translation: the translation in {native_language}
#     - suggested_vocab: list of 5 useful words/phrases for this topic in {target_language} with translations
#     - tips: 1-2 short tips for this conversation

#     Respond ONLY with valid JSON, no markdown.
#     """
#     response = model.generate_content(prompt)
#     return json.loads(response.text)

import google.generativeai as genai # type: ignore
import os, json, re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemma-3-1b-it")
# model = genai.GenerativeModel("gemini-2.5-flash")

def generate_conversation_prompt(target_language: str, native_language: str, difficulty: str = "beginner") -> dict:
    prompt = f"""
    You are helping two people practice {target_language} together. 
    One or both speakers are native {native_language} speakers learning {target_language}.
    Difficulty level: {difficulty}

    Generate a conversation starter to get them talking. Return ONLY valid JSON with:
    - topic: the conversation topic (e.g. "Ordering food at a restaurant")
    - opening_line: a suggested opening line in {target_language}
    - opening_line_translation: the translation in {native_language}
    - suggested_vocab: list of 5 useful words/phrases for this topic in {target_language} with translations
    - tips: 1-2 short tips for this conversation

    Respond ONLY with valid JSON, no markdown, no code fences, no explanation.
    """
    response = model.generate_content(prompt)

    if not response.candidates:
        raise ValueError("No candidates returned — response may have been blocked")

    text = response.text.strip()

    # Strip markdown code fences if model ignores instructions
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    if not text:
        finish_reason = response.candidates[0].finish_reason
        raise ValueError(f"Empty response from model. Finish reason: {finish_reason}")

    return json.loads(text)