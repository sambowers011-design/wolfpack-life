const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const guestNotice = document.getElementById('guestNotice');
const schedule = document.getElementById('schedule');
const scheduleEmpty = document.getElementById('scheduleEmpty');
const toggleClassForm = document.getElementById('toggleClassForm');
const classForm = document.getElementById('classForm');
const classFormError = document.getElementById('classFormError');
const formModeLabel = document.getElementById('formModeLabel');
const classSubmitBtn = document.getElementById('classSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const nameInput = document.getElementById('classNameInput');
const locationInput = document.getElementById('classLocationInput');
const startInput = document.getElementById('classStartInput');
const endInput = document.getElementById('classEndInput');

let editingId = null;

function init() {
  if (!session) return;
  guestNotice.hidden = !session.guest;
  render();
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  const data = loadData();
  scheduleEmpty.hidden = data.classes.length > 0;
  schedule.hidden = data.classes.length === 0;
  schedule.innerHTML = '';

  for (const dow of DAY_ORDER) {
    const dayClasses = data.classes
      .filter((c) => c.days.includes(dow))
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    const group = document.createElement('div');
    group.className = 'day-group';

    if (dayClasses.length === 0) {
      group.innerHTML = `<h3 class="day-heading">${DAY_NAMES[dow]}</h3><p class="empty-state">No classes.</p>`;
    } else {
      const itemsHtml = dayClasses
        .map(
          (c) => `
        <li class="class-item">
          <div class="class-time">${formatTime(c.start)} – ${formatTime(c.end)}</div>
          <div class="class-info">
            <div class="class-name">${escapeHtml(c.name)}</div>
            ${c.location ? `<div class="class-location">${escapeHtml(c.location)}</div>` : ''}
          </div>
          <div class="class-actions">
            <button type="button" class="link-btn" data-edit="${c.id}">Edit</button>
            <button type="button" class="remove-btn" data-remove="${c.id}" aria-label="Remove class">×</button>
          </div>
        </li>`
        )
        .join('');
      group.innerHTML = `<h3 class="day-heading">${DAY_NAMES[dow]}</h3><ul class="class-list">${itemsHtml}</ul>`;
    }

    schedule.appendChild(group);
  }

  schedule.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cls = data.classes.find((c) => c.id === btn.dataset.edit);
      if (cls) openFormForEdit(cls);
    });
  });
  schedule.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeClass(btn.dataset.remove);
      if (editingId === btn.dataset.remove) closeForm();
      render();
    });
  });
}

function openFormForAdd() {
  editingId = null;
  classForm.reset();
  formModeLabel.textContent = 'New class';
  classSubmitBtn.textContent = 'Add class';
  cancelEditBtn.hidden = true;
  classFormError.hidden = true;
  classForm.hidden = false;
}

function openFormForEdit(cls) {
  editingId = cls.id;
  nameInput.value = cls.name;
  locationInput.value = cls.location || '';
  startInput.value = cls.start;
  endInput.value = cls.end;
  document.querySelectorAll('#dayPicker input').forEach((cb) => {
    cb.checked = cls.days.includes(Number(cb.value));
  });
  formModeLabel.textContent = `Editing ${cls.name}`;
  classSubmitBtn.textContent = 'Save changes';
  cancelEditBtn.hidden = false;
  classFormError.hidden = true;
  classForm.hidden = false;
  classForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  editingId = null;
  classForm.reset();
  classForm.hidden = true;
}

toggleClassForm.addEventListener('click', () => {
  if (classForm.hidden) {
    openFormForAdd();
  } else {
    closeForm();
  }
});

cancelEditBtn.addEventListener('click', closeForm);

classForm.addEventListener('submit', (e) => {
  e.preventDefault();
  classFormError.hidden = true;

  const name = nameInput.value.trim();
  const location = locationInput.value.trim();
  const start = startInput.value;
  const end = endInput.value;
  const days = Array.from(document.querySelectorAll('#dayPicker input:checked')).map((el) => Number(el.value));

  if (!name) {
    classFormError.textContent = 'Enter a class name.';
    classFormError.hidden = false;
    return;
  }
  if (!days.length) {
    classFormError.textContent = 'Pick at least one day.';
    classFormError.hidden = false;
    return;
  }
  if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) {
    classFormError.textContent = 'End time needs to be after the start time.';
    classFormError.hidden = false;
    return;
  }

  if (editingId) {
    updateClass(editingId, { name, location, start, end, days });
  } else {
    addClass({ name, location, start, end, days });
  }

  closeForm();
  render();
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
