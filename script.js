// ===== ХРАНИЛИЩЕ =====
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

// ===== ПРОВЕРКА СЕССИИ =====
function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

// ============================================
// ===== СТРАНИЦА ВХОДА (index.html) =====
// ============================================
if (window.location.pathname.endsWith('index.html') || 
    window.location.pathname === '/' || 
    window.location.pathname === '') {
    
    // Если уже есть сессия - перенаправляем
    if (getSession()) {
        window.location.href = 'messenger.html';
    }

    // Переключение табов
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const formId = tab.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(formId).classList.add('active');
        });
    });

    // Регистрация
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
        
        users.push({ 
            username, 
            password, 
            displayname, 
            theme: 'light', 
            lang: 'ru',
            createdAt: new Date().toISOString()
        });
        setUsers(users);
        errorEl.textContent = '';
        alert('✅ Регистрация успешна! Теперь войдите.');
        document.querySelector('[data-tab="login"]').click();
    });

    // Вход
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');

        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            errorEl.textContent = '❌ Неверное имя или пароль!';
            return;
        }
        
        errorEl.textContent = '';
        setSession({ username: user.username, displayname: user.displayname });
        window.location.href = 'messenger.html';
    });
}

// ============================================
// ===== СТРАНИЦА МЕССЕНДЖЕРА =====
// ============================================
if (window.location.pathname.includes('messenger.html')) {
    console.log('✅ Messenger страница загружена');
    
    const session = checkAuth();
    if (!session) {
        console.log('❌ Нет сессии');
        throw new Error('No session');
    }
    
    console.log('👤 Текущий пользователь:', session.username);
    
    let currentChat = null;
    let allUsers = [];
    let filteredUsers = [];

    // Загружаем пользователей
    function loadUsers() {
        allUsers = getUsers();
        filteredUsers = [...allUsers];
        console.log('📋 Всего пользователей:', allUsers.length);
        console.log('👥 Пользователи:', allUsers.map(u => u.username).join(', '));
        renderUserList();
    }

    // Поиск
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                filteredUsers = [...allUsers];
            } else {
                filteredUsers = allUsers.filter(u => 
                    u.username.toLowerCase().includes(query) || 
                    (u.displayname && u.displayname.toLowerCase().includes(query))
                );
            }
            renderUserList();
        });
    }

    // Отрисовка списка пользователей
    function renderUserList() {
        const list = document.getElementById('user-list');
        if (!list) {
            console.error('❌ Элемент user-list не найден!');
            return;
        }
        
        list.innerHTML = '';
        
        // Исключаем текущего пользователя
        const availableUsers = filteredUsers.filter(u => u.username !== session.username);
        
        console.log('👥 Доступные пользователи:', availableUsers.length);
        
        if (availableUsers.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding: 2rem 1.5rem; text-align: center; color: #8896a8;';
            emptyMsg.innerHTML = filteredUsers.length === 0 ? 
                '🔍 Пользователь не найден' : 
                '🤝 Пока нет других пользователей<br><span style="font-size:0.8rem;">Зарегистрируйте нового пользователя в другой вкладке</span>';
            list.appendChild(emptyMsg);
            return;
        }

        availableUsers.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-item' + (currentChat === u.username ? ' active' : '');
            
            // Информация о пользователе
            const info = document.createElement('div');
            info.className = 'user-info';
            
            const displayName = document.createElement('span');
            displayName.className = 'display-name';
            displayName.textContent = u.displayname || u.username;
            
            const username = document.createElement('span');
            username.className = 'username';
            username.textContent = `@${u.username}`;
            
            info.appendChild(displayName);
            info.appendChild(username);
            
            const status = document.createElement('span');
            status.className = 'status';
            
            div.appendChild(info);
            div.appendChild(status);
            
            div.dataset.username = u.username;
            div.addEventListener('click', () => {
                currentChat = u.username;
                renderUserList();
                renderMessages();
                const header = document.getElementById('chat-header');
                if (header) {
                    header.innerHTML = `💬 ${u.displayname || u.username} <span style="font-weight:normal;font-size:0.8rem;color:#8896a8;">@${u.username}</span>`;
                }
            });
            
            list.appendChild(div);
        });
    }

    // Отрисовка сообщений
    function renderMessages() {
        const container = document.getElementById('messages');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!currentChat) {
            container.innerHTML = '<p style="opacity:0.5;text-align:center;margin-top:2rem;">👈 Выберите собеседника</p>';
            return;
        }
        
        const all = getMessages();
        const chatKey = [session.username, currentChat].sort().join('_');
        const msgs = all[chatKey] || [];
        
        if (msgs.length === 0) {
            container.innerHTML = '<p style="opacity:0.5;text-align:center;margin-top:2rem;">💬 Напишите первое сообщение!</p>';
            return;
        }
        
        msgs.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'message' + (msg.from === session.username ? ' self' : '');
            
            const senderName = msg.from === session.username ? 'Вы' : 
                (allUsers.find(u => u.username === msg.from)?.displayname || msg.from);
            
            const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            div.innerHTML = `<span class="sender">${senderName}</span> ${msg.text} <span class="time">${time}</span>`;
            container.appendChild(div);
        });
        
        container.scrollTop = container.scrollHeight;
    }

    // Отправка сообщения
    function sendMessage() {
        const input = document.getElementById('message-text');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text || !currentChat) {
            if (!currentChat) alert('Выберите собеседника!');
            return;
        }
        
        const all = getMessages();
        const chatKey = [session.username, currentChat].sort().join('_');
        if (!all[chatKey]) all[chatKey] = [];
        
        all[chatKey].push({ 
            from: session.username, 
            text, 
            timestamp: Date.now() 
        });
        
        setMessages(all);
        input.value = '';
        renderMessages();
        
        // Имитация ответа
        simulateReply();
    }

    // Имитация ответа
    function simulateReply() {
        const replies = ['Привет! 👋', 'Как дела?', 'Ок', '👍', 'Спасибо!', 'Да, конечно', 'Понял', 'Отлично! 😊'];
        setTimeout(() => {
            if (!currentChat) return;
            
            const all = getMessages();
            const chatKey = [session.username, currentChat].sort().join('_');
            if (!all[chatKey]) all[chatKey] = [];
            
            const last = all[chatKey][all[chatKey].length - 1];
            if (last && last.from === session.username) {
                all[chatKey].push({
                    from: currentChat,
                    text: replies[Math.floor(Math.random() * replies.length)],
                    timestamp: Date.now()
                });
                setMessages(all);
                renderMessages();
            }
        }, 1000 + Math.random() * 2000);
    }

    // Назначение обработчиков
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-text');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.href = 'index.html';
        });
    }

    // Загрузка данных
    loadUsers();
    renderMessages();
    
    console.log('✅ Messenger инициализирован');
}

// ============================================
// ===== ПРОФИЛЬ (profile.html) =====
// ============================================
if (window.location.pathname.includes('profile.html')) {
    const session = checkAuth();
    if (!session) return;

    const users = getUsers();
    const user = users.find(u => u.username === session.username);

    if (user) {
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-displayname').textContent = user.displayname || user.username;
        document.getElementById('theme-select').value = user.theme || 'light';
        document.getElementById('lang-select').value = user.lang || 'ru';
        applyTheme(user.theme || 'light');
    }

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
