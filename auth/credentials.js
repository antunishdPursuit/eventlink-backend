const { randomBytes, scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const derive = promisify(scrypt);
const params = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, params);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hex] = (stored || '').split(':');
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = await derive(password, salt, 64, params);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
