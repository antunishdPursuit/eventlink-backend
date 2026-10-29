const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const app = require('../app');

const server = app.listen(0, '127.0.0.1');
after(() => server.close());

test('discovery keeps the provider key server-side and validates input', async () => {
  const port = server.address().port;
  delete process.env.TICKETMASTER_API_KEY;
  let response = await fetch(`http://127.0.0.1:${port}/api/events?stateCode=NY`);
  assert.equal(response.status, 503);
  process.env.TICKETMASTER_API_KEY = 'test-only-secret';
  response = await fetch(`http://127.0.0.1:${port}/api/events?stateCode=invalid`);
  assert.equal(response.status, 400);
  const original = axios.get;
  axios.get = async (_url, options) => {
    assert.equal(options.params.apikey, 'test-only-secret');
    return { data: { _embedded: { events: [{ id: 'example', name: 'Example event' }] } } };
  };
  try {
    response = await fetch(`http://127.0.0.1:${port}/api/events?stateCode=NY&size=3`);
    const body = await response.text();
    assert.equal(response.status, 200);
    assert.match(body, /Example event/);
    assert.doesNotMatch(body, /test-only-secret/);
  } finally {
    axios.get = original;
    delete process.env.TICKETMASTER_API_KEY;
  }
});
