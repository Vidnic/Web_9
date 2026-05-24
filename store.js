const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

function readData() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getAllItems() {
    const data = readData();
    return data.items;
}

function getItemById(id) {
    const items = getAllItems();
    return items.find(item => item.id === id);
}

function addItem(itemData) {
    const items = getAllItems();
    const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0;
    const newItem = { id: maxId + 1, ...itemData };
    items.push(newItem);
    writeData({ items: items });
    return newItem;
}

function updateItem(id, itemData) {
    const items = getAllItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...itemData, id: items[index].id };
    writeData({ items: items });
    return items[index];
}

function deleteItem(id) {
    const items = getAllItems();
    const newItems = items.filter(item => item.id !== id);
    writeData({ items: newItems });
    return true;
}

module.exports = { getAllItems, getItemById, addItem, updateItem, deleteItem };