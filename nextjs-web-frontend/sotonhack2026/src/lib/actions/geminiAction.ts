"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateTopicStrings(userText : string) {
    const systemPrompt = "List only the three most major topics spoken about in the following text. Provide your output as JSON in the following format: { \"topics\": [\"topic1\", \"topic2\", ... ] }. Do not wrap your response in a code block.";
    
    if (!userText || userText.trim() === "") {
        return { error: "Please provide some text to send.", topics: [] }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { error: "GEMINI_API_KEY is not set in your environment variables.", topics: [] };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelOptions: any = {
            model: "gemini-2.5-flash",
        };
        
        if (systemPrompt && systemPrompt.trim() !== "") {
            modelOptions.systemInstruction = systemPrompt;
        }

        const model = genAI.getGenerativeModel(modelOptions);

        const result = await model.generateContent(userText);

        const responseText = result.response.text();

        const topicJSON = JSON.parse(responseText) as { "topics" : string[] };

        return {error: null, topics: topicJSON.topics };
    } catch (e: any) {
        console.error("Error connecting to Gemini:", e);
        return {error: `An unexpected error occured ${e.message}`, topics: []}
    }
}

export async function generateText(prevState: any, formData: FormData) {
  const systemPrompt = formData.get("systemPrompt") as string;
  const userPrompt = formData.get("userPrompt") as string;

  if (!userPrompt || userPrompt.trim() === "") {
    return { error: "Please provide some text to send.", text: null };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not set in your environment variables.", text: null };
  }

  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Select the model (gemini-1.5-flash is fast and supports system instructions)
    const modelOptions: any = {
      model: "gemini-2.5-flash",
    };
    
    // Add system instructions if provided
    if (systemPrompt && systemPrompt.trim() !== "") {
      modelOptions.systemInstruction = systemPrompt;
    }

    const model = genAI.getGenerativeModel(modelOptions);

    // Call the API
    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    return { error: null, text: responseText };
  } catch (e: any) {
    console.error("Error connecting to Gemini:", e);
    return { error: `An unexpected error occurred: ${e.message}`, text: null };
  }
}
