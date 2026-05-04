// ═══════════════════════════════════════════════════════
//  AUTH.JS — Autenticação e gerenciamento de usuários
//  Armazenamento: localStorage (particionado por usuário)
// ═══════════════════════════════════════════════════════

const AUTH_KEY  = 'cf_users';
const SESSION_KEY = 'cf_session';

// Hash simples (não criptográfico — para produção real usar bcrypt via backend)
function hashPassword(pass) {
  let h = 0;
  for (let i = 0; i < pass.length; i++) {
    h = Math.imul(31, h) + pass.charCodeAt(i) | 0;
  }
  return 'h' + Math.abs(h).toString(36) + pass.length.toString(36);
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]'); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function initUsers() {
  const users = getUsers();
  if (!users.find(u => u.username === 'admin')) {
    users.push({
      username: 'admin',
      passwordHash: hashPassword('92466388Dudu@'),
      role: 'superadmin',
      displayName: 'Administrador',
      createdAt: new Date().toISOString(),
      dataKey: 'cf_data_admin'
    });
    saveUsers(users);
  }
}

function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username.toLowerCase().trim());
  if (!user) return { ok: false, error: 'Usuário não encontrado.' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Senha incorreta.' };
  const session = { username: user.username, role: user.role, displayName: user.displayName, dataKey: user.dataKey, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

function requireAuth(redirectTo = 'index.html') {
  const s = getSession();
  if (!s) { window.location.href = redirectTo; return null; }
  return s;
}

function requireAdmin(redirectTo = 'index.html') {
  const s = requireAuth(redirectTo);
  if (!s || s.role !== 'superadmin') { window.location.href = redirectTo; return null; }
  return s;
}

function createUser(username, password, displayName, role = 'user') {
  const users = getUsers();
  const uname = username.toLowerCase().trim();
  if (users.find(u => u.username === uname)) return { ok: false, error: 'Usuário já existe.' };
  if (password.length < 6) return { ok: false, error: 'Senha deve ter pelo menos 6 caracteres.' };
  users.push({
    username: uname,
    passwordHash: hashPassword(password),
    role,
    displayName: displayName || uname,
    createdAt: new Date().toISOString(),
    dataKey: 'cf_data_' + uname
  });
  saveUsers(users);
  return { ok: true };
}

function changePassword(username, newPassword) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: 'Usuário não encontrado.' };
  if (newPassword.length < 6) return { ok: false, error: 'Senha deve ter pelo menos 6 caracteres.' };
  users[idx].passwordHash = hashPassword(newPassword);
  saveUsers(users);
  return { ok: true };
}

function deleteUser(username) {
  if (username === 'admin') return { ok: false, error: 'Não é possível remover o admin.' };
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  saveUsers(users);
  // Also remove user data
  const dataKey = 'cf_data_' + username;
  localStorage.removeItem(dataKey);
  return { ok: true };
}

function listUsers() {
  return getUsers().map(u => ({
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt,
    dataKey: u.dataKey
  }));
}

// Load/save user financial data
function loadUserData(session, defaultData) {
  try {
    const raw = localStorage.getItem(session.dataKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return JSON.parse(JSON.stringify(defaultData));
}

function saveUserData(session, data) {
  localStorage.setItem(session.dataKey, JSON.stringify(data));
}

initUsers();
