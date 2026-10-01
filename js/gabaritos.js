// Base de dados inicial por omissão (armazenada em localStorage)
const defaultGabaritos = [
  {
    id: "gab-1",
    title: "Prova Trimestral de Banco de Dados",
    subject: "Banco de Dados",
    target: "ambos", // alunos, professores, ambos
    date: "2026-09-15",
    answers: "1-B, 2-D, 3-A, 4-C, 5-E\n\nQuestão 6 (Dissertativa): O índice B-Tree otimiza pesquisas por chave primária reduzindo leituras em disco."
  },
  {
    id: "gab-2",
    title: "Avaliação em Correção - JS Avançado",
    subject: "Desenvolvimento Web",
    target: "professores", // Exclusivo professores
    date: "2026-09-25",
    answers: "GABARITO DE CORREÇÃO DOCENTE:\n1-C (Event Loop)\n2-A (Promises)\n3-B (Async/Await)\nCritério Q4: Pontuar 1.0 para quem tratou erros com try/catch."
  },
  {
    id: "gab-3",
    title: "Simulado Geral do 3º Ano - Matemática",
    subject: "Matemática",
    target: "alunos",
    date: "2026-08-10",
    answers: "1-A, 2-B, 3-C, 4-D, 5-A, 6-C, 7-B, 8-D, 9-E, 10-A."
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initRoleSelector();
  initFormHandler();
  initFilterHandlers();
  renderGabaritos();
});

/**
 * Inicializa os dados em LocalStorage se não existirem
 */
function initStorage() {
  if (!localStorage.getItem('gabaritosData')) {
    localStorage.setItem('gabaritosData', JSON.stringify(defaultGabaritos));
  }
}

/**
 * Obtém o perfil atual de utilizador (aluno, professor ou gestor)
 */
function getCurrentRole() {
  return localStorage.getItem('userRole') || 'aluno';
}

/**
 * Configura o seletor de perfil e atualiza o estado
 */
function initRoleSelector() {
  const roleSelect = document.getElementById('user-role-select');
  const currentRole = getCurrentRole();

  if (roleSelect) {
    roleSelect.value = currentRole;

    roleSelect.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      localStorage.setItem('userRole', selectedRole);
      updateViewByRole(selectedRole);
      renderGabaritos();
    });
  }

  updateViewByRole(currentRole);
}

/**
 * Atualiza elementos visuais consoante as permissões do perfil
 */
function updateViewByRole(role) {
  const gestorPanel = document.getElementById('gestor-panel');
  if (gestorPanel) {
    // Apenas Gestor visualiza o painel de criação
    gestorPanel.style.display = role === 'gestor' ? 'block' : 'none';
  }
}

/**
 * Processa a inclusão de um novo gabarito pelo Gestor
 */
function initFormHandler() {
  const form = document.getElementById('add-gabarito-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('gab-title').value;
    const subject = document.getElementById('gab-subject').value;
    const target = document.getElementById('gab-target').value;
    const date = document.getElementById('gab-date').value;
    const answers = document.getElementById('gab-answers').value;

    const newGabarito = {
      id: 'gab-' + Date.now(),
      title: sanitizeInput(title),
      subject: sanitizeInput(subject),
      target: sanitizeInput(target),
      date: sanitizeInput(date),
      answers: sanitizeInput(answers)
    };

    const data = JSON.parse(localStorage.getItem('gabaritosData')) || [];
    data.unshift(newGabarito);
    localStorage.setItem('gabaritosData', JSON.stringify(data));

    form.reset();
    alert('Gabarito publicado com sucesso!');
    renderGabaritos();
  });
}

/**
 * Configura eventos para pesquisa e filtros por disciplina
 */
function initFilterHandlers() {
  const searchInput = document.getElementById('search-gabarito');
  const subjectSelect = document.getElementById('filter-subject');

  if (searchInput) searchInput.addEventListener('input', renderGabaritos);
  if (subjectSelect) subjectSelect.addEventListener('change', renderGabaritos);
}

/**
 * Renderiza a grelha de gabaritos filtrados pelas permissões e critérios
 */
function renderGabaritos() {
  const container = document.getElementById('gabaritos-container');
  if (!container) return;

  const role = getCurrentRole();
  const searchVal = (document.getElementById('search-gabarito')?.value || '').toLowerCase().trim();
  const subjectVal = document.getElementById('filter-subject')?.value || 'all';

  const allData = JSON.parse(localStorage.getItem('gabaritosData')) || [];

  // 1. Filtragem por Perfil de Acesso
  let filtered = allData.filter(item => {
    if (role === 'gestor') return true; // Gestor vê tudo
    if (role === 'professor') {
      // Professor vê conteúdos para professores, ambos e alunos
      return item.target === 'professores' || item.target === 'ambos' || item.target === 'alunos';
    }
    if (role === 'aluno') {
      // Aluno vÊ conteúdos destinados a alunos e ambos
      return item.target === 'alunos' || item.target === 'ambos';
    }
    return false;
  });

  // 2. Filtragem por Pesquisa e Disciplina
  filtered = filtered.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchVal) || item.subject.toLowerCase().includes(searchVal);
    const matchesSubject = subjectVal === 'all' || item.subject === subjectVal;
    return matchesSearch && matchesSubject;
  });

  // Renderização do HTML
  if (filtered.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 32px;">Nenhum gabarito encontrado para o seu perfil ou filtro selecionado.</p>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    let badgeClass = 'badge-ambos';
    let badgeText = 'Alunos e Professores';

    if (item.target === 'professores') {
      badgeClass = 'badge-professores';
      badgeText = 'Exclusivo Professores';
    } else if (item.target === 'alunos') {
      badgeClass = 'badge-alunos';
      badgeText = 'Disponível para Alunos';
    }

    return `
      <article class="gabarito-card">
        <div>
          <span class="badge-target ${badgeClass}">${badgeText}</span>
          <h3 class="gabarito-title">${item.title}</h3>
          <div class="gabarito-info">
            <span>📚 Disciplina: <strong>${item.subject}</strong></span>
            <span>📅 Data: <strong>${formatDate(item.date)}</strong></span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action" onclick="viewGabarito('${item.id}')">👁️ Visualizar</button>
          ${role === 'gestor' ? `<button class="btn-action btn-delete" onclick="deleteGabarito('${item.id}')">🗑️ Eliminar</button>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Modal para visualizar as respostas do gabarito
 */
function viewGabarito(id) {
  const allData = JSON.parse(localStorage.getItem('gabaritosData')) || [];
  const item = allData.find(g => g.id === id);

  if (!item) return;

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-body').textContent = item.answers;
  document.getElementById('gabarito-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('gabarito-modal').style.display = 'none';
}

/**
 * Função para eliminar um gabarito (Apenas Gestor)
 */
function deleteGabarito(id) {
  if (confirm('Tem a certeza que deseja eliminar este gabarito?')) {
    let allData = JSON.parse(localStorage.getItem('gabaritosData')) || [];
    allData = allData.filter(g => g.id !== id);
    localStorage.setItem('gabaritosData', JSON.stringify(allData));
    renderGabaritos();
  }
}

/**
 * Utilitários de formatação e segurança
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function sanitizeInput(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}