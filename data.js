/*
  Shared storage for app data (classes, tasks). Same caveat as auth.js:
  no backend. Signed-in users get localStorage keyed by email (persists
  across visits); guests get sessionStorage (cleared when the tab closes).
*/

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function dataStoreFor(session) {
  if (session.guest) return { store: sessionStorage, key: 'wolfpack_data_guest' };
  return { store: localStorage, key: `wolfpack_data_${session.email}` };
}

function loadData() {
  const session = getSession();
  const empty = { classes: [], tasks: [], goals: [] };
  if (!session) return empty;
  const { store, key } = dataStoreFor(session);
  try {
    const parsed = JSON.parse(store.getItem(key));
    return parsed
      ? { classes: parsed.classes || [], tasks: parsed.tasks || [], goals: parsed.goals || [] }
      : empty;
  } catch {
    return empty;
  }
}

function saveData(data) {
  const session = getSession();
  if (!session) return;
  const { store, key } = dataStoreFor(session);
  store.setItem(key, JSON.stringify(data));
}

function addClass(cls) {
  const data = loadData();
  data.classes.push({ id: uid(), ...cls });
  saveData(data);
  return data;
}

function updateClass(id, patch) {
  const data = loadData();
  const cls = data.classes.find((c) => c.id === id);
  if (cls) Object.assign(cls, patch);
  saveData(data);
  return data;
}

function removeClass(id) {
  const data = loadData();
  data.classes = data.classes.filter((c) => c.id !== id);
  saveData(data);
  return data;
}

function addTask(text, date = todayISO()) {
  const data = loadData();
  data.tasks.push({ id: uid(), text, done: false, date, createdAt: Date.now() });
  saveData(data);
  return data;
}

function toggleTask(id) {
  const data = loadData();
  const task = data.tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  saveData(data);
  return data;
}

function removeTask(id) {
  const data = loadData();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveData(data);
  return data;
}

function addGoal(goal) {
  const data = loadData();
  data.goals.push({ id: uid(), status: 'not-started', ...goal, createdAt: Date.now() });
  saveData(data);
  return data;
}

function updateGoal(id, patch) {
  const data = loadData();
  const goal = data.goals.find((g) => g.id === id);
  if (goal) Object.assign(goal, patch);
  saveData(data);
  return data;
}

function removeGoal(id) {
  const data = loadData();
  data.goals = data.goals.filter((g) => g.id !== id);
  saveData(data);
  return data;
}

function cycleGoalStatus(id) {
  const order = ['not-started', 'in-progress', 'done'];
  const data = loadData();
  const goal = data.goals.find((g) => g.id === id);
  if (goal) {
    goal.status = order[(order.indexOf(goal.status) + 1) % order.length];
  }
  saveData(data);
  return data;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
