import { createClient } from '@supabase/supabase-js'

// This tells the app to look at the "Environment Variables" we set in Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)