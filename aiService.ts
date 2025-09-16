import { supabase } from './supabaseClient.ts';

/**
 * Invokes a Supabase Edge Function to generate content using the AI model.
 * This acts as a secure proxy to the Gemini API.
 * @param functionName The name of the Supabase Edge Function to invoke.
 * @param body The payload to send to the function (e.g., { prompt: 'Your prompt here' }).
 * @returns The data returned from the Edge Function (typically the AI-generated text).
 */
export const invokeAIFunction = async (functionName: string, body: Record<string, any>): Promise<any> => {
    if (!supabase) {
        throw new Error("Supabase client is not initialized. User might not be authenticated.");
    }
    
    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
    });

    if (error) {
        console.error(`Error invoking Supabase function '${functionName}':`, error);
        throw new Error(error.message);
    }

    return data;
};
