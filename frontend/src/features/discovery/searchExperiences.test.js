import test from 'node:test'
import assert from 'node:assert/strict'
import { searchExperiences } from './searchExperiences.js'
import { sampleExperiences } from './sampleExperiences.js'

const find = (filters) => searchExperiences(sampleExperiences, filters)

test('returns all experiences with empty filters', () => {
  assert.equal(find({}).length, 5)
})

test('finds destinations without regard to case', () => {
  assert.equal(find({ destination: 'kYoTo' }).length, 3)
})

test('searches title and description', () => {
  assert.equal(find({ keyword: 'architecture' })[0].id, 4)
})

test('searches tags', () => {
  assert.equal(find({ keyword: 'cycling' })[0].id, 3)
})

test('combines destination, keyword and minimum rating', () => {
  assert.deepEqual(find({ destination: 'Kyoto', keyword: 'walking',
    minimumRating: 4.5 }).map((item) => item.id), [1, 2])
})

test('returns no experiences when no matches exist', () => {
  assert.deepEqual(find({ destination: 'Atlantis' }), [])
})

test('sorts results alphabetically', () => {
  assert.equal(find({ sort: 'title' })[0].title, 'Architecture Boat Tour')
})

test('does not change the input array order', () => {
  const before = sampleExperiences.map((item) => item.id)
  find({ sort: 'title' })
  assert.deepEqual(sampleExperiences.map((item) => item.id), before)
})

test('rejects invalid ratings and sort options', () => {
  assert.throws(() => find({ minimumRating: 6 }), RangeError)
  assert.throws(() => find({ sort: 'unknown' }), RangeError)
})
