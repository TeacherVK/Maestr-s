// File path: supabase/functions/generate-ai-content/index.ts
// This is an EXAMPLE of what your Supabase Edge Function could look like.
// You would create this file within your Supabase project locally and deploy it.

// FIX: Add type declaration for Deno to satisfy TypeScript in non-Deno environments.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

// --- IMPORTANT ---
// Set your API key in the Supabase project's environment variables (secrets).
// In your Supabase project dashboard: Project Settings > Edge Functions > Add new secret
// 1. Secret name: GEMINI_API_KEY
// 2. Secret value: your_api_key_here
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

serve(async (req) => {
    // This is needed to handle CORS preflight requests.
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!GEMINI_API_KEY) {
            throw new Error("Server configuration error: GEMINI_API_KEY is not set in environment variables.");
        }

        // The body can contain a prompt and an optional config for the model
        const { prompt, config } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Securely call the Gemini API from the server
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            ...(config && { config }), // Spread the config object if it was passed from the client
        });

        // Return the generated content as plain text.
        // The Supabase client library will handle parsing this response.
        return new Response(response.text, {
            headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
        });

    } catch (error) {
        console.error("Error in Edge Function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});