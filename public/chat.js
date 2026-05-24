let socket = null;
let currentUser = null;

const loginOverlay = document.getElementById('loginOverlay');
const chatContainer = document.getElementById('chatContainer');
const userNameInput = document.getElementById('userNameInput');
const joinBtn = document.getElementById('joinBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const usersList = document.getElementById('usersList');
const typingIndicator = document.getElementById('typingIndicator');

let typingTimeout = null;

// Подключение к чату
function connectToChat(userName) {
    socket = io();
    currentUser = userName;
    
    socket.on('connect', () => {
        console.log('Подключено к серверу');
        socket.emit('user join', userName);
    });
    
    // Получение списка пользователей
    socket.on('users list', (users) => {
        renderUsersList(users);
    });
    
    // Получение сообщения
    socket.on('chat message', (data) => {
        addMessageToChat(data);
    });
    
    // Отправка сообщения
    sendBtn.onclick = () => {
        sendMessage();
    };
    
    messageInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
            // Пользователь печатает
            socket.emit('typing', true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.emit('typing', false);
            }, 1000);
        }
    };
    
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
}

// Отправка сообщения
function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
    
    socket.emit('chat message', { message: message });
    messageInput.value = '';
    messageInput.focus();
    
    // Сбрасываем индикатор печатания
    socket.emit('typing', false);
}

// Добавление сообщения в чат
function addMessageToChat(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    if (data.userId === 'system') {
        messageDiv.classList.add('system');
        messageDiv.innerHTML = `<div class="message-text">${data.message}</div>`;
    } else if (data.userId === socket.id) {
        messageDiv.classList.add('self');
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-name">Вы</span>
                <span class="message-time">${data.time}</span>
            </div>
            <div class="message-text">${escapeHtml(data.message)}</div>
        `;
    } else {
        messageDiv.classList.add('other');
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-name">${escapeHtml(data.userName)}</span>
                <span class="message-time">${data.time}</span>
            </div>
            <div class="message-text">${escapeHtml(data.message)}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Отображение списка пользователей
function renderUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="online-dot"></span>
            <span>${escapeHtml(user.name)}</span>
        `;
        usersList.appendChild(li);
    });
}

// Вход в чат
joinBtn.onclick = () => {
    const userName = userNameInput.value.trim();
    if (userName === '') {
        alert('Введите ваше имя');
        return;
    }
    
    loginOverlay.style.display = 'none';
    chatContainer.style.display = 'flex';
    connectToChat(userName);
};

// Нажатие Enter в поле имени
userNameInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        joinBtn.click();
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}