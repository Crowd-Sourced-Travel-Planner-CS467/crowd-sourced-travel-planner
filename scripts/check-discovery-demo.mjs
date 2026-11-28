// Read-only check of actual experiences returned by the local backend API.
// No DATABASE_URL, token, email address, or other secret is printed.
const url = process.env.DEMO_API_URL || 'http://127.0.0.1:3000/api/experiences'
const clean = value => String(value ?? '').replace(/\s+/g, ' ').slice(0, 110)

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data.experiences)) throw new Error('API response is missing experiences[]')

  console.log(`Database-backed experiences visible on first page: ${data.experiences.length}`)
  if (data.experiences.length === 0) {
    console.log('No user-submitted experiences found. Before recording, sign in and create experiences through the app.')
    console.log('Do not claim the sampleExperiences.js fixture is live database content.')
  } else {
    for (const [index, item] of data.experiences.slice(0, 5).entries()) {
      const rating = item.average_rating == null ? 'unrated' : `${item.average_rating}/5`
      console.log(`${index + 1}. ${clean(item.title)} | ${clean(item.address)} | ${rating}`)
      if (Array.isArray(item.keywords) && item.keywords.length) {
        console.log(`   Searchable keyword: ${clean(item.keywords[0])}`)
      }
    }
    console.log('Use the listed address and keyword values in your recorded filtering demonstration.')
  }
  console.log(`Additional results page available: ${Boolean(data.hasMore)}`)
} catch (error) {
  console.error(`Discovery API is not ready: ${error.message}`)
  process.exitCode = 1
}
