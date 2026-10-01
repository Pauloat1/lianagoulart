document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initDashboard();
  setupRoleSelector();
  setupLogout();
});

/**
 * 1. Verificação de Autenticação
 */
function checkAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn || isLoggedIn !== 'true') {
    // Redireciona para o login caso não esteja autenticado
    window.location.href = 'index.html';
  }
}

/**
 * Getters para Estado Atual
 */
function getCurrentRole() {
  return localStorage.getItem('userRole') || 'aluno';
}

function getCurrentEmail() {
  return localStorage.getItem('userEmail') || 'usuario@escola.edu.br';
}

/**
 * 2. Inicialização e Renderização do Dashboard
 */
function initDashboard() {
  const role = getCurrentRole();
  const email = getCurrentEmail();

  // Atualizar informações da Sidebar e do Cabeçalho
  const displayName = email.split('@')[0].replace('.', ' ');
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  document.getElementById('user-display-name').textContent = formattedName;
  document.getElementById('sidebar-user-email').textContent = email;
  document.getElementById('sidebar-user-role').textContent = role.toUpperCase();

  const roleSelect = document.getElementById('dash-role-select');
  if (roleSelect) roleSelect.value = role;

  // Renderizar seções de acordo com o perfil
  renderMetrics(role);
  renderPrimaryPanel(role);
  renderSecondaryPanel(role);
  renderQuickActions(role);
}

/**
 * 3. Renderizar Métricas/Cards
 */
function renderMetrics(role) {
  const container = document.getElementById('metrics-container');
  if (!container) return;

  if (role === 'aluno') {
    container.innerHTML = `
      <div class="metric-card">
        <span class="metric-label">Média Geral</span>
        <span class="metric-value" style="color: var(--primary-color);">8.8</span>
        <span class="metric-foot">⬆ +0.4 em relação ao semestre anterior</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Frequência Semanal</span>
        <span class="metric-value" style="color: var(--success-color);">96%</span>
        <span class="metric-foot">24 de 25 aulas presenciadas</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Tarefas Pendentes</span>
        <span class="metric-value" style="color: var(--warning-color);">3</span>
        <span class="metric-foot">Próxima entrega: Amanhã</span>
      </div>
    `;
  } else if (role === 'professor') {
    container.innerHTML = `
      <div class="metric-card">
        <span class="metric-label">Turmas Atribuidas</span>
        <span class="metric-value" style="color: var(--primary-color);">4</span>
        <span class="metric-foot">Total de 120 alunos ativos</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Aulas Hoje</span>
        <span class="metric-value" style="color: var(--success-color);">3 Aulas</span>
        <span class="metric-foot">Salas: Lab 01, Lab 03</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Gabaritos Pendentes</span>
        <span class="metric-value" style="color: var(--warning-color);">2</span>
        <span class="metric-foot">Avaliação de Algoritmos</span>
      </div>
    `;
  } else if (role === 'gestor') {
    container.innerHTML = `
      <div class="metric-card">
        <span class="metric-label">Total de Alunos</span>
        <span class="metric-value" style="color: var(--primary-color);">450</span>
        <span class="metric-foot">Matriculados em 12 turmas</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Corpo Docente</span>
        <span class="metric-value" style="color: var(--success-color);">28</span>
        <span class="metric-foot">Professores ativos</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Ocupação de Salas</span>
        <span class="metric-value" style="color: var(--primary-color);">92%</span>
        <span class="metric-foot">18/20 espaços em uso</span>
      </div>
    `;
  }
}

/**
 * 4. Painel Principal (Aulas / Grade do Dia)
 */
function renderPrimaryPanel(role) {
  const titleElem = document.getElementById('primary-panel-title');
  const contentElem = document.getElementById('primary-panel-content');
  if (!contentElem) return;

  if (role === 'aluno') {
    titleElem.textContent = 'Aulas de Hoje (Turma 3º Ano - B)';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Algoritmos e Estruturas</span>
          <span class="list-item-sub">Prof. Roberto Carlos • 📍 Lab 01</span>
        </div>
        <span class="badge-tag badge-blue">07:30 - 08:20</span>
      </div>
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Desenvolvimento Web</span>
          <span class="list-item-sub">Profa. Ana Maria • 📍 Lab 03</span>
        </div>
        <span class="badge-tag badge-blue">08:20 - 09:10</span>
      </div>
    `;
  } else if (role === 'professor') {
    titleElem.textContent = 'Sua Agenda de Hoje';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Algoritmos e Estruturas (Turma 3º Ano - B)</span>
          <span class="list-item-sub">📍 Lab 01 - Bloco A</span>
        </div>
        <span class="badge-tag badge-blue">07:30 - 08:20</span>
      </div>
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Algoritmos e Estruturas (Turma 2º Ano - A)</span>
          <span class="list-item-sub">📍 Sala 102 - Bloco B</span>
        </div>
        <span class="badge-tag badge-blue">09:30 - 10:20</span>
      </div>
    `;
  } else if (role === 'gestor') {
    titleElem.textContent = 'Visão Geral da Grade Semanal';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Grade do 3º Ano - B</span>
          <span class="list-item-sub">5 disciplinas cadastradas • 100% de cobertura</span>
        </div>
        <span class="badge-tag badge-green">Completa</span>
      </div>
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Grade do 2º Ano - A</span>
          <span class="list-item-sub">4 disciplinas cadastradas • Sem conflitos de sala</span>
        </div>
        <span class="badge-tag badge-green">Completa</span>
      </div>
    `;
  }
}

/**
 * 5. Painel Secundário (Exercícios, Avisos ou Pendências)
 */
function renderSecondaryPanel(role) {
  const titleElem = document.getElementById('secondary-panel-title');
  const contentElem = document.getElementById('secondary-panel-content');
  if (!contentElem) return;

  if (role === 'aluno') {
    titleElem.textContent = 'Próximas Entregas & Exercícios';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Exercício de Matrizes e Vetores</span>
          <span class="list-item-sub">Disciplina: Algoritmos</span>
        </div>
        <span class="badge-tag badge-yellow">Amanhã</span>
      </div>
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Projeto Front-end em HTML/CSS</span>
          <span class="list-item-sub">Disciplina: Desenvolimento Web</span>
        </div>
        <span class="badge-tag badge-blue">Em 5 dias</span>
      </div>
    `;
  } else if (role === 'professor') {
    titleElem.textContent = 'Pendências de Correção';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Gabarito da Prova 1 - Banco de Dados</span>
          <span class="list-item-sub">35 provas aguardando validação</span>
        </div>
        <span class="badge-tag badge-yellow">Pendente</span>
      </div>
    `;
  } else if (role === 'gestor') {
    titleElem.textContent = 'Solicitações da Instituição';
    contentElem.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <span class="list-item-title">Reserva do Lab 02 - Prof. Carlos</span>
          <span class="list-item-sub">Aguardando aprovação de horário</span>
        </div>
        <span class="badge-tag badge-yellow">Aprovar</span>
      </div>
    `;
  }
}

/**
 * 6. Ações Rápidas na Coluna Direita
 */
function renderQuickActions(role) {
  const container = document.getElementById('quick-actions-container');
  if (!container) return;

  if (role === 'aluno') {
    container.innerHTML = `
      <a href="horarios.html" class="btn-action">📅 Ver Meu Horário</a>
      <a href="exercicios.html" class="btn-action">📝 Resolver Exercícios</a>
      <a href="desempenho.html" class="btn-action">📊 Ver Notas e Boletim</a>
    `;
  } else if (role === 'professor') {
    container.innerHTML = `
      <a href="horarios.html" class="btn-action">📅 Consultar Minha Agenda</a>
      <a href="gabaritos.html" class="btn-action">📑 Cadastrar Gabarito</a>
      <a href="escola.html" class="btn-action">👥 Chamada de Alunos</a>
    `;
  } else if (role === 'gestor') {
    container.innerHTML = `
      <a href="horarios.html" class="btn-action">✏️ Editar Grade de Horários</a>
      <a href="escola.html" class="btn-action">🏛️ Gerenciar Turmas e Salas</a>
      <a href="perfil.html" class="btn-action">👤 Cadastrar Novo Usuário</a>
    `;
  }
}

/**
 * 7. Comutador de Perfil em tempo real
 */
function setupRoleSelector() {
  const roleSelect = document.getElementById('dash-role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const newRole = e.target.value;
      localStorage.setItem('userRole', newRole);
      initDashboard();
    });
  }
}

/**
 * 8. Handler do Botão de Logout
 */
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      window.location.href = 'index.html';
    });
  }
}