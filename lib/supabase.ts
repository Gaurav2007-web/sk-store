import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Remove accidental quotes or spaces
const supabaseUrl = rawUrl.replace(/['"\s]/g, '');
const supabaseAnonKey = rawKey.replace(/['"\s]/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);