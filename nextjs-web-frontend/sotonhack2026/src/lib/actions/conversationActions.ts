"use server"
import { generateTopicStrings } from "@/lib/actions/geminiAction";
import { Conversation, User, getUserById } from "@/lib/actions/dbActions";
import type { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api";

async function responseToConversation(response: SpeechToTextChunkResponseModel, pariticipants: {"name": string, "id": string}[]) {
    if (response.words.length < 1) { return null; }
    
    let users = await Promise.all(pariticipants.map((p) => p.id).map(getUserById));
    let vocab = response.text.split(" ");
    let topics = generateTopicStrings(response.text);
    let dateStamp = new Date();
    let length = response.words.at(-1)?.end;

    if (length === undefined) { return null; }
    
    return {
        "users" : users,
        "vocab" : vocab,
        "topics": topics,
        "dateStamp" : dateStamp,
        "length" : length
    }
}