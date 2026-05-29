// ═══════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ▶ Substitua os valores abaixo com os do seu projeto Supabase:
//   Project Settings → API → Project URL e anon public key
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://zuzxxpebkyelnikltsro.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YwlEdD7OmbUpGnjDUCnffQ_F9fuEy0O';

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
