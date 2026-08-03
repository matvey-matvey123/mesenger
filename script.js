// script.js — Echo Messenger

// ---- Хранилище ----
const DB_KEY = 'echo_users';
const SESSION_KEY = 'echo_session';
const MESSAGES_KEY = 'echo_messages';

function getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
}
function setUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}
function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
}
function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}
function getMessages() {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY)) || {};
}
function setMessages(messages) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// ---- Переключение табов ----
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const formId = tab.dataset.tab === 'login' ? 'login-form' : 'register-form';
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(formId).classList.add('active');
    });
});

// ---- Регистрация ----
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const displayname = document.getElementById('reg-displayname').value.trim() || username;
    const errorEl = document.getElementById('reg-error');

    if (!username || !password) {
        errorEl.textContent = 'Заполните все поля!';
        return;
    }
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        errorEl.textContent = 'Пользователь уже существует!';
        return;
    }
    users.push({ username, password, displayname, theme: 'light', lang: 'ru' });
    setUsers(users);
    errorEl.textContent = '';
    alert('✅ Регистрация успешна! Теперь войдите.');
    document.querySelector('[data-tab="login"]').click();
});

// ---- Вход ----
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        errorEl.textContent = 'Неверное имя или пароль!';
        return;
    }
    errorEl.textContent = '';
    setSession({ username: user.username, displayname: user.displayname });
    window.location.href = 'messenger.html';
});

// ---- Проверка сессии (на страницах) ----
function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

// ---- Если мы на messenger.html ----
if (window.location.pathname.includes('messenger.html')) {
    const session = checkAuth();
    if (!session) throw new Error('No session');

    let currentChat = null;
    const users = getUsers();

    // Загружаем список пользователей
    function renderUserList() {
        const list = document.getElementById('user-list');
        list.innerHTML = '';
        users.forEach(u => {
            if (u.username === session.username) return;
            const div = document.createElement('div');
            div.className = 'user-item' + (currentChat === u.username ? ' active' : '');
            div.textContent = u.displayname || u.username;
            div.dataset.username = u.username;
            div.addEventListener('click', () => {
                currentChat = u.username;
                renderUserList();
                renderMessages();
                document.getElementById('chat-header').innerHTML = `💬 ${u.displayname || u.username}`;
            });
            list.appendChild(div);
        });
    }

    function renderMessages() {
        const container = document.getElementById('messages');
        container.innerHTML = '';
        if (!currentChat) {
            container.innerHTML = '<p style="opacity:0.5;text-align:center;">Выберите собеседника</p>';
            return;
        }
        const all = getMessages();
        const chatKey = [session.username, currentChat].sort().join('_');
        const msgs = all[chatKey] || [];
        msgs.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'message' + (msg.from === session.username ? ' self' : '');
            div.innerHTML = `<span class="sender">${msg.from === session.username ? 'Вы' : msg.from}</span> ${msg.text}`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    // Отправка сообщения
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-text').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const input = document.getElementById('message-text');
        const text = input.value.trim();
        if (!text || !currentChat) return;
        const all = getMessages();
        const chatKey = [session.username, currentChat].sort().join('_');
        if (!all[chatKey]) all[chatKey] = [];
        all[chatKey].push({ from: session.username, text, timestamp: Date.now() });
        setMessages(all);
        input.value = '';
        renderMessages();
        // Имитация ответа (для демо)
        simulateReply();
    }

    function simulateReply() {
        // Небольшая задержка для имитации ответа
        const replies = ['Привет!', 'Как дела?', 'Ок', '👍', 'Спасибо!', 'Да, конечно', 'Понял'];
        setTimeout(() => {
            if (!currentChat) return;
            const all = getMessages();
            const chatKey = [session.username, currentChat].sort().join('_');
            if (!all[chatKey]) all[chatKey] = [];
            // Проверяем, что последнее сообщение не от нас (чтобы не дублировать)
            const last = all[chatKey][all[chatKey].length - 1];
            if (last && last.from === currentChat) return;
            all[chatKey].push({
                from: currentChat,
                text: replies[Math.floor(Math.random() * replies.length)],
                timestamp: Date.now()
            });
            setMessages(all);
            renderMessages();
        }, 1000 + Math.random() * 2000);
    }

    // Выход
    document.getElementById('logout-btn').addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
    });

    // Инициализация
    renderUserList();
    renderMessages();
}

// ---- Если на index.html ----
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
    // Если уже есть сессия — перенаправляем
    if (getSession()) {
        window.location.href = 'messenger.html';
    }
}
