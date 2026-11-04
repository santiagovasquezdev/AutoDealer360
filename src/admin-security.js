const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, Buffer.from(salt, 'hex'), 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored || '')) return false;
  const [, salt, expected] = stored.split('$');
  const result = await scryptAsync(password, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(result, Buffer.from(expected, 'hex'));
}
const newToken = () => randomBytes(32).toString('hex');
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const safeSame = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
const cookieName = 'ad_session';
function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 12*60*60*1000 };
}
module.exports = { hashPassword, verifyPassword, newToken, tokenHash, safeSame, cookieName, cookieOptions };
