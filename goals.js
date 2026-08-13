const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const STATUS_ORDER = ['not-started', 'in-progress', 'done'];
const STATUS_LABEL = { 'not-started': 'Not started', 'in-progress': 'In progress', done: 'Done' };
const SEASON_ORDER = { spring: 0, summer: 1, fall: 2, winter: 3 };

const guestNotice = document.getElementById('guestNotice');
const goalGroups = document.getElementById('goalGroups');
const goalsEmpty = document.getElementById('goalsEmpty');
const toggleGoalForm = document.getElementById('toggleGoalForm');
const goalForm = document.getElementById('goalForm');
const goalFormError = document.getElementById('goalFormError');
const formModeLabel = document.getElementById('formModeLabel');
const goalSubmitBtn = document.getElementById('goalSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const titleInput = document.getElementById('goalTitleInput');
const termInput = document.getElementById('goalTermInput');
const notesInput = document.getElementById('goalNotesInput');

let editingId = null;

function init() {
  if (!session) return;
  guestNotice.hidden = !session.guest;
  render();
}

function currentTerm() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 7) return `Fall ${year}`;
  if (month >= 5) return `Summer ${year}`;
  return `Spring ${year}`;
}

function termSortKey(term) {
  const match = term.trim().match(/^(\w+)\s+(\d{4})$/);
  if (!match) return { rank: Infinity, label: term.trim().toLowerCase() };
  const season = SEASON_ORDER[match[1].toLowerCase()];
  if (season === undefined) return { rank: Infinity, label: term.trim().toLowerCase() };
  return { rank: Number(match[2]) * 10 + season, label: term.trim().toLowerCase() };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  const data = loadData();
  goalsEmpty.hidden = data.goals.length > 0;
  goalGroups.hidden = data.goals.length === 0;
  goalGroups.innerHTML = '';

  const terms = [...new Set(data.goals.map((g) => g.term))].sort((a, b) => {
    const ka = termSortKey(a);
    const kb = termSortKey(b);
    return ka.rank - kb.rank || ka.label.localeCompare(kb.label);
  });

  for (const term of terms) {
    const goals = data.goals.filter((g) => g.term === term);
    const group = document.createElement('div');
    group.className = 'day-group';

    const itemsHtml = goals
      .map(
        (g) => `
      <li class="class-item">
        <div class="class-info">
          <div class="class-name">${escapeHtml(g.title)}</div>
          ${g.notes ? `<div class="class-location">${escapeHtml(g.notes)}</div>` : ''}
        </div>
        <button type="button" class="goal-status ${g.status}" data-cycle="${g.id}">${STATUS_LABEL[g.status]}</button>
        <div class="class-actions">
          <button type="button" class="link-btn" data-edit="${g.id}">Edit</button>
          <button type="button" class="remove-btn" data-remove="${g.id}" aria-label="Remove goal">×</button>
        </div>
      </li>`
      )
      .join('');

    group.innerHTML = `<h3 class="day-heading">${escapeHtml(term)}</h3><ul class="class-list">${itemsHtml}</ul>`;
    goalGroups.appendChild(group);
  }

  goalGroups.querySelectorAll('[data-cycle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cycleGoalStatus(btn.dataset.cycle);
      render();
    });
  });
  goalGroups.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goal = data.goals.find((g) => g.id === btn.dataset.edit);
      if (goal) openFormForEdit(goal);
    });
  });
  goalGroups.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeGoal(btn.dataset.remove);
      if (editingId === btn.dataset.remove) closeForm();
      render();
    });
  });
}

function openFormForAdd() {
  editingId = null;
  goalForm.reset();
  termInput.value = currentTerm();
  formModeLabel.textContent = 'New goal';
  goalSubmitBtn.textContent = 'Add goal';
  cancelEditBtn.hidden = true;
  goalFormError.hidden = true;
  goalForm.hidden = false;
}

function openFormForEdit(goal) {
  editingId = goal.id;
  titleInput.value = goal.title;
  termInput.value = goal.term;
  notesInput.value = goal.notes || '';
  formModeLabel.textContent = `Editing ${goal.title}`;
  goalSubmitBtn.textContent = 'Save changes';
  cancelEditBtn.hidden = false;
  goalFormError.hidden = true;
  goalForm.hidden = false;
  goalForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  editingId = null;
  goalForm.reset();
  goalForm.hidden = true;
}

toggleGoalForm.addEventListener('click', () => {
  if (goalForm.hidden) {
    openFormForAdd();
  } else {
    closeForm();
  }
});

cancelEditBtn.addEventListener('click', closeForm);

goalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  goalFormError.hidden = true;

  const title = titleInput.value.trim();
  const term = termInput.value.trim();
  const notes = notesInput.value.trim();

  if (!title) {
    goalFormError.textContent = 'Enter a goal.';
    goalFormError.hidden = false;
    return;
  }
  if (!term) {
    goalFormError.textContent = 'Enter a term.';
    goalFormError.hidden = false;
    return;
  }

  if (editingId) {
    updateGoal(editingId, { title, term, notes });
  } else {
    addGoal({ title, term, notes });
  }

  closeForm();
  render();
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
