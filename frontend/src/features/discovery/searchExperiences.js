// Keep search logic independent of React so it can later use API results.
const normalized = (value) => String(value ?? '').trim().toLowerCase()

export function searchExperiences(items, filters = {}) {
  if (!Array.isArray(items)) throw new TypeError('Experiences must be an array')

  const destination = normalized(filters.destination)
  const keyword = normalized(filters.keyword)
  const minimumRating = Number(filters.minimumRating ?? 0)
  const sort = filters.sort ?? 'rating'

  if (!Number.isFinite(minimumRating) || minimumRating < 0 || minimumRating > 5) {
    throw new RangeError('Minimum rating must be between 0 and 5')
  }
  if (!['rating', 'title'].includes(sort)) {
    throw new RangeError('Unknown sort option')
  }

  return items
    .filter((item) => {
      const searchable = [item.title, item.description, ...(item.tags ?? [])]
        .map(normalized)
        .join(' ')
      return normalized(item.destination).includes(destination)
        && searchable.includes(keyword)
        && Number(item.rating) >= minimumRating
        && Number.isFinite(Number(item.rating))
    })
    .sort((a, b) => sort === 'title'
      ? a.title.localeCompare(b.title)
      : Number(b.rating) - Number(a.rating) || a.title.localeCompare(b.title))
}
