"use client";

import { useActionState } from "react";
import { generateText } from "@/lib/actions/geminiAction";

const initialState = {
  error: null as string | null,
  text: null as string | null,
} as any;

export default function GeminiPage() {
  const [state, formAction, isPending] = useActionState(generateText, initialState);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Chat with Google Gemini</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form action={formAction} className="flex flex-col gap-6">
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt (Optional - instructions for the AI's behavior)
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              placeholder="e.g. You are a helpful AI that only replies in pirate speak..."
              rows={2}
              disabled={isPending}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="userPrompt" className="block text-sm font-medium text-gray-700 mb-2">
              User Input
            </label>
            <textarea
              id="userPrompt"
              name="userPrompt"
              required
              placeholder="Ask anything..."
              rows={4}
              disabled={isPending}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className="self-end px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Generating..." : "Send to Gemini"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {state?.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{state.error}</p>
        </div>
      )}

      {/* Success Output */}
      {state?.text && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Gemini Response:</h2>
          <div className="whitespace-pre-wrap text-blue-900 leading-relaxed font-serif">
            {state.text}
          </div>
        </div>
      )}
    </main>
  );
}