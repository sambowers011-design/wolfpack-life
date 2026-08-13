/*
  Client-side only "auth" for this static demo — there is no backend or database.
  Accounts live in this browser's localStorage; sessions live in sessionStorage.
  Passwords are hashed (SHA-256) before storage so they aren't kept in plain text,
  but this is NOT real security (no server, no salt-per-install secrecy, anyone with
  console access to this browser profile can read the hashed store). Don't reuse a
  real password here.
*/

const USERS_KEY = 'wolfpack_users';
const SESSION_KEY = 'wolfpack_session';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function createAccount(name, email, password) {
  const users = readUsers();
  const key = email.trim().toLowerCase();
  if (users[key]) {
    throw new Error('An account with that email already exists.');
  }
  users[key] = { name: name.trim(), email: key, passwordHash: await hashPassword(password) };
  writeUsers(users);
  setSession({ name: users[key].name, email: key, guest: false });
}

async function signIn(email, password) {
  const users = readUsers();
  const key = email.trim().toLowerCase();
  const user = users[key];
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error('Email or password is incorrect.');
  }
  setSession({ name: user.name, email: user.email, guest: false });
}

function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function setGuestSession() {
  setSession({ name: 'Guest', email: null, guest: true });
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
