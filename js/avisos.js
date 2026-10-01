// ============================================================================
// PORTAL GOULART EDUCA - GESTÃO DO MURAL DE AVISOS (avisos.js)
// ============================================================================

let usuarioAtual = null;
let todosAvisos = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifica autenticação de sessão
  usuarioAtual = obterUsuarioAutenticado();
  if (!usuarioAtual) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Renderiza dados do usuário no cabeçalho
  renderizarInfoUsuario();

  // 3. Exibe o botão de criar aviso caso seja Professor ou Coordenação
  if (['professor', 'coordenacao'].includes(usuarioAtual.perfil)) {
    const btnNovo = document.getElementById('btn-novo-aviso');
    if (btnNovo) btnNovo.style.display = 'inline-flex';
  }

  // 4. Carrega avisos do banco de dados
  await carregarAvisos();
});

// Renderiza dados do usuário logado no topo
function renderizarInfoUsuario() {
  const elNome = document.getElementById('user-display-name');
  const elPerfil = document.getElementById('user-display-role');

  if (elNome) elNome.textContent = usuarioAtual.nome;
  if (elPerfil) {
    const perfisMap = {
      aluno: 'Aluno(a)',
      professor: 'Professor(a)',
      coordenacao: 'Coordenação Pedagógica'
    };
    elPerfil.textContent = perfisMap[usuarioAtual.perfil] || usuarioAtual.perfil;
  }
}

// Carrega os avisos do Supabase
async function carregarAvisos() {
  const container = document.getElementById('lista-avisos-container');
  
  try {
    // Consulta avisos ordenando pelos mais recentes
    const { data: comunicados, error } = await supabaseClient
      .from('comunicados')
      .select('*, usuarios(nome, perfil)')
      .order('data_publicacao', { ascending: false });

    if (error) throw error;

    todosAvisos = comunicados || [];
    filtrarAvisos();

  } catch (err) {
    console.error('Erro ao carregar avisos:', err);
    if (container) {
      container.innerHTML = `
        <div class="card" style="color: var(--danger); text-align: center; padding: 2rem;">
          Falha ao carregar os avisos do banco de dados. Verifique a sua conexão.
        </div>
      `;
    }
  }
}

// Renderiza os cards de avisos aplicando os filtros ativos
function filtrarAvisos() {
  const container = document.getElementById('lista-avisos-container');
  const busca = document.getElementById('search-input').value.toLowerCase();
  const tagFiltro = document.getElementById('filter-tag').value;

  const avisosFiltrados = todosAvisos.filter(aviso => {
    // Regra de Público Alvo
    if (usuarioAtual.perfil === 'aluno' && aviso.publico_alvo === 'professores') return false;
    
    // Extrai tag do texto (caso armazenada no conteúdo ou campo público_alvo)
    const tagAviso = extrairTagDoAviso(aviso);

    // Filtro de Categoria
    if (tagFiltro !== 'todos' && tagAviso !== tagFiltro) return false;

    // Filtro de Texto
    const textoMatch = aviso.titulo.toLowerCase().includes(busca) || aviso.conteudo.toLowerCase().includes(busca);
    return textoMatch;
  });

  if (avisosFiltrados.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
        Nenhum aviso encontrado para os filtros selecionados.
      </div>
    `;
    return;
  }

  container.innerHTML = avisosFiltrados.map(aviso => renderizarCardAviso(aviso)).join('');
}

// Constrói o HTML de um card individual com as permissões corretas
function renderizarCardAviso(aviso) {
  const tag = extrairTagDoAviso(aviso);
  const autorNome = aviso.usuarios ? aviso.usuarios.nome : 'Coordenação';
  const dataFormatada = new Date(aviso.data_publicacao).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Mapeamento de Cores para as Tags
  const badgeClasses = {
    'Urgente': 'badge-danger',
    'Geral': 'badge-primary',
    'Acadêmico': 'badge-warning',
    'Evento': 'badge-success'
  };

  const badgeClass = badgeClasses[tag] || 'badge-primary';

  // REGRA DE PERMISSÃO PARA AÇÕES (EDITAR / EXCLUIR)
  // 1. Coordenação tem acesso livre a TODOS os avisos.
  // 2. Professor só pode alterar/excluir seus PRÓPRIOS avisos.
  const eCoordenacao = usuarioAtual.perfil === 'coordenacao';
  const eDonoDoAviso = aviso.autor_id == usuarioAtual.id;
  const podeGerenciar = eCoordenacao || (usuarioAtual.perfil === 'professor' && eDonoDoAviso);

  const botoesAcao = podeGerenciar ? `
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn" style="padding: 0.35rem 0.7rem; font-size: 0.8rem; background: #f1f5f9; color: var(--text-color);" onclick="prepararEdicao(${aviso.id})">✏️ Editar</button>
      <button class="btn" style="padding: 0.35rem 0.7rem; font-size: 0.8rem; background: #fee2e2; color: var(--danger);" onclick="excluirAviso(${aviso.id})">🗑️ Excluir</button>
    </div>
  ` : '';

  return `
    <div class="card">
      <div class="card-header" style="border-bottom: none; margin-bottom: 0.5rem; padding-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="badge ${badgeClass}">${tag}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">📢 Público: ${aviso.publico_alvo.toUpperCase()}</span>
        </div>
        ${botoesAcao}
      </div>

      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.5rem;">${aviso.titulo}</h3>
      <p style="color: var(--text-color); font-size: 0.95rem; white-space: pre-line; line-height: 1.6; margin-bottom: 1rem;">${limparConteudoAviso(aviso.conteudo)}</p>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); pt: 0.75rem; padding-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
        <span>✍️ Publicado por: <strong>${autorNome}</strong></span>
        <span>📅 ${dataFormatada}</span>
      </div>
    </div>
  `;
}

// Extrai a tag de prioridade do comunicado
function extrairTagDoAviso(aviso) {
  if (aviso.conteudo && aviso.conteudo.startsWith('[TAG:')) {
    const match = aviso.conteudo.match(/^\[TAG:(.*?)\]/);
    if (match) return match[1];
  }
  return 'Geral';
}

// Remove o prefixo de tag na hora de exibir o corpo do texto
function limparConteudoAviso(conteudo) {
  return conteudo.replace(/^\[TAG:.*?\]\n?/, '');
}

// ABRIR E FECHAR MODAL
function abrirModalAviso() {
  document.getElementById('form-aviso').reset();
  document.getElementById('aviso-id').value = '';
  document.getElementById('modal-title').textContent = 'Novo Comunicado';
  document.getElementById('btn-salvar-aviso').textContent = 'Publicar Aviso';
  document.getElementById('modal-aviso').style.display = 'flex';
}

function fecharModalAviso() {
  document.getElementById('modal-aviso').style.display = 'none';
}

// PREPARAR EDIÇÃO DE UM AVISO EXISTENTE
function prepararEdicao(id) {
  const aviso = todosAvisos.find(a => a.id === id);
  if (!aviso) return;

  document.getElementById('aviso-id').value = aviso.id;
  document.getElementById('aviso-titulo').value = aviso.titulo;
  document.getElementById('aviso-tag').value = extrairTagDoAviso(aviso);
  document.getElementById('aviso-publico').value = aviso.publico_alvo;
  document.getElementById('aviso-conteudo').value = limparConteudoAviso(aviso.conteudo);

  document.getElementById('modal-title').textContent = 'Editar Comunicado';
  document.getElementById('btn-salvar-aviso').textContent = 'Salvar Alterações';
  document.getElementById('modal-aviso').style.display = 'flex';
}

// SALVAR (CRIAR OU ATUALIZAR) AVISO
async function salvarAviso(event) {
  event.preventDefault();

  const id = document.getElementById('aviso-id').value;
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const tag = document.getElementById('aviso-tag').value;
  const publico = document.getElementById('aviso-publico').value;
  const textoConteudo = document.getElementById('aviso-conteudo').value.trim();

  // Embutimos a tag no cabeçalho do conteúdo
  const conteudoComTag = `[TAG:${tag}]\n${textoConteudo}`;

  try {
    if (id) {
      // Atualização
      const { error } = await supabaseClient
        .from('comunicados')
        .update({
          titulo: titulo,
          publico_alvo: publico,
          conteudo: conteudoComTag
        })
        .eq('id', id);

      if (error) throw error;
    } else {
      // Inserção de Novo Aviso
      const { error } = await supabaseClient
        .from('comunicados')
        .insert([{
          autor_id: usuarioAtual.id,
          titulo: titulo,
          publico_alvo: publico,
          conteudo: conteudoComTag
        }]);

      if (error) throw error;
    }

    fecharModalAviso();
    await carregarAvisos();

  } catch (err) {
    console.error('Erro ao salvar aviso:', err);
    alert('Erro ao guardar o comunicado. Tente novamente.');
  }
}

// EXCLUIR AVISO
async function excluirAviso(id) {
  if (!confirm('Tem certeza de que deseja apagar este comunicado?')) return;

  try {
    const { error } = await supabaseClient
      .from('comunicados')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await carregarAvisos();
  } catch (err) {
    console.error('Erro ao excluir aviso:', err);
    alert('Erro ao apagar o aviso.');
  }
}