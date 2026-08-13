const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const guestNotice = document.getElementById('guestNotice');
const placeList = document.getElementById('placeList');
const placesEmpty = document.getElementById('placesEmpty');
const togglePlaceForm = document.getElementById('togglePlaceForm');
const placeForm = document.getElementById('placeForm');
const placeFormError = document.getElementById('placeFormError');
const nameInput = document.getElementById('placeNameInput');
const noteInput = document.getElementById('placeNoteInput');

function init() {
  if (!session) return;
  guestNotice.hidden = !session.guest;
  render();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function mapSearchUrl(name) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${name} Raleigh NC`)}`;
}

function render() {
  const data = loadData();
  placesEmpty.hidden = data.places.length > 0;
  placeList.innerHTML = '';

  for (const p of data.places) {
    const li = document.createElement('li');
    li.className = 'place-item';
    li.innerHTML = `
      <div class="place-info">
        <div class="class-name">${escapeHtml(p.name)}</div>
        ${p.note ? `<div class="class-location">${escapeHtml(p.note)}</div>` : ''}
      </div>
      <div class="class-actions">
        <a class="link-btn" href="${mapSearchUrl(p.name)}" target="_blank" rel="noopener noreferrer">View on map</a>
        <button type="button" class="remove-btn" data-remove="${p.id}" aria-label="Remove place">×</button>
      </div>
    `;
    placeList.appendChild(li);
  }

  placeList.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removePlace(btn.dataset.remove);
      render();
    });
  });
}

togglePlaceForm.addEventListener('click', () => {
  if (placeForm.hidden) {
    placeForm.reset();
    placeFormError.hidden = true;
    placeForm.hidden = false;
  } else {
    placeForm.hidden = true;
  }
});

placeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  placeFormError.hidden = true;

  const name = nameInput.value.trim();
  const note = noteInput.value.trim();

  if (!name) {
    placeFormError.textContent = 'Enter a place name.';
    placeFormError.hidden = false;
    return;
  }

  addPlace({ name, note });
  placeForm.reset();
  placeForm.hidden = true;
  render();
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
