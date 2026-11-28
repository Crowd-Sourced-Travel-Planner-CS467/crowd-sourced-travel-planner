// Run: cd backend && node --test tests/discovery.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  PAGE_SIZE, parseDiscoveryFilters, buildDiscoveryQuery, formatDiscoveryExperience,
} = require('../services/discoverySearch')

test('defaults to first page and highest-rated sorting', () => {
  assert.deepEqual(parseDiscoveryFilters({}), {
    destination: '', terms: [], minimumRating: 0, sort: 'rating', page: 1,
  })
})

test('supports combined destination, word-based keywords and rating filters', () => {
  const filters = parseDiscoveryFilters({
    destination: 'San Francisco', keyword: 'food walking', minimumRating: '4.5', sort: 'title', page: '2',
  })
  assert.deepEqual(filters.terms, ['food', 'walking'])
  const { sql, values } = buildDiscoveryQuery(filters)
  assert.match(sql, /e\.address ILIKE/)
  assert.match(sql, /unnest\(e\.keywords\)/)
  assert.match(sql, /average_rating >=/)
  assert.match(sql, /ORDER BY title ASC/)
  assert.deepEqual(values, ['%San Francisco%', '%food%', '%walking%', 4.5, PAGE_SIZE + 1, PAGE_SIZE])
  assert.equal((sql.match(/EXISTS/g) || []).length, 2)
})

test('escapes SQL LIKE metacharacters and does not interpolate user input', () => {
  const { sql, values } = buildDiscoveryQuery(parseDiscoveryFilters({ keyword: 'test%_!' }))
  assert.ok(!sql.includes('test%_!'))
  assert.equal(values[0], '%test!%!_!!%')
  assert.match(sql, /ESCAPE '!'/)
})

test('does not allow injection into sort, rating or page', () => {
  for (const query of [
    { sort: 'rating; DROP TABLE experiences' },
    { minimumRating: '-1' },
    { minimumRating: 'NaN' },
    { page: '1 OR 1=1' },
    { page: '0' },
    { page: '1001' },
    { keyword: ['test', 'other'] },
  ]) {
    assert.throws(() => parseDiscoveryFilters(query), RangeError)
  }
})

test('allows unrated experiences when no rating filter is selected', () => {
  const { sql } = buildDiscoveryQuery(parseDiscoveryFilters({}))
  assert.match(sql, /LEFT JOIN public\.ratings/)
  assert.doesNotMatch(sql, /WHERE average_rating >=/)
  assert.match(sql, /DESC NULLS LAST/)
})

test('transforms database records to safe API shape', () => {
  assert.deepEqual(formatDiscoveryExperience({
    experience_id: '7', title: 'Tour', description: null, address: 'Chicago',
    image_url: null, keywords: ['walking'], create_datetime: '2026-11-01',
    average_rating: '4.50', rating_count: '2', user_id: '12345',
  }), {
    experience_id: '7', title: 'Tour', description: '', address: 'Chicago',
    image_url: null, keywords: ['walking'], create_datetime: '2026-11-01',
    average_rating: 4.5, rating_count: 2,
  })
})

test('limits page size and uses stable deterministic sorting', () => {
  const { sql, values } = buildDiscoveryQuery(parseDiscoveryFilters({ page: '3' }))
  assert.equal(values.at(-2), PAGE_SIZE + 1)
  assert.equal(values.at(-1), PAGE_SIZE * 2)
  assert.match(sql, /experience_id DESC/)
})
