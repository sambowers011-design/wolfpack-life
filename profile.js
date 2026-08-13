const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
}

const guestPanel = document.getElementById('guestPanel');
const accountPanels = document.getElementById('accountPanels');

const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const nameFormError = document.getElementById('nameFormError');
const nameSubmitBtn = document.getElementById('nameSubmitBtn');

const passwordForm = document.getElementById('passwordForm');
const currentPasswordInput = document.getElementById('currentPasswordInput');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const passwordFormError = document.getElementById('passwordFormError');
const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');

const showDeleteBtn = document.getElementById('showDeleteBtn');
const deleteForm = document.getElementById('deleteForm');
const deletePasswordInput = document.getElementById('deletePasswordInput');
const deleteFormError = document.getElementById('deleteFormError');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

function init() {
  if (!session) return;

  if (session.guest) {
    guestPanel.hidden = false;
    accountPanels.hidden = true;
    return;
  }

  guestPanel.hidden = true;
  accountPanels.hidden = false;
  nameInput.value = session.name;
  emailInput.value = session.email;
}

function flashSaved(btn, defaultText) {
  const original = defaultText;
  btn.textContent = 'Saved';
  setTimeout(() => {
    btn.textContent = original;
  }, 1500);
}

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  nameFormError.hidden = true;

  const newName = nameInput.value.trim();
  if (!newName) {
    nameFormError.textContent = 'Enter your name.';
    nameFormError.hidden = false;
    return;
  }

  updateName(session.email, newName);
  session.name = newName;
  setSession(session);
  flashSaved(nameSubmitBtn, 'Save name');
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  passwordFormError.hidden = true;

  const current = currentPasswordInput.value;
  const next = newPasswordInput.value;
  const confirm = confirmPasswordInput.value;

  if (next.length < 8) {
    passwordFormError.textContent = 'New password needs at least 8 characters.';
    passwordFormError.hidden = false;
    return;
  }
  if (next !== confirm) {
    passwordFormError.textContent = "New passwords don't match.";
    passwordFormError.hidden = false;
    return;
  }

  passwordSubmitBtn.disabled = true;
  try {
    await changePassword(session.email, current, next);
    passwordForm.reset();
    flashSaved(passwordSubmitBtn, 'Change password');
  } catch (err) {
    passwordFormError.textContent = err.message || 'Something went wrong.';
    passwordFormError.hidden = false;
  } finally {
    passwordSubmitBtn.disabled = false;
  }
});

showDeleteBtn.addEventListener('click', () => {
  showDeleteBtn.hidden = true;
  deleteForm.hidden = false;
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteForm.hidden = true;
  deleteForm.reset();
  deleteFormError.hidden = true;
  showDeleteBtn.hidden = false;
});

deleteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  deleteFormError.hidden = true;

  const users = readUsers();
  const key = session.email.trim().toLowerCase();
  const user = users[key];
  const enteredHash = await hashPassword(deletePasswordInput.value);

  if (!user || user.passwordHash !== enteredHash) {
    deleteFormError.textContent = 'Password is incorrect.';
    deleteFormError.hidden = false;
    return;
  }

  removeAccount(session.email);
  clearSession();
  window.location.href = 'index.html';
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

init();
