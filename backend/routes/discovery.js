const express = require('express')
const pool = require('../db')
const {
  PAGE_SIZE,
  parseDiscoveryFilters,
  buildDiscoveryQuery,
  formatDiscoveryExperience,
} = require('../services/discoverySearch')

const router = express.Router()

// Public discovery endpoint; only returns experience details, not user records.
router.get('/', async (req, res) => {
  let filters
  try {
    filters = parseDiscoveryFilters(req.query)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }

  try {
    const { sql, values } = buildDiscoveryQuery(filters)
    const result = await pool.query(sql, values)

    return res.json({
      experiences: result.rows.slice(0, PAGE_SIZE).map(formatDiscoveryExperience),
      page: filters.page,
      hasMore: result.rows.length > PAGE_SIZE,
    })
  } catch (error) {
    console.error('Failed to discover experiences:', error.message)
    return res.status(500).json({
      message: 'Unable to load experiences right now. Please try again.',
    })
  }
})

module.exports = router
