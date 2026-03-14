"use client";

import { useActionState } from "react";
import { transcribeAudio } from "@/lib/actions/transcribeAction";
import type { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api";

const initialState = {
  error: null as string | null,
  apiresponse: null as SpeechToTextChunkResponseModel | null,
} as any;


export default function UploadPage() {
  const [state, formAction, isPending] = useActionState(transcribeAudio, initialState);

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Upload Audio for Transcription</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-6">
          <div>
            <label htmlFor="audio" className="block text-sm font-medium text-gray-700 mb-2">
              Select an audio file (.mp3, .wav, etc.)
            </label>
            <input
              type="file"
              id="audio"
              name="audio"
              accept="audio/*"
              required
              disabled={isPending}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Transcribing with ElevenLabs..." : "Upload & Transcribe"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{state.error}</p>
        </div>
      )}

      {/* Success Output */}
      {state.apiresponse && (
        <>
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-md shadow-sm overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Transcription Result:</h2>
          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif">
            {JSON.stringify(state.apiresponse, null, 2)}
          </pre>
        </div>
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-md shadow-sm overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Transcription Result:</h2>
          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif">
            {JSON.stringify(state.apiresponse, null, 2)}
          </pre>
        </div>
        </>
      )}
    </main>
  );
}
