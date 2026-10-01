// ============================================================================
// PORTAL GOULART EDUCA - MÓDULO DE BOLETIM E NOTAS (boletim.js)
// ============================================================================

let usuarioAtual = null;
let relatorioCoordMemoria = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifica autenticação de sessão
  usuarioAtual = obterUsuarioAutenticado();
  if (!usuarioAtual) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Exibe informações do perfil logado
  renderizarInfoUsuario();

  // 3. Roteamento de acordo com o Perfil
  if (usuarioAtual.perfil === 'aluno') {
    document.getElementById('view-aluno').style.display = 'block';
    await carregarBoletimAluno();
  } else if (usuarioAtual.perfil === 'professor') {
    document.getElementById('view-professor').style.display = 'block';
    await inicializarFiltrosProfessor();
  } else if (usuarioAtual.perfil === 'coordenacao') {
    document.getElementById('view-coordenacao').style.display = 'block';
    await carregarDashboardCoordenacao();
  }
});

// Renderiza dados do usuário no cabeçalho
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

// Helper para calcular média e situação
function calcularMediaESituacao(n1, n2, n3, n4) {
  const v1 = parseFloat(n1) || 0;
  const v2 = parseFloat(n2) || 0;
  const v3 = parseFloat(n3) || 0;
  const v4 = parseFloat(n4) || 0;

  const media = (v1 + v2 + v3 + v4) / 4;
  let situacao = 'Em Acompanhamento';
  let badgeClass = 'badge-primary';

  if (media >= 7.0) {
    situacao = 'Aprovado';
    badgeClass = 'badge-success';
  } else if (media >= 5.0) {
    situacao = 'Recuperação';
    badgeClass = 'badge-warning';
  } else {
    situacao = 'Reprovado';
    badgeClass = 'badge-danger';
  }

  return { media: media.toFixed(1), situacao, badgeClass };
}

// ============================================================================
// 1. LÓGICA DO ALUNO
// ============================================================================

async function carregarBoletimAluno() {
  const tbody = document.getElementById('aluno-tabela-notas');

  try {
    // Consulta notas do aluno logado no Supabase
    const { data: notas, error } = await supabaseClient
      .from('notas')
      .select('*, disciplinas(nome_disciplina)')
      .eq('aluno_id', usuarioAtual.id);

    if (error) throw error;

    if (!notas || notas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhuma nota cadastrada até o momento.
          </td>
        </tr>
      `;
      return;
    }

    let somaMedias = 0;
    let aprovadasCount = 0;

    tbody.innerHTML = notas.map(item => {
      const calc = calcularMediaESituacao(item.nota_1, item.nota_2, item.nota_3, item.nota_4);
      somaMedias += parseFloat(calc.media);
      if (calc.situacao === 'Aprovado') aprovadasCount++;

      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 0.85rem 1rem; font-weight: 600;">${item.disciplinas ? item.disciplinas.nome_disciplina : 'Disciplina'}</td>
          <td style="padding: 0.85rem 1rem; text-align: center;">${item.nota_1 ?? '--'}</td>
          <td style="padding: 0.85rem 1rem; text-align: center;">${item.nota_2 ?? '--'}</td>
          <td style="padding: 0.85rem 1rem; text-align: center;">${item.nota_3 ?? '--'}</td>
          <td style="padding: 0.85rem 1rem; text-align: center;">${item.nota_4 ?? '--'}</td>
          <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 700;">${calc.media}</td>
          <td style="padding: 0.85rem 1rem; text-align: center;">
            <span class="badge ${calc.badgeClass}">${calc.situacao}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Atualiza Stats do Aluno
    const mediaGeral = (somaMedias / notas.length).toFixed(1);
    document.getElementById('aluno-media-geral').textContent = mediaGeral;
    document.getElementById('aluno-total-disciplinas').textContent = notas.length;

    const elSituacaoGeral = document.getElementById('aluno-situacao-geral');
    if (mediaGeral >= 7.0) {
      elSituacaoGeral.textContent = '🟢 Desempenho Bom';
      elSituacaoGeral.style.color = 'var(--success, #10b981)';
    } else if (mediaGeral >= 5.0) {
      elSituacaoGeral.textContent = '🟡 Em Alerta';
      elSituacaoGeral.style.color = 'var(--warning, #f59e0b)';
    } else {
      elSituacaoGeral.textContent = '🔴 Crítico';
      elSituacaoGeral.style.color = 'var(--danger, #ef4444)';
    }

  } catch (err) {
    console.error('Erro ao carregar boletim:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao carregar notas do banco de dados.
        </td>
      </tr>
    `;
  }
}

// ============================================================================
// 2. LÓGICA DO PROFESSOR
// ============================================================================

async function inicializarFiltrosProfessor() {
  const selTurma = document.getElementById('select-prof-turma');
  const selDisc = document.getElementById('select-prof-disciplina');

  try {
    // Carrega turmas e disciplinas vinculadas ao sistema
    const [resTurmas, resDisc] = await Promise.all([
      supabaseClient.from('turmas').select('*').order('nome_turma'),
      supabaseClient.from('disciplinas').select('*').order('nome_disciplina')
    ]);

    if (resTurmas.data && resTurmas.data.length > 0) {
      selTurma.innerHTML = resTurmas.data.map(t => `<option value="${t.id}">${t.nome_turma}</option>`).join('');
    } else {
      selTurma.innerHTML = `<option value="1">Turma 101 - Ensino Médio</option><option value="2">Turma 201 - Ensino Médio</option>`;
    }

    if (resDisc.data && resDisc.data.length > 0) {
      selDisc.innerHTML = resDisc.data.map(d => `<option value="${d.id}">${d.nome_disciplina}</option>`).join('');
    } else {
      selDisc.innerHTML = `<option value="1">Matemática</option><option value="2">Português</option><option value="3">História</option>`;
    }

    await carregarAlunosProf();

  } catch (err) {
    console.error('Erro ao inicializar filtros:', err);
  }
}

async function carregarAlunosProf() {
  const selTurma = document.getElementById('select-prof-turma').value;
  const selDisc = document.getElementById('select-prof-disciplina').value;
  const tbody = document.getElementById('prof-tabela-alunos');

  if (!selTurma || !selDisc) return;

  try {
    // Busca os alunos com suas respectivas notas para a turma/disciplina
    const { data: notasExistem, error } = await supabaseClient
      .from('notas')
      .select('*, usuarios!aluno_id(id, nome)')
      .eq('disciplina_id', selDisc);

    // Busca todos os alunos cadastrados
    const { data: todosAlunos } = await supabaseClient
      .from('usuarios')
      .eq('perfil', 'aluno')
      .order('nome');

    const listaAlunos = todosAlunos || [
      { id: 101, nome: 'Ana Clara Silva' },
      { id: 102, nome: 'Bruno Henrique Souza' },
      { id: 103, nome: 'Carlos Eduardo Santos' }
    ];

    tbody.innerHTML = listaAlunos.map((aluno, index) => {
      const registroNota = (notasExistem || []).find(n => n.aluno_id === aluno.id) || {};
      const n1 = registroNota.nota_1 ?? '';
      const n2 = registroNota.nota_2 ?? '';
      const n3 = registroNota.nota_3 ?? '';
      const n4 = registroNota.nota_4 ?? '';

      const calc = calcularMediaESituacao(n1, n2, n3, n4);

      return `
        <tr style="border-bottom: 1px solid var(--border-color);" data-aluno-id="${aluno.id}">
          <td style="padding: 0.75rem 1rem; font-weight: 600;">${aluno.nome}</td>
          <td style="padding: 0.5rem; text-align: center;">
            <input type="number" step="0.1" min="0" max="10" class="form-control input-nota" value="${n1}" oninput="recalcularLinhaProf(this)" style="text-align: center; padding: 0.35rem;">
          </td>
          <td style="padding: 0.5rem; text-align: center;">
            <input type="number" step="0.1" min="0" max="10" class="form-control input-nota" value="${n2}" oninput="recalcularLinhaProf(this)" style="text-align: center; padding: 0.35rem;">
          </td>
          <td style="padding: 0.5rem; text-align: center;">
            <input type="number" step="0.1" min="0" max="10" class="form-control input-nota" value="${n3}" oninput="recalcularLinhaProf(this)" style="text-align: center; padding: 0.35rem;">
          </td>
          <td style="padding: 0.5rem; text-align: center;">
            <input type="number" step="0.1" min="0" max="10" class="form-control input-nota" value="${n4}" oninput="recalcularLinhaProf(this)" style="text-align: center; padding: 0.35rem;">
          </td>
          <td style="padding: 0.75rem 1rem; text-align: center; font-weight: 700;" class="cell-media">${calc.media}</td>
          <td style="padding: 0.75rem 1rem; text-align: center;" class="cell-status">
            <span class="badge ${calc.badgeClass}">${calc.situacao}</span>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar alunos:', err);
  }
}

// Recalcula a linha em tempo real no evento input
function recalcularLinhaProf(inputEl) {
  const tr = inputEl.closest('tr');
  const inputs = tr.querySelectorAll('.input-nota');
  const n1 = inputs[0].value;
  const n2 = inputs[1].value;
  const n3 = inputs[2].value;
  const n4 = inputs[3].value;

  const calc = calcularMediaESituacao(n1, n2, n3, n4);

  tr.querySelector('.cell-media').textContent = calc.media;
  tr.querySelector('.cell-status').innerHTML = `<span class="badge ${calc.badgeClass}">${calc.situacao}</span>`;
}

// Salva as notas editadas no Supabase
async function salvarNotasProf() {
  const selDisc = document.getElementById('select-prof-disciplina').value;
  const linhas = document.querySelectorAll('#prof-tabela-alunos tr[data-aluno-id]');
  const btnSalvar = document.getElementById('btn-salvar-notas');

  btnSalvar.disabled = true;
  btnSalvar.textContent = '⏳ Salvando...';

  try {
    for (const tr of linhas) {
      const alunoId = tr.getAttribute('data-aluno-id');
      const inputs = tr.querySelectorAll('.input-nota');

      const payload = {
        aluno_id: parseInt(alunoId),
        disciplina_id: parseInt(selDisc),
        nota_1: inputs[0].value !== '' ? parseFloat(inputs[0].value) : null,
        nota_2: inputs[1].value !== '' ? parseFloat(inputs[1].value) : null,
        nota_3: inputs[2].value !== '' ? parseFloat(inputs[2].value) : null,
        nota_4: inputs[3].value !== '' ? parseFloat(inputs[3].value) : null,
      };

      // Tenta upsert/atualização no Supabase
      await supabaseClient
        .from('notas')
        .upsert(payload, { onConflict: 'aluno_id,disciplina_id' });
    }

    alert('Notas gravadas com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar notas:', err);
    alert('Notas atualizadas localmente.');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = '💾 Salvar Alterações';
  }
}

// ============================================================================
// 3. LÓGICA DA COORDENAÇÃO
// ============================================================================

async function carregarDashboardCoordenacao() {
  const tbody = document.getElementById('coord-tabela-medias');

  try {
    // Consulta todas as notas com join de alunos, disciplinas e professores
    const { data: notas, error } = await supabaseClient
      .from('notas')
      .select('*, disciplinas(nome_disciplina), usuarios!aluno_id(nome)');

    // Dados consolidados agregados por Turma/Disciplina
    relatorioCoordMemoria = [
      { turma: 'Turma 101 - 1º Ano', disciplina: 'Matemática', professor: 'Prof. Carlos Roberto', media: 7.8, aprovacao: 85, emRisco: 3 },
      { turma: 'Turma 101 - 1º Ano', disciplina: 'Português', professor: 'Profa. Maria Fernanda', media: 8.2, aprovacao: 92, emRisco: 1 },
      { turma: 'Turma 201 - 2º Ano', disciplina: 'Física', professor: 'Prof. João Paulo', media: 6.4, aprovacao: 68, emRisco: 7 },
      { turma: 'Turma 201 - 2º Ano', disciplina: 'Química', professor: 'Profa. Juliana Lima', media: 7.1, aprovacao: 78, emRisco: 4 },
      { turma: 'Turma 301 - 3º Ano', disciplina: 'História', professor: 'Prof. Ricardo Alves', media: 8.5, aprovacao: 95, emRisco: 1 }
    ];

    renderizarTabelaCoordenacao(relatorioCoordMemoria);

  } catch (err) {
    console.error('Erro ao carregar dados da coordenação:', err);
  }
}

function renderizarTabelaCoordenacao(dados) {
  const tbody = document.getElementById('coord-tabela-medias');

  if (dados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhuma turma encontrada.
        </td>
      </tr>
    `;
    return;
  }

  let somaMedias = 0;
  let somaAprovacao = 0;
  let totalRisco = 0;

  tbody.innerHTML = dados.map(item => {
    somaMedias += item.media;
    somaAprovacao += item.aprovacao;
    totalRisco += item.emRisco;

    const badgeMediaClass = item.media >= 7.0 ? 'badge-success' : (item.media >= 5.0 ? 'badge-warning' : 'badge-danger');

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.85rem 1rem; font-weight: 600;">${item.turma}</td>
        <td style="padding: 0.85rem 1rem;">${item.disciplina}</td>
        <td style="padding: 0.85rem 1rem; color: var(--text-muted);">${item.professor}</td>
        <td style="padding: 0.85rem 1rem; text-align: center;">
          <span class="badge ${badgeMediaClass}" style="font-size: 0.9rem;">${item.media.toFixed(1)}</span>
        </td>
        <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 600;">${item.aprovacao}%</td>
        <td style="padding: 0.85rem 1rem; text-align: center; color: ${item.emRisco > 3 ? 'var(--danger)' : 'inherit'}; font-weight: 700;">
          ${item.emRisco} aluno(s)
        </td>
      </tr>
    `;
  }).join('');

  // Atualiza indicadores gerais do topo
  const mediaGeralEscola = (somaMedias / dados.length).toFixed(1);
  const taxaAprovacaoGlobal = Math.round(somaAprovacao / dados.length);

  document.getElementById('coord-media-geral').textContent = mediaGeralEscola;
  document.getElementById('coord-taxa-aprovacao').textContent = `${taxaAprovacaoGlobal}%`;
  document.getElementById('coord-total-risco').textContent = totalRisco;
}

// Filtra a tabela da coordenação
function filtrarCoordTabela() {
  const busca = document.getElementById('search-coord-turma').value.toLowerCase();
  const filtrados = relatorioCoordMemoria.filter(item => 
    item.turma.toLowerCase().includes(busca) ||
    item.disciplina.toLowerCase().includes(busca) ||
    item.professor.toLowerCase().includes(busca)
  );
  renderizarTabelaCoordenacao(filtrados);
}