// FIX: Add a triple-slash directive to include Vite's client types, which defines `import.meta.env`.
/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// The Supabase URL and anon key are now read from Vite environment variables.
// You will need to create a .env.local file in your project root for local development.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (!supabaseUrl) {
    console.warn("Supabase URL is not configured. The app will run in local-only mode. Create a .env.local file and add VITE_SUPABASE_URL.");
} else if (!supabaseAnonKey) {
    console.warn("Supabase anon key is not configured. The app will run in local-only mode. Create a .env.local file and add VITE_SUPABASE_ANON_KEY.");
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;