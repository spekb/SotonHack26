"use server"
import { generateTopicStrings } from "@/lib/actions/geminiAction";
import { Conversation, User, getUserById } from "@/lib/actions/dbActions";
import { transcribeAudioBlob } from "@/lib/actions/transcribeAction";
import { insertConversation } from "@/lib/actions/dbActions";
import type { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api";

async function responseToConversation(response: SpeechToTextChunkResponseModel, participants: {"name": string, "id": string}[]) : Promise<Omit<Conversation, "id">|null> {
    if (response.words.length < 1) { return null; }
    
    let users = await Promise.all(participants.map((p) => p.id).map(getUserById));

    if (users == null) { return null; }

    let vocab = response.text.split(" ");
    let topics = await generateTopicStrings(response.text);
    if (topics.error != null) { return null; }

    let this_convo_vocab = new Set<string>(vocab);
    let participant1_vocab = new Set<string>((await getUserById(participants[0].id))?.vocab);
    let participant2_vocab = new Set<string>((await getUserById(participants[1].id))?.vocab);
    let participant1_new_vocab = this_convo_vocab.difference(participant1_vocab);
    let participant2_new_vocab = this_convo_vocab.difference(participant2_vocab);

    let dateStamp = new Date();
    let length = response.words.at(-1)?.end;

    if (length === undefined) { return null; }
    
    return {
        vocab : vocab,
        new_vocab: [Array.from(participant1_new_vocab), Array.from(participant2_new_vocab)],
        participants: participants,
        topics: topics.topics,
        dateStamp : dateStamp,
        length: length,
    }
}

async function finaliseConversation(recording: Blob, participants: {"name":string,"id":string}[]) {
    if (!["audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm"].includes(recording.type)) {
        return Promise.reject(new Error("Blob did not contain audio data"));
    }

    let transcribeResult = await transcribeAudioBlob(recording);
    if (transcribeResult.error) { Promise.reject(new Error("Transcription Error")); }

    let new_conversation = await responseToConversation(transcribeResult.apiresponse as SpeechToTextChunkResponseModel, participants);
    if (new_conversation == null) { return Promise.reject(new Error("Could not generate conversation")); }

    let pushed_convo = insertConversation(new_conversation);
    if (pushed_convo === null) { Promise.reject(new Error("Could not insert conversation into database")); }
}