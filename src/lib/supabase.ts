import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase environment variables not set. Supabase client not initialized.");
  // Provide a mock or dummy client to prevent errors during build
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error("Supabase not initialized") }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: new Error("Supabase not initialized") }) }),
      rpc: () => Promise.resolve({ error: new Error("Supabase not initialized") })
    }),
  } as any;
}

export { supabase };
