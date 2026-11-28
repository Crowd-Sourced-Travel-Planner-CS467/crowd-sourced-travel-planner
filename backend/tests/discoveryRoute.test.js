// Run: cd backend && node --test tests/discoveryRoute.test.js
const { test, afterEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const pool = require('../db')
const discoveryRoutes = require('../routes/discovery')

async function withServer(fn) {
  const app = express()
  app.use('/api/experiences', discoveryRoutes)
  const server = await new Promise(resolve => {
    const listener = app.listen(0, () => resolve(listener))
  })
  try {
    await fn(`http://127.0.0.1:${server.address().port}/api/experiences`)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}
afterEach(() => mock.restoreAll())

test('GET returns real DB rows, numeric ratings and pagination', async () => {
  mock.method(pool, 'query', async () => ({
    rows: [{
      experience_id: '17', title: 'Walking tour', description: 'Explore the city',
      address: 'Chicago, IL', image_url: null, keywords: ['walking'],
      create_datetime: '2026-11-20', average_rating: '4.50', rating_count: '2',
    }],
  }))
  await withServer(async url => {
    const response = await fetch(url + '?keyword=walking&minimumRating=4')
    const data = await response.json()
    assert.equal(response.status, 200)
    assert.equal(data.experiences.length, 1)
    assert.equal(data.experiences[0].average_rating, 4.5)
    assert.equal(data.experiences[0].rating_count, 2)
    assert.equal(data.hasMore, false)
    assert.equal(data.page, 1)
    assert.match(pool.query.mock.calls[0].arguments[0], /public\.experiences/)
    assert.deepEqual(pool.query.mock.calls[0].arguments[1], ['%walking%', 4, 25, 0])
  })
})

test('GET rejects bad filters without calling the DB', async () => {
  mock.method(pool, 'query', async () => ({ rows: [] }))
  await withServer(async url => {
    const response = await fetch(url + '?page=zero')
    assert.equal(response.status, 400)
    assert.equal(pool.query.mock.calls.length, 0)
  })
})

test('GET returns a safe 500 response when the DB is unavailable', async () => {
  mock.method(pool, 'query', async () => { throw new Error('secret database message') })
  mock.method(console, 'error', () => {})
  await withServer(async url => {
    const response = await fetch(url)
    const data = await response.json()
    assert.equal(response.status, 500)
    assert.ok(!JSON.stringify(data).includes('secret database message'))
  })
})
