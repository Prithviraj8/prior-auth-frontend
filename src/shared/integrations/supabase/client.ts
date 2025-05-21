import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase client...');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase.from('auth_requests').select('count').then(
  ({ data, error }) => {
    console.log('Supabase connection test:', { data, error });
  }
); 