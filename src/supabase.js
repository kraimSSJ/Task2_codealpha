import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rzioejdhvukqmamdmeqd.supabase.co'
const supabaseKey = 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE'

export const supabase = createClient(supabaseUrl, supabaseKey)