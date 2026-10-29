const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const db = require('../db/dbConfig');
const server = app.listen(0, '127.0.0.1');
after(async () => { await new Promise(resolve => server.close(resolve)); await db.$pool.end(); });

test('profile responses distinguish missing users and never serialize database errors', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const original = db.oneOrNone;
  try {
    db.oneOrNone = async () => null;
    let response = await fetch(base + '/users/999999');
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Profile not found.' });
    for (const id of ['invalid', '-1', '2147483648']) {
      response = await fetch(base + '/users/' + id);
      assert.equal(response.status, 404);
    }
    db.oneOrNone = async () => { throw new Error('private database query and metadata'); };
    response = await fetch(base + '/users/1');
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Unable to load profile.' });
    db.oneOrNone = async () => ({ id: 1, username: 'Example' });
    response = await fetch(base + '/users/1');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: 1, username: 'Example' });
  } finally { db.oneOrNone = original; }
});
