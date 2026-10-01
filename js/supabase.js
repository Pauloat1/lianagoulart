// ============================================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO DO CLIENTE SUPABASE
// ============================================================================

// Substitua pelas credenciais do seu projeto no Supabase
const SUPABASE_URL = 'https://qqesxbspnjohcefqgxkm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9_HF_Z_KwytvHSoR7Nh1Pg_Z9PZOybS';

// Inicializa o cliente do Supabase
if (typeof supabase === 'undefined') {
  console.error('O SDK do Supabase não foi carregado. Adicione a tag <script> no HTML.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);