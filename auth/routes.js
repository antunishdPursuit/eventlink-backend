const express = require('express');
const db = require('../db/dbConfig');
const { hashPassword, verifyPassword } = require('./credentials');
const { randomBytes } = require('crypto');
const auth = express.Router();
const attempts = new Map();
const dummyHash = hashPassword(randomBytes(32).toString('hex'));
let schemaReady;

function ensureSchema() {
  if (!schemaReady) schemaReady = db.none(`CREATE TABLE IF NOT EXISTS local_credentials (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    login_name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`).catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}

function regenerate(req) {
  return new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
}

auth.get('/session', (req, res) => res.json({ userId: req.session.userId || null }));

auth.post('/register', async (req, res) => {
  const { username, password, profile_picture, bio, looking_for_group, date_created } = req.body;
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 80 ||
      typeof password !== 'string' || password.length < 12 || password.length > 256 ||
      typeof profile_picture !== 'string' || typeof bio !== 'string' ||
      typeof looking_for_group !== 'boolean') {
    return res.status(400).json({ error: 'Check the profile fields and use a password of at least 12 characters.' });
  }
  try {
    await ensureSchema();
    const passwordHash = await hashPassword(password);
    const user = await db.tx(async tx => {
      const created = await tx.one('INSERT INTO users (profile_picture, username, bio, looking_for_group, date_created) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [profile_picture, username.trim(), bio, looking_for_group, date_created || null]);
      await tx.none('INSERT INTO local_credentials (user_id, login_name, password_hash) VALUES ($1,$2,$3)',
        [created.id, username.trim().toLowerCase(), passwordHash]);
      return created;
    });
    await regenerate(req);
    req.session.userId = user.id;
    req.session.save(error => error ? res.status(500).json({ error: 'Unable to sign in' }) : res.status(201).json({ userId: user.id }));
  } catch (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'That username is unavailable.' : 'Unable to create profile.' });
  }
});

auth.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 256) return res.status(400).json({ error: 'Invalid sign-in.' });
  const address = req.ip;
  const now = Date.now();
  const recent = (attempts.get(address) || []).filter(time => now - time < 15 * 60 * 1000);
  if (recent.length >= 10) return res.status(429).json({ error: 'Try again later.' });
  recent.push(now);
  attempts.set(address, recent);
  try {
    await ensureSchema();
    const record = await db.oneOrNone('SELECT user_id, password_hash FROM local_credentials WHERE login_name=$1', [username.trim().toLowerCase()]);
    const valid = await verifyPassword(password, record ? record.password_hash : await dummyHash);
    if (!record || !valid) return res.status(401).json({ error: 'Invalid sign-in.' });
    attempts.delete(address);
    await regenerate(req);
    req.session.userId = record.user_id;
    req.session.save(error => error ? res.status(500).json({ error: 'Unable to sign in' }) : res.json({ userId: record.user_id }));
  } catch (_) { res.status(500).json({ error: 'Unable to sign in.' }); }
});

auth.post('/logout', (req, res) => req.session.destroy(error => {
  if (error) return res.status(500).json({ error: 'Unable to sign out.' });
  res.clearCookie('eventlink.sid', { path: '/' });
  res.json({ ok: true });
}));

module.exports = auth;
