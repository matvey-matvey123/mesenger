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
    window.location.pathname === '' ||
    window.location.pathname.includes('index')) {
    
    // Если уже есть сессия - перенаправляем
    if (getSession()) {
        window.location.href = 'messenger.html';
    }

    // Переключение табов - поддерживаем и click, и touch
    document.querySelectorAll('.tab').forEach(tab => {
        const switchTab = function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const formId = tab.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            const form = document.getElementById(formId);
            if (form) form.classList.add('active');
            // Очищаем ошибки при переключении
            document.getElementById('login-error').textContent = '';
            document.getElementById('reg-error').textContent = '';
        };
        
        tab.addEventListener('click', switchTab);
        tab.addEventListener('touchstart', switchTab, { passive: true });
    });

    // Регистрация
    const registerForm = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');
    
    function handleRegister(e) {
        if (e) e.preventDefault();
        
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
        
        // Показываем сообщение об успехе
        alert('✅ Регистрация успешна! Теперь войдите.');
        
        // Переключаем на вкладку входа
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="login"]').classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('login-form').classList.add('active');
        
        // Очищаем поля регистрации
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('reg-displayname').value = '';
    }
    
    registerForm.addEventListener('submit', handleRegister);
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        registerBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleRegister(e);
        }, { passive: false });
    }

    // Вход
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    
    function handleLogin(e) {
        if (e) e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');

        if (!username || !password) {
            errorEl.textContent = 'Введите имя и пароль!';
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            errorEl.textContent = '❌ Неверное имя или пароль!';
            return;
        }
        
        errorEl.textContent = '';
        setSession({ username: user.username, displayname: user.displayname });
        window.location.href = 'messenger.html';
    }
    
    loginForm.addEventListener('submit', handleLogin);
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        loginBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleLogin(e);
        }, { passive: false });
    }
}

// ============================================
// ===== СТРАНИЦА МЕССЕНДЖЕРА =====
// ============================================
if (window.location.pathname.includes('messenger.html')) {
    const session = checkAuth();
    if (!session) return;
    
    let currentChat = null;
    let allUsers = [];
    let filteredUsers = [];

    function loadUsers() {
        allUsers = getUsers();
        filteredUsers = [...allUsers];
        renderUserList();
    }

    // Поиск
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
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

    function renderUserList() {
        const list = document.getElementById('user-list');
        if (!list) return;
        
        list.innerHTML = '';
        const availableUsers = filteredUsers.filter(u => u.username !== session.username);
        
        if (availableUsers.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding: 2rem 1.5rem; text-align: center; color: #8896a8;';
            emptyMsg.innerHTML = filteredUsers.length === 0 ? 
                '🔍 Пользователь не найден' : 
                '🤝 Пока нет других пользователей';
            list.appendChild(emptyMsg);
            return;
        }

        availableUsers.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-item' + (currentChat === u.username ? ' active' : '');
            
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
            
            // Поддерживаем и click, и touch
            const selectUser = function(e) {
                e.preventDefault();
                currentChat = u.username;
                renderUserList();
                renderMessages();
                const header = document.getElementById('chat-header');
                if (header) {
                    header.innerHTML = `💬 ${u.displayname || u.username} <span style="font-weight:normal;font-size:0.8rem;color:#8896a8;">@${u.username}</span>`;
                }
            };
            
            div.addEventListener('click', selectUser);
            div.addEventListener('touchstart', selectUser, { passive: false });
            
            list.appendChild(div);
        });
    }

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

    function sendMessage() {
        const input = document.getElementById('message-text');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text || !currentChat) {
            if (!currentChat) {
                // Визуальное предупреждение на мобильных
                const header = document.getElementById('chat-header');
                if (header) {
                    header.style.color = '#d9534f';
                    setTimeout(() => header.style.color = '', 1000);
                }
            }
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
        simulateReply();
    }

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
        sendBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            sendMessage();
        }, { passive: false });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            clearSession();
            window.location.href = 'index.html';
        });
        logoutBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            clearSession();
            window.location.href = 'index.html';
        }, { passive: false });
    }

    loadUsers();
    renderMessages();
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
        const usernameEl = document.getElementById('profile-username');
        const displaynameEl = document.getElementById('profile-displayname');
        if (usernameEl) usernameEl.textContent = user.username;
        if (displaynameEl) displaynameEl.textContent = user.displayname || user.username;
        document.getElementById('theme-select').value = user.theme || 'light';
        document.getElementById('lang-select').value = user.lang || 'ru';
        applyTheme(user.theme || 'light');
    }

    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        const handleSave = function(e) {
            if (e) e.preventDefault();
            const theme = document.getElementById('theme-select').value;
            const lang = document.getElementById('lang-select').value;
            const users = getUsers();
            const idx = users.findIndex(u => u.username === session.username);
            
            if (idx !== -1) {
                users[idx].theme = theme;
                users[idx].lang = lang;
                setUsers(users);
                applyTheme(theme);
                const statusEl = document.getElementById('settings-status');
                if (statusEl) {
                    statusEl.textContent = '✅ Настройки сохранены!';
                    setTimeout(() => statusEl.textContent = '', 3000);
                }
            }
        };
        
        saveBtn.addEventListener('click', handleSave);
        saveBtn.addEventListener('touchstart', handleSave, { passive: false });
    }

    const backBtn = document.getElementById('back-to-messenger');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'messenger.html';
        });
        backBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            window.location.href = 'messenger.html';
        }, { passive: false });
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}
