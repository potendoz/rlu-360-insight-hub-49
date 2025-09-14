import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvzgswmdxkybrnznsyih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emdzd21keGt5YnJuem5zeWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNDkxMzcsImV4cCI6MjA2ODcyNTEzN30.sYYV3D90hp0CoX-QK1cNzgk7_WxpLxT3a-gLh1o-0Fk';

export const supabase = createClient(supabaseUrl, supabaseKey);