"use server"
import { generateTopicStrings } from "@/lib/actions/geminiAction";
import { Conversation, User, getUserById } from "@/lib/actions/dbActions";
import { transcribeAudioBlob } from "@/lib/actions/transcribeAction";
import { insertConversation } from "@/lib/actions/dbActions";
import type { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api";

async function responseToConversation(response_text: string, end_length: number, participants: {"name": string, "id": string}[]) : Promise<Omit<Conversation, "id">|null> {
    if (response_text.length < 1) { return null; }
    
    let users = await Promise.all(participants.map((p) => p.id).map(getUserById));

    if (users == null) { return null; }

    let vocab = response_text.split(" ");
    let topics = await generateTopicStrings(response_text);
    if (topics.error != null) { return null; }

    let this_convo_vocab = new Set<string>(vocab);
    let participant1_vocab = new Set<string>((await getUserById(participants[0].id))?.vocab);
    let participant2_vocab = new Set<string>((await getUserById(participants[1].id))?.vocab);
    let participant1_new_vocab = this_convo_vocab.difference(participant1_vocab);
    let participant2_new_vocab = this_convo_vocab.difference(participant2_vocab);

    let dateStamp = new Date();
    let length = end_length; // response.words.at(-1)?.end;

    if (length === undefined) { return null; }
    
    return {
        vocab : vocab,
        new_vocab: [Array.from(participant1_new_vocab), Array.from(participant2_new_vocab)],
        participants: participants,
        topics: topics.topics,
        datestamp : dateStamp,
        length: length,
    }
}

export async function finaliseConversation(recording1: Blob, recording2: Blob, participants: {"name":string,"id":string}[]) {
    if (!["audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm"].includes(recording1.type)) {
        return Promise.reject(new Error("Blob did not contain audio data"));
    }
    if (!["audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm"].includes(recording2.type)) {
        return Promise.reject(new Error("Blob did not contain audio data"));
    }

    let transcribeResult1 = await transcribeAudioBlob(recording1);
    if (transcribeResult1.error) { Promise.reject(new Error("Transcription Error")); }
    let transcribeResult2 = await transcribeAudioBlob(recording2);
    if (transcribeResult2.error) { Promise.reject(new Error("Transcription Error")); }

    let transcribeResult1Response = transcribeResult1.apiresponse;
    let transcribeResult2Response = transcribeResult2.apiresponse;

    let last_time = Math.max(transcribeResult1Response?.words.at(-1)?.end as number, transcribeResult2Response?.words.at(-1)?.end as number);

    let new_conversation = await responseToConversation(transcribeResult1Response?.text + " " + transcribeResult2Response?.text, last_time, participants);
    if (new_conversation == null) { return Promise.reject(new Error("Could not generate conversation")); }

    let pushed_convo = insertConversation(new_conversation);
    if (pushed_convo === null) { Promise.reject(new Error("Could not insert conversation into database")); }
}