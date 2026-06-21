import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-workout-summary`
export const PAYMENT_EDGE_URL  = `${SUPABASE_URL}/functions/v1/initiate-payment`
