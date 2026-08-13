const params = new URLSearchParams(window.location.search);
let mode = params.get('mode') === 'create' ? 'create' : 'signin';

const authEyebrow = document.getElementById('authEyebrow');
const authTitle = document.getElementById('authTitle');
const nameField = document.getElementById('nameField');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const submitBtn = document.getElementById('submitBtn');
const switchPrompt = document.getElementById('switchPrompt');
const switchBtn = document.getElementById('switchBtn');
const formError = document.getElementById('formError');
const authForm = document.getElementById('authForm');
const guestBtn = document.getElementById('guestBtn');

function render() {
  const create = mode === 'create';
  authEyebrow.textContent = create ? 'Join the pack.' : 'Welcome back.';
  authTitle.textContent = create ? 'Create account' : 'Sign in';
  nameField.hidden = !create;
  nameInput.required = create;
  passwordInput.autocomplete = create ? 'new-password' : 'current-password';
  submitBtn.textContent = create ? 'Create account' : 'Sign in';
  switchPrompt.textContent = create ? 'Already have an account?' : 'Need an account?';
  switchBtn.textContent = create ? 'Sign in instead' : 'Create one';
  formError.hidden = true;
  const url = new URL(window.location.href);
  url.searchParams.set('mode', mode);
  window.history.replaceState({}, '', url);
}

switchBtn.addEventListener('click', () => {
  mode = mode === 'create' ? 'signin' : 'create';
  render();
});

guestBtn.addEventListener('click', () => {
  setGuestSession();
  window.location.href = 'board.html';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;
  submitBtn.disabled = true;
  try {
    if (mode === 'create') {
      if (!nameInput.value.trim()) throw new Error('Enter your name.');
      if (passwordInput.value.length < 8) throw new Error('Password needs at least 8 characters.');
      const wasGuest = existingSession?.guest;
      const guestData = wasGuest ? loadData() : null;
      await createAccount(nameInput.value, emailInput.value, passwordInput.value);
      if (guestData && (guestData.classes.length || guestData.tasks.length)) {
        saveData(guestData);
      }
    } else {
      await signIn(emailInput.value, passwordInput.value);
    }
    window.location.href = 'board.html';
  } catch (err) {
    formError.textContent = err.message || 'Something went wrong.';
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

render();

const existingSession = getSession();
if (existingSession && !existingSession.guest) {
  window.location.href = 'board.html';
}
