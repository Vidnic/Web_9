const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const rest = require('./rest');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Парсеры
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== СТРАНИЦЫ ==========
app.get('/', (req, res) => {
    const items = rest.getAllItems();
    res.render('index', { games: items });
});

app.get('/chat', (req, res) => {
    res.render('chat');
});

// ========== API ==========
app.get('/api/items', rest.getItems);
app.get('/api/items/:id', rest.getItemById);
app.post('/api/items', rest.addItem);
app.put('/api/items/:id', rest.updateItem);
app.delete('/api/items/:id', rest.deleteItem);

// ========== WebSocket (Socket.IO) ==========
const users = {};  // { socketId: { id, name } }

io.on('connection', (socket) => {
    console.log('Новый пользователь подключился:', socket.id);
    
    // Пользователь присоединился к чату
    socket.on('user join', (userName) => {
        const userId = socket.id;
        users[userId] = { id: userId, name: userName };
        
        // Отправляем всем обновлённый список пользователей
        io.emit('users list', Object.values(users));
        
        // Отправляем всем сообщение о новом пользователе
        io.emit('chat message', {
            userId: 'system',
            userName: 'Система',
            message: `${userName} присоединился к чату`,
            time: new Date().toLocaleTimeString()
        });
        
        console.log(`Пользователь ${userName} присоединился`);
    });
    
    // Пользователь отправил сообщение
    socket.on('chat message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('chat message', {
                userId: socket.id,
                userName: user.name,
                message: data.message,
                time: new Date().toLocaleTimeString()
            });
        }
    });
    
    // Пользователь печатает...
    socket.on('typing', (isTyping) => {
        const user = users[socket.id];
        if (user) {
            socket.broadcast.emit('user typing', {
                userId: socket.id,
                userName: user.name,
                isTyping: isTyping
            });
        }
    });
    
    // Пользователь отключился
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            delete users[socket.id];
            
            // Отправляем всем обновлённый список
            io.emit('users list', Object.values(users));
            
            // Отправляем сообщение о выходе
            io.emit('chat message', {
                userId: 'system',
                userName: 'Система',
                message: `${user.name} покинул чат`,
                time: new Date().toLocaleTimeString()
            });
            
            console.log(`Пользователь ${user.name} отключился`);
        }
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});