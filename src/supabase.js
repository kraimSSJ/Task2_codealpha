import { createClient } from '@supabase/supabase-js'

// We add an empty string '' as a fallback so the app doesn't "crash" immediately
const supabaseUrl = 'https://rzioejdhvukqmamdmeqd.supabase.co' || ''
const supabaseKey = 'sb_publishable_bXMGG6dHq4UnzSSX5TrDUA_7W3w2G2T' || ''

// This creates the client; if the keys are missing, the app just won't fetch data 
// instead of showing a blank white screen.
export const supabase = createClient(supabaseUrl, supabaseKey)
