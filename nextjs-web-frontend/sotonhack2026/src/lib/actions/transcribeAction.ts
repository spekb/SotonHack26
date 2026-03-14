"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function transcribeAudio(prevState: any, formData: FormData) {
  const file = formData.get("audio");
  
  if (!file || typeof file === "string" || file.size === 0) {
    return { 
      error: `Please provide a valid audio file. Received: ${typeof file === 'string' ? 'string (missing encType?)' : 'empty file'}`, 
      apiresponse: null 
    };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { error: "ELEVENLABS_API_KEY is not set in environment variables.", apiresponse: null };
  }

  try {
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const response = await client.speechToText.convert({
      file: file,
      modelId: "scribe_v2", // Using the recommended model
    });

    return { error: null, apiresponse: response };
  } catch (e: any) {
    console.error("Error connecting to ElevenLabs:", e);
    return { error: `An unexpected error occurred: ${e.message}`, apiresponse: null };
  }
}
