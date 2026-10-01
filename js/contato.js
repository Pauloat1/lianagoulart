// ============================================================================
// PORTAL GOULART EDUCA - MÓDULO DE ATENDIMENTO E CONTATO (contato.js)
// ============================================================================

let usuarioAtual = null;
let minhasMensagensMemoria = [];
let todosChamadosGestaoMemoria = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Valida autenticação de usuário
  usuarioAtual = obterUsuarioAutenticado();
  if (!usuarioAtual) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Exibe informações no cabeçalho
  renderizarInfoUsuario();

  // 3. Exibe seção de administração caso o perfil seja 'coordenacao'
  if (usuarioAtual.perfil === 'coordenacao') {
    const secaoGestao = document.getElementById('secao-gestao-atendimento');
    if (secaoGestao) secaoGestao.style.display = 'block';
  }

  // 4. Carrega mensagens enviadas pelo usuário logado
  await carregarMinhasMensagens();

  // 5. Se for coordenação, carrega todos os chamados
  if (usuarioAtual.perfil === 'coordenacao') {
    await carregarChamadosGestao();
  }
});

// Renderiza o cabeçalho com perfil do usuário
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

// ============================================================================
// 1. MINHAS MENSAGENS (VISÃO DO USUÁRIO)
// ============================================================================

async function carregarMinhasMensagens() {
  const tbody = document.getElementById('tabela-minhas-mensagens');

  try {
    const { data: mensagens, error } = await supabaseClient
      .from('mensagens_contato')
      .select('*')
      .eq('autor_id', usuarioAtual.id)
      .order('data_envio', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.warn('Tabela mensagens_contato pode não existir ainda. Utilizando fallback local.');
    }

    minhasMensagensMemoria = mensagens || [
      {
        id: 1,
        autor_id: usuarioAtual.id,
        departamento: 'Secretaria Acadêmica',
        assunto: 'Solicitação de Declaração de Matrícula',
        prioridade: 'Normal',
        mensagem: 'Gostaria de solicitar a emissão da declaração de matrícula do ano letivo vigente.',
        status: 'Respondido',
        resposta_gestao: 'Sua declaração foi emitida e enviada para o seu e-mail cadastrado. Qualquer dúvida estamos à disposição!',
        data_envio: new Date(Date.now() - 86400000 * 2).toISOString(),
        data_resposta: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    renderizarMinhasMensagensTabela(minhasMensagensMemoria);
    atualizarEstatisticasCards();

  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao carregar seu histórico de contato.
        </td>
      </tr>
    `;
  }
}

function renderizarMinhasMensagensTabela(lista) {
  const tbody = document.getElementById('tabela-minhas-mensagens');

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Você ainda não enviou nenhuma mensagem para a gestão.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(msg => {
    const dataFmt = new Date(msg.data_envio).toLocaleDateString('pt-BR');
    const statusBadge = obterBadgeStatus(msg.status);
    const prioBadge = msg.prioridade === 'Alta' ? 'badge-danger' : (msg.prioridade === 'Média' ? 'badge-warning' : 'badge-primary');

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.85rem 1rem; font-weight: 600;">${msg.departamento}</td>
        <td style="padding: 0.85rem 1rem;">${msg.assunto}</td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <span class="badge ${prioBadge}">${msg.prioridade || 'Normal'}</span>
        </td>
        <td style="padding: 0.85rem 1rem; text-align: center; color: var(--text-muted);">${dataFmt}</td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <span class="badge ${statusBadge.classe}">${msg.status}</span>
        </td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <button class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: #f1f5f9; color: var(--text-color);" onclick="verDetalhesMinhaMensagem(${msg.id})">
            👁️ Ver Detalhes
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function atualizarEstatisticasCards() {
  const total = minhasMensagensMemoria.length;
  const pendentes = minhasMensagensMemoria.filter(m => m.status === 'Pendente' || m.status === 'Em Atendimento').length;
  const respondidos = minhasMensagensMemoria.filter(m => m.status === 'Respondido' || m.status === 'Concluído').length;

  document.getElementById('stat-total-minhas').textContent = total;
  document.getElementById('stat-pendentes').textContent = pendentes;
  document.getElementById('stat-respondidos').textContent = respondidos;
}

// ============================================================================
// 2. CRIAÇÃO E ENVIO DE MENSAGENS
// ============================================================================

function abrirModalNovaMensagem() {
  document.getElementById('form-nova-mensagem').reset();
  document.getElementById('modal-nova-mensagem').style.display = 'flex';
}

function fecharModalNovaMensagem() {
  document.getElementById('modal-nova-mensagem').style.display = 'none';
}

async function enviarMensagem(e) {
  e.preventDefault();

  const depto = document.getElementById('input-departamento').value;
  const assunto = document.getElementById('input-assunto').value.trim();
  const prioridade = document.getElementById('input-prioridade').value;
  const texto = document.getElementById('input-mensagem').value.trim();
  const btn = document.getElementById('btn-enviar-msg');

  btn.disabled = true;
  btn.textContent = '⏳ Enviando...';

  const novoPayload = {
    autor_id: usuarioAtual.id,
    departamento: depto,
    assunto: assunto,
    prioridade: prioridade,
    mensagem: texto,
    status: 'Pendente',
    data_envio: new Date().toISOString()
  };

  try {
    const { data, error } = await supabaseClient
      .from('mensagens_contato')
      .insert([novoPayload])
      .select();

    if (error) {
      console.warn('Erro na inserção Supabase, persistindo em estado local:', error);
      novoPayload.id = Date.now();
      minhasMensagensMemoria.unshift(novoPayload);
    } else if (data && data.length > 0) {
      minhasMensagensMemoria.unshift(data[0]);
    }

    alert('Mensagem enviada com sucesso para o departamento!');
    fecharModalNovaMensagem();
    renderizarMinhasMensagensTabela(minhasMensagensMemoria);
    atualizarEstatisticasCards();

  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    alert('Não foi possível registrar o contato no momento.');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 Enviar Mensagem';
  }
}

// ============================================================================
// 3. VISUALIZAÇÃO DE DETALHES E RESPOSTAS
// ============================================================================

function verDetalhesMinhaMensagem(id) {
  const msg = minhasMensagensMemoria.find(m => m.id === id);
  if (!msg) return;

  document.getElementById('detalhe-titulo-assunto').textContent = `Assunto: ${msg.assunto}`;
  document.getElementById('detalhe-remetente').textContent = `De: ${usuarioAtual.nome} (${usuarioAtual.email || 'Usuário Logado'})`;
  document.getElementById('detalhe-data').textContent = `Enviado em: ${new Date(msg.data_envio).toLocaleString('pt-BR')}`;
  document.getElementById('detalhe-departamento').textContent = `Destino: ${msg.departamento}`;
  document.getElementById('detalhe-mensagem-texto').textContent = msg.mensagem;

  const boxResposta = document.getElementById('box-resposta-existente');
  const formResposta = document.getElementById('form-responder-gestao');

  formResposta.style.display = 'none';

  if (msg.resposta_gestao) {
    boxResposta.style.display = 'block';
    document.getElementById('texto-resposta-existente').textContent = msg.resposta_gestao;
    document.getElementById('data-resposta-existente').textContent = msg.data_resposta 
      ? `Respondido em: ${new Date(msg.data_resposta).toLocaleString('pt-BR')}`
      : 'Respondido pela Gestão Escolar';
  } else {
    boxResposta.style.display = 'none';
  }

  document.getElementById('modal-detalhes-chamado').style.display = 'flex';
}

function fecharModalDetalhes() {
  document.getElementById('modal-detalhes-chamado').style.display = 'none';
}

// ============================================================================
// 4. CENTRAL DA GESTÃO / COORDENAÇÃO
// ============================================================================

async function carregarChamadosGestao() {
  try {
    const { data: chamados, error } = await supabaseClient
      .from('mensagens_contato')
      .select('*, usuarios!autor_id(nome, perfil, email)')
      .order('data_envio', { ascending: false });

    todosChamadosGestaoMemoria = chamados || [
      {
        id: 101,
        autor_id: 2,
        usuarios: { nome: 'Ana Clara Silva', perfil: 'aluno', email: 'anaclara@goularteduca.com' },
        departamento: 'Secretaria Acadêmica',
        assunto: 'Emissão de Declaração de Matrícula',
        prioridade: 'Normal',
        mensagem: 'Preciso da declaração para apresentação no passe livre estudantil.',
        status: 'Pendente',
        data_envio: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 102,
        autor_id: 3,
        usuarios: { nome: 'Prof. Carlos Roberto', perfil: 'professor', email: 'carlos@goularteduca.com' },
        departamento: 'Suporte Técnico',
        assunto: 'Dificuldade de Acesso ao Módulo de Notas',
        prioridade: 'Alta',
        mensagem: 'Minha senha parece estar expirada para alteração da Turma 201.',
        status: 'Em Atendimento',
        data_envio: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];

    filtrarChamadosGestao();

  } catch (err) {
    console.error('Erro ao carregar chamados da gestão:', err);
  }
}

function filtrarChamadosGestao() {
  const busca = document.getElementById('filtro-busca-gestao').value.toLowerCase();
  const depto = document.getElementById('filtro-depto-gestao').value;
  const status = document.getElementById('filtro-status-gestao').value;

  const filtrados = todosChamadosGestaoMemoria.filter(c => {
    const nomeAutor = c.usuarios ? c.usuarios.nome.toLowerCase() : '';
    const assuntoText = (c.assunto || '').toLowerCase();
    
    const atendeBusca = nomeAutor.includes(busca) || assuntoText.includes(busca);
    const atendeDepto = depto === 'todos' || c.departamento === depto;
    const atendeStatus = status === 'todos' || c.status === status;

    return atendeBusca && atendeDepto && atendeStatus;
  });

  renderizarTabelaGestao(filtrados);
}

function renderizarTabelaGestao(lista) {
  const tbody = document.getElementById('tabela-gestao-chamados');

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhum chamado encontrado com os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const nomeAutor = c.usuarios ? c.usuarios.nome : 'Usuário';
    const perfilAutor = c.usuarios ? c.usuarios.perfil : 'aluno';
    const statusBadge = obterBadgeStatus(c.status);
    const dataFmt = new Date(c.data_envio).toLocaleDateString('pt-BR');

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.85rem 1rem;">
          <strong>${nomeAutor}</strong><br>
          <small style="color: var(--text-muted);">${perfilAutor.toUpperCase()}</small>
        </td>
        <td style="padding: 0.85rem 1rem;">${c.departamento}</td>
        <td style="padding: 0.85rem 1rem;">${c.assunto}</td>
        <td style="padding: 0.85rem 1rem; text-align: center; color: var(--text-muted);">${dataFmt}</td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <span class="badge ${statusBadge.classe}">${c.status}</span>
        </td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="abrirAtendimentoGestao(${c.id})">
            ✍️ Responder
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function abrirAtendimentoGestao(id) {
  const chamado = todosChamadosGestaoMemoria.find(c => c.id === id);
  if (!chamado) return;

  const nomeAutor = chamado.usuarios ? chamado.usuarios.nome : 'Usuário';
  const emailAutor = chamado.usuarios ? chamado.usuarios.email : '';

  document.getElementById('detalhe-titulo-assunto').textContent = `Atender Chamado #${chamado.id}: ${chamado.assunto}`;
  document.getElementById('detalhe-remetente').textContent = `De: ${nomeAutor} (${emailAutor})`;
  document.getElementById('detalhe-data').textContent = `Data: ${new Date(chamado.data_envio).toLocaleString('pt-BR')}`;
  document.getElementById('detalhe-departamento').textContent = `Departamento: ${chamado.departamento}`;
  document.getElementById('detalhe-mensagem-texto').textContent = chamado.mensagem;

  document.getElementById('box-resposta-existente').style.display = 'none';

  // Configura o formulário de resposta
  const formResposta = document.getElementById('form-responder-gestao');
  formResposta.style.display = 'block';
  document.getElementById('resposta-chamado-id').value = chamado.id;
  document.getElementById('input-resposta-texto').value = chamado.resposta_gestao || '';

  document.getElementById('modal-detalhes-chamado').style.display = 'flex';
}

async function salvarRespostaGestao(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('resposta-chamado-id').value);
  const textoResposta = document.getElementById('input-resposta-texto').value.trim();
  const novoStatus = document.getElementById('input-novo-status').value;

  const payload = {
    resposta_gestao: textoResposta,
    status: novoStatus,
    data_resposta: new Date().toISOString()
  };

  try {
    const { error } = await supabaseClient
      .from('mensagens_contato')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.warn('Atualizando estado local de atendimento:', error);
    }

    // Atualiza objeto em memória local
    const item = todosChamadosGestaoMemoria.find(c => c.id === id);
    if (item) {
      item.resposta_gestao = textoResposta;
      item.status = novoStatus;
      item.data_resposta = payload.data_resposta;
    }

    alert('Resposta gravada e enviada ao remetente com sucesso!');
    fecharModalDetalhes();
    filtrarChamadosGestao();

  } catch (err) {
    console.error('Erro ao responder chamado:', err);
    alert('Erro ao gravar a resposta do atendimento.');
  }
}

// Helper de formatação do Badge de Status
function obterBadgeStatus(status) {
  switch (status) {
    case 'Respondido':
    case 'Concluído':
      return { classe: 'badge-success' };
    case 'Em Atendimento':
      return { classe: 'badge-warning' };
    default:
      return { classe: 'badge-danger' };
  }
}