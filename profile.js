// profile.js — Echo Profile & Settings

const SESSION_KEY = 'echo_session';
const DB_KEY = 'echo_users';

function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
}
function getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
}
function setUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

const session = checkAuth();
if (session) {
    const users = getUsers();
    const user = users.find(u => u.username === session.username);

    if (user) {
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-displayname').textContent = user.displayname || user.username;
        document.getElementById('theme-select').value = user.theme || 'light';
        document.getElementById('lang-select').value = user.lang || 'ru';
        applyTheme(user.theme || 'light');
    }

    // Сохранение настроек
    document.getElementById('save-settings').addEventListener('click', () => {
        const theme = document.getElementById('theme-select').value;
        const lang = document.getElementById('lang-select').value;
        const users = getUsers();
        const idx = users.findIndex(u => u.username === session.username);
        if (idx !== -1) {
            users[idx].theme = theme;
            users[idx].lang = lang;
            setUsers(users);
            applyTheme(theme);
            document.getElementById('settings-status').textContent = '✅ Настройки сохранены!';
            setTimeout(() => {
                document.getElementById('settings-status').textContent = '';
            }, 3000);
        }
    });

    // Назад в мессенджер
    document.getElementById('back-to-messenger').addEventListener('click', () => {
        window.location.href = 'messenger.html';
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}
