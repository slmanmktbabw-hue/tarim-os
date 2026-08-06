// database.js - Mock Database for TARIM OS
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

function getData() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [], posts: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = { getData, saveData };
