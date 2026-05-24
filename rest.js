const store = require('./store');

function getItems(req, res) {
    res.json(store.getAllItems());
}

function getItemById(req, res) {
    const id = parseInt(req.params.id);
    const item = store.getItemById(id);
    if (item) {
        res.json(item);
    } else {
        res.status(404).json({ error: 'not found' });
    }
}

function addItem(req, res) {
    const newItem = store.addItem(req.body);
    res.status(201).json(newItem);
}

function updateItem(req, res) {
    const id = parseInt(req.params.id);
    const updated = store.updateItem(id, req.body);
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: 'not found' });
    }
}

function deleteItem(req, res) {
    const id = parseInt(req.params.id);
    store.deleteItem(id);
    res.status(204).send();
}

function getAllItems() {
    const store = require('./store');
    return store.getAllItems();
}

module.exports = { getItems, getItemById, addItem, updateItem, deleteItem, getAllItems };