const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const guestNotice = document.getElementById('guestNotice');
const rangeHeading = document.getElementById('rangeHeading');
const calendarGrid = document.getElementById('calendarGrid');

let weekOffset = 0;

function init() {
  if (!session) return;
  guestNotice.hidden = !session.guest;
  render();
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function startOfWeek(offset) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - now.getDay() + offset * 7);
  return now;
}

function render() {
  const data = loadData();
  const start = startOfWeek(weekOffset);
  const todayIso = toISODate(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const first = days[0];
  const last = days[6];
  rangeHeading.textContent =
    first.getMonth() === last.getMonth()
      ? `${MONTH_ABBR[first.getMonth()]} ${first.getDate()} – ${last.getDate()}`
      : `${MONTH_ABBR[first.getMonth()]} ${first.getDate()} – ${MONTH_ABBR[last.getMonth()]} ${last.getDate()}`;

  calendarGrid.innerHTML = '';

  for (const date of days) {
    const dow = date.getDay();
    const iso = toISODate(date);
    const isToday = iso === todayIso;

    const dayClasses = data.classes
      .filter((c) => c.days.includes(dow))
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    const dayTasks = data.tasks.filter((t) => t.date === iso);

    const col = document.createElement('div');
    col.className = `calendar-day${isToday ? ' is-today' : ''}`;
    col.innerHTML = `
      <div class="calendar-day-head">
        <span class="calendar-day-name">${DAY_ABBR[dow]}</span>
        <span class="calendar-day-num">${date.getDate()}</span>
      </div>
      <div class="calendar-day-body">
        ${dayClasses
          .map(
            (c) => `<div class="calendar-class">
              <span class="calendar-class-time">${formatTime(c.start)}</span>
              <span class="calendar-class-name">${escapeHtml(c.name)}</span>
            </div>`
          )
          .join('')}
        ${dayTasks
          .map(
            (t) => `<label class="calendar-task">
              <input type="checkbox" ${t.done ? 'checked' : ''} data-toggle="${t.id}" />
              <span class="${t.done ? 'done' : ''}">${escapeHtml(t.text)}</span>
              <button type="button" class="remove-btn" data-remove="${t.id}" aria-label="Remove task">×</button>
            </label>`
          )
          .join('')}
      </div>
      <form class="calendar-add-task" data-date="${iso}">
        <input type="text" placeholder="+ task" aria-label="Add task for ${DAY_ABBR[dow]} ${date.getDate()}" />
        <button type="submit" aria-label="Add task">+</button>
      </form>
    `;
    calendarGrid.appendChild(col);
  }

  calendarGrid.querySelectorAll('[data-toggle]').forEach((box) => {
    box.addEventListener('change', () => {
      toggleTask(box.dataset.toggle);
      render();
    });
  });
  calendarGrid.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeTask(btn.dataset.remove);
      render();
    });
  });
  calendarGrid.querySelectorAll('.calendar-add-task').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      addTask(text, form.dataset.date);
      render();
    });
  });
}

document.getElementById('prevWeekBtn').addEventListener('click', () => {
  weekOffset -= 1;
  render();
});
document.getElementById('nextWeekBtn').addEventListener('click', () => {
  weekOffset += 1;
  render();
});
document.getElementById('thisWeekBtn').addEventListener('click', () => {
  weekOffset = 0;
  render();
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
