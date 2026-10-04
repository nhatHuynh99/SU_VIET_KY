/* Supabase client for the static Sử Việt Ký app. */
const SUPABASE_URL = "https://ifxtcfnfjiltdxsfxjjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_z3ZM2Nr-M_iPScVdNHFGTA_lSKcVplt";

window.suvietSupabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

window.supabaseReady = Boolean(window.suvietSupabase);
