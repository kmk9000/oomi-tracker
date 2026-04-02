const UPSTREAM_URL = 'https://api.porssisahko.net/v1/latest-prices.json'

export async function handler() {
  try {
    const response = await fetch(UPSTREAM_URL)

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          error: 'Failed to fetch latest prices from upstream API.',
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
