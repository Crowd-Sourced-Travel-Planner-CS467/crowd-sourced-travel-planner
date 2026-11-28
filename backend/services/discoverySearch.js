// Build a parameterized discovery query; no user input is interpolated as SQL.
const PAGE_SIZE = 24

function optionalText(value, label) {
  if (value === undefined) return ''
  if (typeof value !== 'string' || value.length > 120) {
    throw new RangeError(`${label} must be 120 characters or fewer.`)
  }
  return value.trim()
}

function parseDiscoveryFilters(query = {}) {
  const destination = optionalText(query.destination, 'Destination')
  const keyword = optionalText(query.keyword, 'Keyword')
  const ratingInput = optionalText(query.minimumRating, 'Minimum rating')
  const minimumRating = ratingInput === '' ? 0 : Number(ratingInput)
  const sort = query.sort === undefined ? 'rating' : optionalText(query.sort, 'Sort')
  const pageInput = query.page === undefined ? '1' : optionalText(query.page, 'Page')
  const page = Number(pageInput)

  if (!Number.isFinite(minimumRating) || minimumRating < 0 || minimumRating > 5) {
    throw new RangeError('Minimum rating must be between 0 and 5.')
  }
  if (!['rating', 'title'].includes(sort)) {
    throw new RangeError('Unknown sort option.')
  }
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) {
    throw new RangeError('Page must be an integer between 1 and 1000.')
  }
  const terms = keyword.split(/\s+/).filter(Boolean)
  if (terms.length > 10) throw new RangeError('Search supports at most 10 words.')

  return { destination, terms, minimumRating, sort, page }
}

// Escape LIKE wildcards so search input is treated as text, not a pattern.
const pattern = (text) => `%${text.replace(/!/g, '!!').replace(/%/g, '!%').replace(/_/g, '!_')}%`

function buildDiscoveryQuery(filters) {
  const values = []
  const bind = (value) => {
    values.push(value)
    return `$${values.length}`
  }
  const where = []

  if (filters.destination) {
    const p = bind(pattern(filters.destination))
    where.push(`e.address ILIKE ${p} ESCAPE '!'`)
  }

  // Every word must appear in at least one searchable field.
  for (const term of filters.terms) {
    const p = bind(pattern(term))
    where.push(`(
      e.title ILIKE ${p} ESCAPE '!'
      OR COALESCE(e.description, '') ILIKE ${p} ESCAPE '!'
      OR e.address ILIKE ${p} ESCAPE '!'
      OR EXISTS (
        SELECT 1 FROM unnest(e.keywords) AS tag(keyword)
        WHERE tag.keyword ILIKE ${p} ESCAPE '!'
      )
    )`)
  }

  const ratingClause = filters.minimumRating > 0
    ? `WHERE average_rating >= ${bind(filters.minimumRating)}`
    : ''

  const order = filters.sort === 'title'
    ? 'title ASC, experience_id DESC'
    : 'average_rating DESC NULLS LAST, title ASC, experience_id DESC'

  const limit = bind(PAGE_SIZE + 1)
  const offset = bind((filters.page - 1) * PAGE_SIZE)

  const sql = `
    WITH rated_experiences AS (
      SELECT e.experience_id, e.title, e.description, e.address,
             e.image_url, e.keywords, e.create_datetime,
             ROUND(AVG(r.rating)::numeric, 2) AS average_rating,
             COUNT(r.rating)::int AS rating_count
      FROM public.experiences e
      LEFT JOIN public.ratings r ON r.experience_id = e.experience_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY e.experience_id
    )
    SELECT * FROM rated_experiences
    ${ratingClause}
    ORDER BY ${order}
    LIMIT ${limit} OFFSET ${offset}
  `

  return { sql, values }
}

function formatDiscoveryExperience(row) {
  return {
    experience_id: row.experience_id,
    title: row.title,
    description: row.description || '',
    address: row.address,
    image_url: row.image_url || null,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    create_datetime: row.create_datetime,
    average_rating: row.average_rating === null ? null : Number(row.average_rating),
    rating_count: Number(row.rating_count),
  }
}

module.exports = {
  PAGE_SIZE,
  parseDiscoveryFilters,
  buildDiscoveryQuery,
  formatDiscoveryExperience,
}
