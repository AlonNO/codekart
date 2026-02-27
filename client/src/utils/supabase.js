import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jacgotvppetopxcrldgb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphY2dvdHZwcGV0b3B4Y3JsZGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODg1MzIsImV4cCI6MjA4Nzc2NDUzMn0.1xCgg-wCc3GZlaZQUm5laGfz5w7VoIaJ3zjPxK1ogpM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);