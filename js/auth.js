// ============================================================================
// AUTENTICAÇÃO INTEGRADA AO SUPABASE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const perfil = document.getElementById('perfil') ? document.getElementById('perfil').value : null;
  const errorElement = document.getElementById('login-error');

  if (errorElement) errorElement.style.display = 'none';

  try {
    // Consulta o usuário na tabela 'usuarios' do Supabase
    let query = supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha_hash', senha)
      .eq('ativo', true);

    if (perfil) {
      query = query.eq('perfil', perfil);
    }

    const { data: usuarios, error } = await query;

    if (error) {
      throw error;
    }

    if (!usuarios || usuarios.length === 0) {
      if (errorElement) {
        errorElement.textContent = 'E-mail, senha ou perfil incorretos.';
        errorElement.style.display = 'block';
      }
      return;
    }

    const usuarioLogado = usuarios[0];

    // Atualiza o último acesso
    await supabaseClient
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuarioLogado.id);

    // Salva a sessão no localStorage
    localStorage.setItem('usuario_logado', JSON.stringify({
      id: usuarioLogado.id,
      nome: usuarioLogado.nome,
      email: usuarioLogado.email,
      perfil: usuarioLogado.perfil,
      foto_url: usuarioLogado.foto_url
    }));

    // Redireciona conforme o perfil
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Erro na autenticação:', err);
    if (errorElement) {
      errorElement.textContent = 'Erro ao conectar ao servidor. Verifique a ligação.';
      errorElement.style.display = 'block';
    }
  }
}

function logout() {
  localStorage.removeItem('usuario_logado');
  window.location.href = 'index.html';
}

function obterUsuarioAutenticado() {
  const dados = localStorage.getItem('usuario_logado');
  return dados ? JSON.parse(dados) : null;
}