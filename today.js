const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const dateHeading = document.getElementById('dateHeading');
const guestNotice = document.getElementById('guestNotice');
const nextText = document.getElementById('nextText');
const classList = document.getElementById('classList');
const classEmpty = document.getElementById('classEmpty');
const taskList = document.getElementById('taskList');
const taskEmpty = document.getElementById('taskEmpty');
const toggleClassForm = document.getElementById('toggleClassForm');
const classForm = document.getElementById('classForm');
const classFormError = document.getElementById('classFormError');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');

function init() {
  if (!session) return;

  guestNotice.hidden = !session.guest;

  tick();
  setInterval(tick, 30000);
}

function tick() {
  const now = new Date();
  dateHeading.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
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

function render() {
  const data = loadData();
  const now = new Date();
  const todayDow = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const todaysClasses = data.classes
    .filter((c) => c.days.includes(todayDow))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  renderClasses(todaysClasses, nowMinutes);
  renderTasks(data.tasks.filter((t) => t.date === todayISO()));
  renderNext(todaysClasses, nowMinutes, data.tasks);
}

function renderNext(todaysClasses, nowMinutes, allTasks) {
  const current = todaysClasses.find(
    (c) => timeToMinutes(c.start) <= nowMinutes && nowMinutes < timeToMinutes(c.end)
  );
  const upcoming = todaysClasses.find((c) => timeToMinutes(c.start) > nowMinutes);
  const openTasks = allTasks.filter((t) => t.date === todayISO() && !t.done).length;

  if (current) {
    nextText.textContent = `In ${current.name} until ${formatTime(current.end)}.`;
  } else if (upcoming) {
    nextText.textContent = `${upcoming.name} at ${formatTime(upcoming.start)}${upcoming.location ? ` in ${upcoming.location}` : ''}.`;
  } else if (todaysClasses.length) {
    nextText.textContent = openTasks
      ? `You're clear for the rest of today — ${openTasks} task${openTasks === 1 ? '' : 's'} left.`
      : "You're clear for the rest of today.";
  } else {
    nextText.textContent = openTasks
      ? `No classes today — ${openTasks} task${openTasks === 1 ? '' : 's'} on your list.`
      : 'No classes today and nothing on your list. Enjoy it.';
  }
}

function renderClasses(items, nowMinutes) {
  classList.innerHTML = '';
  classEmpty.hidden = items.length > 0;

  const nextId = items.find((c) => timeToMinutes(c.start) > nowMinutes)?.id;

  for (const c of items) {
    const start = timeToMinutes(c.start);
    const end = timeToMinutes(c.end);
    const isNow = start <= nowMinutes && nowMinutes < end;
    const isPast = end <= nowMinutes;
    const isNext = !isNow && c.id === nextId;

    const li = document.createElement('li');
    li.className = `class-item${isNow ? ' is-now' : ''}${isPast ? ' is-past' : ''}${isNext ? ' is-next' : ''}`;
    li.innerHTML = `
      <div class="class-time">${formatTime(c.start)} – ${formatTime(c.end)}</div>
      <div class="class-info">
        <div class="class-name">
          ${escapeHtml(c.name)}
          ${isNow ? '<span class="status-badge status-now">Now</span>' : ''}
          ${isNext ? '<span class="status-badge status-next">Next</span>' : ''}
        </div>
        ${c.location ? `<div class="class-location">${escapeHtml(c.location)}</div>` : ''}
      </div>
      <button type="button" class="remove-btn" data-id="${c.id}" aria-label="Remove class">×</button>
    `;
    classList.appendChild(li);
  }
  classList.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeClass(btn.dataset.id);
      render();
    });
  });
}

function renderTasks(items) {
  taskList.innerHTML = '';
  taskEmpty.hidden = items.length > 0;
  for (const t of items) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <label class="task-check">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}" />
        <span class="task-text ${t.done ? 'done' : ''}">${escapeHtml(t.text)}</span>
      </label>
      <button type="button" class="remove-btn" data-id="${t.id}" aria-label="Remove task">×</button>
    `;
    taskList.appendChild(li);
  }
  taskList.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', () => {
      toggleTask(box.dataset.id);
      render();
    });
  });
  taskList.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeTask(btn.dataset.id);
      render();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

toggleClassForm.addEventListener('click', () => {
  classForm.hidden = !classForm.hidden;
});

classForm.addEventListener('submit', (e) => {
  e.preventDefault();
  classFormError.hidden = true;

  const name = document.getElementById('classNameInput').value.trim();
  const location = document.getElementById('classLocationInput').value.trim();
  const start = document.getElementById('classStartInput').value;
  const end = document.getElementById('classEndInput').value;
  const days = Array.from(document.querySelectorAll('#dayPicker input:checked')).map((el) => Number(el.value));

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

  addClass({ name, location, start, end, days });
  classForm.reset();
  classForm.hidden = true;
  render();
});

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  addTask(text);
  taskInput.value = '';
  render();
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
