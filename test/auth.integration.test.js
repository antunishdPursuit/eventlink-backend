const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const db = require('../db/dbConfig');
const server = app.listen(0, '127.0.0.1');
after(async () => { await new Promise(resolve => server.close(resolve)); db.$pool.end(); });

test('local account protects profile and event mutations', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const origin = 'http://127.0.0.1:3225';
  const headers = { 'Content-Type': 'application/json', Origin: origin };
  const username = `test-${Date.now()}`;
  const updatedUsername = `${username}-updated`;
  const password = 'test-only-password-123';
  let userId;
  try {
    let response = await fetch(`${base}/users/1/events`, { method: 'POST', headers, body: '{}' });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/auth/register`, { method: 'POST', headers, body: JSON.stringify({ username, password, profile_picture: 'https://example.com/photo.jpg', bio: 'Test', looking_for_group: false, date_created: '2026-01-01' }) });
    assert.equal(response.status, 201);
    userId = (await response.json()).userId;
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    const stored = await db.one('SELECT password_hash FROM local_credentials WHERE user_id=$1', [userId]);
    assert.notEqual(stored.password_hash, password);
    assert.doesNotMatch(stored.password_hash, /test-only-password/);
    const authHeaders = { ...headers, Cookie: cookie.split(';')[0] };
    response = await fetch(`${base}/users/1/events`, { method: 'POST', headers: authHeaders, body: '{}' });
    assert.equal(response.status, 403);
    response = await fetch(`${base}/users/${userId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie.split(';')[0] }, body: '{}' });
    assert.equal(response.status, 403);
    response = await fetch(`${base}/users/${userId}/events`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ artist: 'Test event', venue: 'Test venue', city: 'Test city', artist_picture: '', price: null }) });
    assert.equal(response.status, 201);
    response = await fetch(`${base}/users/${userId}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ username: updatedUsername, profile_picture: 'https://example.com/photo.jpg', bio: 'Test', looking_for_group: false, date_created: '2026-01-01' }) });
    assert.equal(response.status, 200);
    response = await fetch(`${base}/auth/logout`, { method: 'POST', headers: authHeaders });
    assert.equal(response.status, 200);
    response = await fetch(`${base}/users/${userId}/events`, { method: 'POST', headers: authHeaders, body: '{}' });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ username: updatedUsername, password: 'incorrect-password' }) });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ username: updatedUsername, password }) });
    assert.equal(response.status, 200);
  } finally {
    if (userId) await db.none('DELETE FROM users WHERE id=$1', [userId]);
  }
});
