// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Дозволяємо парсити x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Віддаємо статику (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для збереження логіну/пароля
app.post('/save_login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send("Немає даних для збереження.");
    }

    const line = `${new Date().toISOString()} - ${username} : ${password}\n`;
    fs.appendFile('logins.txt', line, err => {
        if (err) {
            console.error(err);
            return res.send("Помилка при збереженні.");
        }
        res.send("Дані збережено на сервері!");
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
