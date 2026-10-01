// Grade padrão de horários inicial
const defaultSchedule = [
  {
    id: "slot-1",
    day: "Segunda-feira",
    time: "07:30 - 08:20",
    turma: "3º Ano - B",
    subject: "Algoritmos e Estruturas",
    professor: "Prof. Roberto Carlos",
    room: "Lab 01"
  },
  {
    id: "slot-2",
    day: "Segunda-feira",
    time: "08:20 - 09:10",
    turma: "3º Ano - B",
    subject: "Desenvolvimento Web",
    professor: "Profa. Ana Maria",
    room: "Lab 03"
  },
  {
    id: "slot-3",
    day: "Terça-feira",
    time: "09:30 - 10:20",
    turma: "3º Ano - B",
    subject: "Banco de Dados",
    professor: "Prof. Carlos Lima",
    room: "Lab 02"
  },
  {
    id: "slot-4",
    day: "Quarta-feira",
    time: "07:30 - 08:20",
    turma: "2º Ano - A",
    subject: "Algoritmos e Estruturas",
    professor: "Prof. Roberto Carlos",
    room: "Sala 102"
  },
  {
    id: "slot-5",
    day: "Quinta-feira",
    time: "10:20 - 11:10",
    turma: "3º Ano - B",
    subject: "Desenvolvimento Web",
    professor: "Profa. Ana Maria",
    room: "Lab 03"
  }
];

const timeSlots = [
  "07:30 - 08:20",
  "08:20 - 09:10",
  "09:30 - 10:20",
  "10:20 - 11:10"
];

const daysOfWeek = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira"
];

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initRoleSelector();
  initFilters();
  initFormHandler();
  renderSchedule();
});

function initStorage() {
  if (!localStorage.getItem('scheduleData')) {
    localStorage.setItem('scheduleData', JSON.stringify(defaultSchedule));
  }
}

function getCurrentRole() {
  return localStorage.getItem('userRole') || 'aluno';
}

/**
 * Inicializa o comutador de papéis (Aluno, Professor, Gestor)
 */
function initRoleSelector() {
  const roleSelect = document.getElementById('user-role-select');
  const currentRole = getCurrentRole();

  if (roleSelect) {
    roleSelect.value = currentRole;

    roleSelect.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      localStorage.setItem('userRole', selectedRole);
      updateControlsForRole(selectedRole);
      renderSchedule();
    });
  }

  updateControlsForRole(currentRole);
}

/**
 * Exibe/oculta filtros e botões conforme o perfil selecionado
 */
function updateControlsForRole(role) {
  const turmaWrapper = document.getElementById('filter-turma-wrapper');
  const profWrapper = document.getElementById('filter-professor-wrapper');
  const btnAdd = document.getElementById('btn-add-schedule');
  const subtitle = document.getElementById('page-subtitle');

  if (role === 'aluno') {
    turmaWrapper.style.display = 'block';
    profWrapper.style.display = 'none';
    btnAdd.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Confira suas aulas da semana e as salas correspondentes.';
  } else if (role === 'professor') {
    turmaWrapper.style.display = 'none';
    profWrapper.style.display = 'block';
    btnAdd.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Veja a escala das suas turmas e salas onde ministrará cada aula.';
  } else if (role === 'gestor') {
    turmaWrapper.style.display = 'block';
    profWrapper.style.display = 'block';
    btnAdd.style.display = 'inline-block';
    if (subtitle) subtitle.textContent = 'Gestão completa da grade semanal de horários, salas e professores.';
  }
}

function initFilters() {
  const filterTurma = document.getElementById('filter-turma');
  const filterProf = document.getElementById('filter-professor');

  if (filterTurma) filterTurma.addEventListener('change', renderSchedule);
  if (filterProf) filterProf.addEventListener('change', renderSchedule);
}

/**
 * Renderiza a tabela de horários semanal
 */
function renderSchedule() {
  const tbody = document.getElementById('schedule-body');
  if (!tbody) return;

  const role = getCurrentRole();
  const selectedTurma = document.getElementById('filter-turma')?.value || '3º Ano - B';
  const selectedProf = document.getElementById('filter-professor')?.value || 'Prof. Roberto Carlos';

  const scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];

  tbody.innerHTML = timeSlots.map(time => {
    let rowHtml = `<tr><td class="time-col">${time}</td>`;

    daysOfWeek.forEach(day => {
      // Filtrar a aula que pertence a esta célula (Dia + Horário)
      const matchingSlots = scheduleData.filter(item => {
        if (item.day !== day || item.time !== time) return false;

        if (role === 'aluno') {
          return item.turma === selectedTurma;
        } else if (role === 'professor') {
          return item.professor === selectedProf;
        } else if (role === 'gestor') {
          // No gestor, prioriza o filtro de turma ou mostra todos se houver match
          return item.turma === selectedTurma || item.professor === selectedProf;
        }
        return false;
      });

      if (matchingSlots.length > 0) {
        rowHtml += `<td>`;
        matchingSlots.forEach(slot => {
          rowHtml += `
            <div class="slot-card">
              <div class="slot-title">${slot.subject}</div>
              ${role === 'aluno' ? `<div class="slot-detail">👨‍🏫 ${slot.professor}</div>` : ''}
              ${role === 'professor' ? `<div class="slot-detail">👥 Turma: <strong>${slot.turma}</strong></div>` : ''}
              ${role === 'gestor' ? `<div class="slot-detail">👥 ${slot.turma} \vert{} 👨‍🏫 ${slot.professor}</div>` : ''}
              <span class="slot-room">📍 ${slot.room}</span>

              ${role === 'gestor' ? `
                <div class="slot-actions">
                  <button class="btn-slot-edit" onclick="editSlot('${slot.id}')">Editar</button>
                  <button class="btn-slot-del" onclick="deleteSlot('${slot.id}')">Excluir</button>
                </div>
              ` : ''}
            </div>
          `;
        });
        rowHtml += `</td>`;
      } else {
        rowHtml += `<td><div class="empty-slot">Sem aula</div></td>`;
      }
    });

    rowHtml += `</tr>`;
    return rowHtml;
  }).join('');
}

/**
 * Manipulação do formulário para adicionar/editar horários
 */
function initFormHandler() {
  const form = document.getElementById('schedule-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const day = document.getElementById('form-day').value;
    const time = document.getElementById('form-time').value;
    const turma = document.getElementById('form-turma').value;
    const subject = document.getElementById('form-subject').value;
    const professor = document.getElementById('form-professor').value;
    const room = document.getElementById('form-room').value;

    let data = JSON.parse(localStorage.getItem('scheduleData')) || [];

    if (editId) {
      // Atualização de registro existente
      data = data.map(item => item.id === editId ? {
        id: editId,
        day: sanitizeInput(day),
        time: sanitizeInput(time),
        turma: sanitizeInput(turma),
        subject: sanitizeInput(subject),
        professor: sanitizeInput(professor),
        room: sanitizeInput(room)
      } : item);
    } else {
      // Criação de novo registro
      const newSlot = {
        id: 'slot-' + Date.now(),
        day: sanitizeInput(day),
        time: sanitizeInput(time),
        turma: sanitizeInput(turma),
        subject: sanitizeInput(subject),
        professor: sanitizeInput(professor),
        room: sanitizeInput(room)
      };
      data.push(newSlot);
    }

    localStorage.setItem('scheduleData', JSON.stringify(data));
    closeModal();
    renderSchedule();
  });
}

/**
 * Ações do Modal para o Gestor
 */
function openModal() {
  document.getElementById('schedule-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('modal-title').textContent = 'Cadastrar Novo Horário';
  document.getElementById('schedule-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('schedule-modal').style.display = 'none';
}

function editSlot(id) {
  const data = JSON.parse(localStorage.getItem('scheduleData')) || [];
  const slot = data.find(item => item.id === id);
  if (!slot) return;

  document.getElementById('edit-id').value = slot.id;
  document.getElementById('form-day').value = slot.day;
  document.getElementById('form-time').value = slot.time;
  document.getElementById('form-turma').value = slot.turma;
  document.getElementById('form-subject').value = slot.subject;
  document.getElementById('form-professor').value = slot.professor;
  document.getElementById('form-room').value = slot.room;

  document.getElementById('modal-title').textContent = 'Editar Horário de Aula';
  document.getElementById('schedule-modal').style.display = 'flex';
}

function deleteSlot(id) {
  if (confirm('Deseja realmente remover esta aula da grade?')) {
    let data = JSON.parse(localStorage.getItem('scheduleData')) || [];
    data = data.filter(item => item.id !== id);
    localStorage.setItem('scheduleData', JSON.stringify(data));
    renderSchedule();
  }
}

function sanitizeInput(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}