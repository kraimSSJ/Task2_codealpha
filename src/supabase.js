import { createClient } from '@supabase/supabase-js'

// We add an empty string '' as a fallback so the app doesn't "crash" immediately
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// This creates the client; if the keys are missing, the app just won't fetch data 
// instead of showing a blank white screen.
export const supabase = createClient(supabaseUrl, supabaseKey)
