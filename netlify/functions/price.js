const UPSTREAM_BASE_URL = 'https://api.porssisahko.net/v1/price.json'

export async function handler(event) {
  const { date, hour } = event.queryStringParameters ?? {}

  if (!date || hour == null) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'Missing required query params: date and hour.',
      }),
    }
  }

  const url = new URL(UPSTREAM_BASE_URL)
  url.searchParams.set('date', date)
  url.searchParams.set('hour', String(hour))

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          error: 'Failed to fetch hourly price from upstream API.',
        }),
      }
    }

    const body = await response.text()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
      body,
    }
  } catch {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'Unable to reach upstream price service.',
      }),
    }
  }
}
