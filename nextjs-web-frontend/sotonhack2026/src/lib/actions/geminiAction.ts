"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
// import ollama from "ollama"


//  const USE_OLLAMA = true;
const USE_OLLAMA = false;


function stripCodeBlock(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)```$/);
  if (match) {
    return match[1].trim();
  }
  return text;
}

async function generateText(systemPrompt: string, userPrompt: string) {
  if (!userPrompt || userPrompt.trim() === "") {
    return { error: "Please provide some text to send.", text: "" }
  }

  if (!USE_OLLAMA) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { error: "GEMINI_API_KEY is not set in your environment variables.", text: "" };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const modelOptions: any = {
        model: "gemini-3.1-flash-lite-preview" //"gemini-2.5-flash" "gemma-3-1b-it"
      };

      let finalUserPrompt = userPrompt;

      if (systemPrompt && systemPrompt.trim() !== "") {
        if (modelOptions.model.includes("gemini")) {
          modelOptions.systemInstruction = systemPrompt;
        } else {
          finalUserPrompt = `${systemPrompt}\n\n${userPrompt}`;
        }
      }

      const model = genAI.getGenerativeModel(modelOptions);

      const result = await model.generateContent(finalUserPrompt);

      const responseText = result.response.text();

      return { error: null, text: responseText };
    } catch (e: any) {
      console.error("Error connecting to Gemini:", e);
      return { error: `An unexpected error occured ${e.message}`, text: "" }
    }
  } else {
    try {
      const response = await ollama.generate({
        model: "gemma3n", // "gemma3n:e4b" "gemma3:4b"
        system: systemPrompt,
        prompt: userPrompt,
        think: false,
        keep_alive: "3m"
      });

      return { error: null, text: response.response }

    } catch (e: any) {
      console.error("Error connecting to Ollama:", e);
      return { error: `An unexpected error ocurred ${e.message}`, text: "" }
    }
  }

}

export async function generateTopicStrings(userText: string) {
  const systemPrompt = "List only the three most major topics spoken about in the following text. Provide your output as JSON in the following format: { \"topics\": [\"topic1\", \"topic2\", ... ] }. Do not wrap your response in a code block.";

  let text = await generateText(systemPrompt, userText);
  if (text.error) { return { error: text.error, topics: [] }; }
  else return { error: null, topics: JSON.parse(stripCodeBlock(text.text)).topics as string[] }
}

export async function generateTextForm(prevState: any, formData: FormData) {
  const systemPrompt = formData.get("systemPrompt") as string;
  const userPrompt = formData.get("userPrompt") as string;

  return generateText(systemPrompt, userPrompt);
}

export async function generateNewPrompts(cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2", language: string, num_prompts: number) {
  const systemPrompt = `Create ${num_prompts} short conversation prompts at the CEFR level ${cefr_level} in ${language}. 
  They should also prompt discussion using vocabulary and grammatical structures expected of CEFR level ${cefr_level}. 
  They should be no more than 10 words and be quite open ended. Provide your output as JSON in the following format:
  { \"prompts\":[\"prompt1\", \"prompt2\", ...]}. Do not wrap your response in a code block.`

  let text = await generateText("", systemPrompt);
  if (text.error) { return { error: text.error, topics: [] }; }
  else {


    try {
      return { error: null, prompts: JSON.parse(stripCodeBlock(text.text)).prompts as string[] }
    } catch {
      console.error(text.text);
      return { error: null, prompts: [] }
    }
  }
}