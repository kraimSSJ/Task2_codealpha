import { createClient } from '@supabase/supabase-js'

// We add an empty string '' as a fallback so the app doesn't "crash" immediately
const supabaseUrl = 'https://rzioejdhvukqmamdmeqd.supabase.co' || ''
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aW9lamRodnVrcW1hbWRtZXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDY3MDAsImV4cCI6MjA4ODU4MjcwMH0.t6LacKAYmCCT2_5F0ug1TzLDWE-3AfdREUJsVDI7-L0' || ''

// This creates the client; if the keys are missing, the app just won't fetch data 
// instead of showing a blank white screen.
export const supabase = createClient(supabaseUrl, supabaseKey)
