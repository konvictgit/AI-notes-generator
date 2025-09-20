const Redis = require('ioredis')
const redis = new Redis(process.env.REDIS_URL)

async function setCache(key, value, ttl = 60*60) {
  await redis.set(key, JSON.stringify(value), 'EX', ttl)
}

async function getCache(key) {
  const v = await redis.get(key)
  if (!v) return null
  try { return JSON.parse(v) } catch { return null }
}

module.exports = { setCache, getCache, redis }
