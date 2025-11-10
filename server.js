// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Порт (Render / інші платформи ставлять свій PORT)
const PORT = process.env.PORT || 3000;

// Секрет для доступу до логів. Встанови у налаштуваннях Render/середовищі:
// ADMIN_KEY=show81212
const ADMIN_KEY = process.env.ADMIN_KEY || 'show81212'; // ЗМІНИ на свій секрет і НЕ коміть його в гіт!

// Парсинг форм
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Роздавати статичні файли з кореня (index.html має лежати поруч із server.js)
app.use(express.static(__dirname));

// Головна сторінка
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/*
  Адмін-форма (ввід секретного логіну)
  - GET /admin  -> показує форму
  - POST /view_logins -> обробляє пароль і повертає logins.txt якщо пароль вірний
*/

// Проста форма для вводу секрету
app.get('/admin', (req, res) => {
  const html = `<!doctype html>
  <html>
  <head><meta charset="utf-8"><title>Admin — view logins</title></head>
  <body style="font-family:Arial,sans-serif;max-width:800px;margin:40px auto;">
    <h2>Admin: введи секретний логін</h2>
    <form method="POST" action="/view_logins">
      <label>Секрет: <input name="key" type="password" autofocus></label>
      <button type="submit">Показати логіни</button>
    </form>
    <p style="color:#666;font-size:13px">Порада: краще встановити секрет у змінній оточення ADMIN_KEY, а не використовувати дефолт.</p>
  </body>
  </html>`;
  res.type('html').send(html);
});

// Маршрут показу логінів (POST з форми). Можна також дозволити GET з query param (?key=...)
app.post('/view_logins', (req, res) => {
  const key = (req.body.key || req.query.key || '').toString();

  if (!key || key !== ADMIN_KEY) {
    // маленька затримка щоб ускладнити грубу силу
    setTimeout(() => {
      res.status(403).type('text/plain').send('Access denied');
    }, 500);
    return;
  }

  const filePath = path.join(__dirname, 'logins.txt');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // Якщо нема файлу — повідомимо
      if (err.code === 'ENOENT') {
        return res.type('text/plain').send('Файл logins.txt не знайдено.');
      }
      console.error(err);
      return res.status(500).type('text/plain').send('Помилка при читанні файлу.');
    }

    // Віддаємо як plain text — зручно для копіювання/збереження
    res.type('text/plain').send(data);
  });
});

// Додатково: дозволити GET /view_logins?key=... (іноді зручніше)
app.get('/view_logins', (req, res) => {
  const key = (req.query.key || '').toString();
  if (!key || key !== ADMIN_KEY) {
    return res.status(403).type('text/plain').send('Access denied');
  }
  const filePath = path.join(__dirname, 'logins.txt');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.type('text/plain').send('Файл logins.txt не знайдено.');
      }
      console.error(err);
      return res.status(500).type('text/plain').send('Помилка при читанні файлу.');
    }
    res.type('text/plain').send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
