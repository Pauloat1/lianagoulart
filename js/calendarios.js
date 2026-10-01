// ============================================================================
// PORTAL GOULART EDUCA - GESTÃO DO CALENDÁRIO ACADÊMICO (calendarios.js)
// ============================================================================

let usuarioAtual = null;
let todosEventos = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifica autenticação de sessão
  usuarioAtual = obterUsuarioAutenticado();
  if (!usuarioAtual) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Renderiza dados do usuário no cabeçalho
  renderizarInfoUsuario();

  // 3. Exibe o botão de criar agendamento caso seja Professor ou Coordenação
  if (['professor', 'coordenacao'].includes(usuarioAtual.perfil)) {
    const btnNovo = document.getElementById('btn-novo-evento');
    if (btnNovo) btnNovo.style.display = 'inline-flex';
  }

  // 4. Carrega os eventos do banco de dados
  await carregarEventos();
});

// Renderiza informações do usuário no topo
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

// Carrega os dados do Supabase
async function carregarEventos() {
  const container = document.getElementById('lista-eventos-container');

  try {
    const { data: eventos, error } = await supabaseClient
      .from('calendario')
      .select('*, usuarios(nome, perfil)')
      .order('data_evento', { ascending: true });

    if (error) throw error;

    todosEventos = eventos || [];
    filtrarEventos();

  } catch (err) {
    console.error('Erro ao carregar calendário:', err);
    if (container) {
      container.innerHTML = `
        <div class="card" style="color: var(--danger); text-align: center; padding: 2rem;">
          Falha ao carregar o calendário. Verifique sua conexão com o banco de dados.
        </div>
      `;
    }
  }
}

// Aplica os filtros de tipo, mês e busca
function filtrarEventos() {
  const container = document.getElementById('lista-eventos-container');
  const busca = document.getElementById('search-input').value.toLowerCase();
  const tipoFiltro = document.getElementById('filter-tipo').value;
  const mesFiltro = document.getElementById('filter-mes').value;

  const eventosFiltrados = todosEventos.filter(evento => {
    const d = new Date(evento.data_evento);
    
    // Filtro por Mês
    if (mesFiltro !== 'todos' && d.getMonth().toString() !== mesFiltro) return false;

    // Filtro por Tipo
    if (tipoFiltro !== 'todos' && evento.tipo !== tipoFiltro) return false;

    // Filtro por Texto
    const textoMatch = (evento.titulo || '').toLowerCase().includes(busca) || 
                       (evento.descricao || '').toLowerCase().includes(busca);
    return textoMatch;
  });

  if (eventosFiltrados.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
        Nenhum evento ou entrega agendada para os filtros selecionados.
      </div>
    `;
    return;
  }

  container.innerHTML = eventosFiltrados.map(evento => renderizarCardEvento(evento)).join('');
}

// Renderiza um card individual do evento
function renderizarCardEvento(evento) {
  const autorNome = evento.usuarios ? evento.usuarios.nome : 'Coordenação';
  const dataObj = new Date(evento.data_evento);

  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  // Mapeamento de Badges e Ícones por tipo
  const tipoConfig = {
    'atividade': { label: '📝 Atividade / Entrega', badge: 'badge-primary' },
    'prova': { label: '✏️ Prova / Avaliação', badge: 'badge-danger' },
    'evento': { label: '🎉 Evento Escolar', badge: 'badge-success' }
  };

  const config = tipoConfig[evento.tipo] || { label: '📌 Agendamento', badge: 'badge-warning' };

  // PERMISSÕES DE EDIÇÃO E EXCLUSÃO
  // Coordenação: altera QUALQUER agendamento.
  // Professor: altera apenas AGENDAMENTOS de sua autoria.
  const eCoordenacao = usuarioAtual.perfil === 'coordenacao';
  const eDono = evento.autor_id == usuarioAtual.id;
  const podeGerenciar = eCoordenacao || (usuarioAtual.perfil === 'professor' && eDono);

  const botoesAcao = podeGerenciar ? `
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn" style="padding: 0.35rem 0.7rem; font-size: 0.8rem; background: #f1f5f9; color: var(--text-color);" onclick="prepararEdicao(${evento.id})">✏️ Editar</button>
      <button class="btn" style="padding: 0.35rem 0.7rem; font-size: 0.8rem; background: #fee2e2; color: var(--danger);" onclick="excluirEvento(${evento.id})">🗑️ Excluir</button>
    </div>
  ` : '';

  return `
    <div class="card" style="border-left: 4px solid var(--primary-color);">
      <div class="card-header" style="border-bottom: none; margin-bottom: 0.5rem; padding-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge ${config.badge}">${config.label}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">🏫 ${evento.turma || 'Geral'}</span>
        </div>
        ${botoesAcao}
      </div>

      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.35rem;">${evento.titulo}</h3>
      ${evento.descricao ? `<p style="color: var(--text-color); font-size: 0.95rem; line-height: 1.5; margin-bottom: 0.75rem;">${evento.descricao}</p>` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; gap: 0.5rem;">
        <span>📅 <strong>Data limite:</strong> ${dataFormatada} às ${horaFormatada}</span>
        <span>✍️ Criado por: <strong>${autorNome}</strong></span>
      </div>
    </div>
  `;
}

// Configura opções do Modal conforme as regras de negócio do perfil
function abrirModalEvento() {
  document.getElementById('form-evento').reset();
  document.getElementById('evento-id').value = '';
  document.getElementById('modal-title').textContent = 'Novo Agendamento';
  document.getElementById('btn-salvar-evento').textContent = 'Agendar';

  const selectTipo = document.getElementById('evento-tipo');

  // REGRA DE PERFIL PARA OPÇÕES DO SELECT:
  // - Professores: colocam apenas entregas de suas atividades.
  // - Coordenação: coloca datas de eventos e provas (além de atividades se necessário).
  if (usuarioAtual.perfil === 'professor') {
    selectTipo.innerHTML = `<option value="atividade">📝 Entrega de Atividade / Trabalho</option>`;
  } else if (usuarioAtual.perfil === 'coordenacao') {
    selectTipo.innerHTML = `
      <option value="prova">✏️ Prova / Avaliação</option>
      <option value="evento">🎉 Evento Escolar</option>
      <option value="atividade">📝 Entrega de Atividade</option>
    `;
  }

  document.getElementById('modal-evento').style.display = 'flex';
}

function fecharModalEvento() {
  document.getElementById('modal-evento').style.display = 'none';
}

// Prepara formulário para edição de agendamento existente
function prepararEdicao(id) {
  const evento = todosEventos.find(e => e.id === id);
  if (!evento) return;

  abrirModalEvento();

  document.getElementById('evento-id').value = evento.id;
  document.getElementById('evento-titulo').value = evento.titulo;
  document.getElementById('evento-tipo').value = evento.tipo;
  document.getElementById('evento-turma').value = evento.turma || 'Todas';
  document.getElementById('evento-descricao').value = evento.descricao || '';

  if (evento.data_evento) {
    const d = new Date(evento.data_evento);
    const formattedDate = d.toISOString().slice(0, 16);
    document.getElementById('evento-data').value = formattedDate;
  }

  document.getElementById('modal-title').textContent = 'Editar Agendamento';
  document.getElementById('btn-salvar-evento').textContent = 'Salvar Alterações';
}

// Salva (cria ou atualiza) um agendamento no Supabase
async function salvarEvento(e) {
  e.preventDefault();

  const id = document.getElementById('evento-id').value;
  const titulo = document.getElementById('evento-titulo').value.trim();
  const tipo = document.getElementById('evento-tipo').value;
  const data = document.getElementById('evento-data').value;
  const turma = document.getElementById('evento-turma').value;
  const descricao = document.getElementById('evento-descricao').value.trim();

  const payload = {
    autor_id: usuarioAtual.id,
    titulo: titulo,
    tipo: tipo,
    data_evento: new Date(data).toISOString(),
    turma: turma,
    descricao: descricao
  };

  try {
    if (id) {
      const { error } = await supabaseClient
        .from('calendario')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('calendario')
        .insert([payload]);

      if (error) throw error;
    }

    fecharModalEvento();
    await carregarEventos();

  } catch (err) {
    console.error('Erro ao salvar agendamento:', err);
    alert('Não foi possível salvar o agendamento no banco de dados.');
  }
}

// Exclui um agendamento
async function excluirEvento(id) {
  if (!confirm('Deseja realmente apagar este agendamento do calendário?')) return;

  try {
    const { error } = await supabaseClient
      .from('calendario')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await carregarEventos();
  } catch (err) {
    console.error('Erro ao excluir agendamento:', err);
    alert('Erro ao excluir o agendamento.');
  }
}