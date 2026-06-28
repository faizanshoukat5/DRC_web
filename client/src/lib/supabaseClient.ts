import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use implicit flow so password-reset emails contain tokens directly in
    // the URL fragment. This lets the link be opened on any device (including
    // a different device than where the reset was requested, e.g. desktop
    // request → mobile open). PKCE requires the code_verifier to live in the
    // same browser/process that initiated the reset.
    flowType: 'implicit',
  },
});
