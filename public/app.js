const API_URL = '/api/items';

// Глобальные переменные
let allGames = [];
let currentSort = { field: 'name', order: 'asc' };
let currentSearch = '';
let currentPage = 1;
const itemsPerPage = 6;

// Загрузка всех игр с сервера
async function loadGamesFromServer() {
    try {
        const response = await fetch(API_URL);
        allGames = await response.json();
        applyFiltersAndRender();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

// Применение фильтров, сортировки и пагинации
function applyFiltersAndRender() {
    let filtered = [...allGames];
    
    // Поиск по названию
    if (currentSearch) {
        filtered = filtered.filter(game => 
            game.name.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    // Сортировка
    filtered.sort((a, b) => {
        let valA = a[currentSort.field];
        let valB = b[currentSort.field];
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Пагинация
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    // Отрисовка
    renderGamesList(paginated);
    renderPagination(totalPages);
}

// Отрисовка списка игр
function renderGamesList(games) {
    const container = document.getElementById('gamesList');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">Ничего не найдено</p>';
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="game-card" data-id="${game.id}">
            <h3>${escapeHtml(game.name)}</h3>
            <p>💰 Цена: ${escapeHtml(game.price)}</p>
            <p>🎮 Жанр: ${escapeHtml(game.genre || 'Не указан')}</p>
            <div class="game-actions">
                <button class="edit-btn" data-id="${game.id}">✏️ Редактировать</button>
                <button class="delete-btn" data-id="${game.id}">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

// Отрисовка пагинации
function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let buttons = '';
    
    // Кнопка "Назад"
    buttons += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        buttons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // Кнопка "Вперёд"
    buttons += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    
    container.innerHTML = buttons;
    
    // Вешаем обработчики на кнопки пагинации
    document.querySelectorAll('.page-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page)) {
                    currentPage = page;
                    applyFiltersAndRender();
                }
            });
        }
    });
}

// Добавление игры
async function addGame() {
    const name = document.getElementById('newName').value.trim();
    const price = document.getElementById('newPrice').value.trim();
    const genre = document.getElementById('newGenre').value.trim();
    
    if (!name || !price) {
        alert('Название и цена обязательны');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, genre })
        });
        
        if (response.ok) {
            document.getElementById('newName').value = '';
            document.getElementById('newPrice').value = '';
            document.getElementById('newGenre').value = '';
            await loadGamesFromServer();
            currentPage = 1;
            applyFiltersAndRender();
        } else {
            alert('Ошибка при добавлении');
        }
    } catch (error) {
        alert('Ошибка при добавлении');
    }
}

// Удаление игры
async function deleteGame(id) {
    if (!confirm('Удалить эту игру?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadGamesFromServer();
            applyFiltersAndRender();
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// Редактирование игры
function editGame(id, name, price, genre) {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPrice').value = price;
    document.getElementById('editGenre').value = genre || '';
    document.getElementById('editModal').style.display = 'block';
}

async function saveEdit() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const price = document.getElementById('editPrice').value.trim();
    const genre = document.getElementById('editGenre').value.trim();
    
    if (!name || !price) {
        alert('Название и цена обязательны');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, genre })
        });
        
        if (response.ok) {
            document.getElementById('editModal').style.display = 'none';
            await loadGamesFromServer();
            applyFiltersAndRender();
        } else {
            alert('Ошибка при сохранении');
        }
    } catch (error) {
        alert('Ошибка при сохранении');
    }
}

// Сортировка по названию
function toggleSortByName() {
    const btn = document.getElementById('sortByNameBtn');
    if (currentSort.field === 'name') {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        btn.textContent = currentSort.order === 'asc' ? 'По названию ↑' : 'По названию ↓';
    } else {
        currentSort = { field: 'name', order: 'asc' };
        btn.textContent = 'По названию ↑';
    }
    currentPage = 1;
    applyFiltersAndRender();
}

// Поиск
function searchGames() {
    const input = document.getElementById('searchInput');
    currentSearch = input.value.trim();
    currentPage = 1;
    applyFiltersAndRender();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    currentSearch = '';
    currentPage = 1;
    applyFiltersAndRender();
}

// HTML-экранирование
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', async () => {
    await loadGamesFromServer();
    
    // Кнопки поиска и сортировки
    document.getElementById('searchBtn').addEventListener('click', searchGames);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('sortByNameBtn').addEventListener('click', toggleSortByName);
    
    // Поиск при нажатии Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchGames();
    });
    
    // Добавление игры
    document.getElementById('addBtn').addEventListener('click', addGame);
    
    // Редактирование
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
    });
    
    // Закрытие модального окна по клику вне
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Обработка кликов по кнопкам редактирования/удаления
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const card = e.target.closest('.game-card');
            const id = card.dataset.id;
            const name = card.querySelector('h3').textContent;
            const price = card.querySelector('p:first-of-type').textContent.replace('💰 Цена: ', '');
            const genre = card.querySelector('p:last-of-type')?.textContent.replace('🎮 Жанр: ', '');
            editGame(id, name, price, genre);
        }
        
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.closest('.game-card').dataset.id;
            deleteGame(id);
        }
    });
});