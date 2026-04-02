import { useEffect, useMemo, useRef, useState } from 'react'
import TrackerHeader from './components/TrackerHeader'
import PriceSummary from './components/PriceSummary'
import PriceChart from './components/PriceChart'
import PriceTable from './components/PriceTable'
import './App.css'

const VAT = 1.255
const MARGIN = 0.35
const TRACKING_PERIODS = {
  daily: { label: 'Daily', hours: 24 },
  weekly: { label: 'Weekly', hours: 24 * 7 },
  monthly: { label: 'Monthly', hours: 24 * 30 },
}

const ONE_HOUR_MS = 60 * 60 * 1000

function getBalancedWindow(items, targetCount, now) {
  if (!items.length || targetCount <= 0) {
    return []
  }

  const currentIndex = items.findIndex((entry) => entry.endAtMs > now)
  const anchor = currentIndex === -1 ? items.length : currentIndex
  const halfWindow = Math.floor(targetCount / 2)

  const pastCount = Math.min(anchor, halfWindow)
  const futureCount = Math.min(items.length - anchor, targetCount - halfWindow)

  const missing = targetCount - (pastCount + futureCount)
  const extraPast = Math.min(anchor - pastCount, missing)
  const extraFuture = Math.min(items.length - anchor - futureCount, missing - extraPast)

  const finalPastCount = pastCount + extraPast
  const finalFutureCount = futureCount + extraFuture

  const start = Math.max(0, anchor - finalPastCount)
  const end = Math.min(items.length, anchor + finalFutureCount)

  return items.slice(start, end)
}

function normalizeEntry(item) {
  const hour = new Date(item.startDate).getHours().toString().padStart(2, '0')
  const taxedPrice = (Number(item.price) + MARGIN) * VAT

  return {
    id: `${item.startDate}-${item.endDate}`,
    label: `${hour}:00`,
    price: Number(taxedPrice.toFixed(2)),
    startAt: item.startDate,
    endAt: item.endDate,
    startAtMs: new Date(item.startDate).getTime(),
    endAtMs: new Date(item.endDate).getTime(),
  }
}

function getHourWindowStartMs(totalHours, now) {
  const currentHourStart = new Date(now)
  currentHourStart.setMinutes(0, 0, 0)
  const halfWindow = Math.floor(totalHours / 2)
  return currentHourStart.getTime() - halfWindow * ONE_HOUR_MS
}

function App() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trackingPeriod, setTrackingPeriod] = useState('daily')
  const hourlyCacheRef = useRef(new Map())

  useEffect(() => {
    let isActive = true

    async function fetchDailyEntries() {
      const response = await fetch('/api/v1/latest-prices.json')
      if (!response.ok) {
        throw new Error('Could not fetch electricity prices.')
      }

      const data = await response.json()
      const normalized = (data.prices || [])
        .map(normalizeEntry)
        .sort((a, b) => a.startAtMs - b.startAtMs)

      const windowed = getBalancedWindow(normalized, TRACKING_PERIODS.daily.hours, Date.now())
      return windowed.map(({ startAtMs, endAtMs, ...entry }) => entry)
    }

    async function fetchSingleHourEntry(startAtMs) {
      const date = new Date(startAtMs)
      const dateKey = date.toISOString().slice(0, 10)
      const hour = date.getUTCHours()
      const cacheKey = `${dateKey}-${hour}`

      if (hourlyCacheRef.current.has(cacheKey)) {
        return hourlyCacheRef.current.get(cacheKey)
      }

      const response = await fetch(`/api/v1/price.json?date=${dateKey}&hour=${hour}`)
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      if (typeof data.price !== 'number') {
        return null
      }

      const endAtMs = startAtMs + ONE_HOUR_MS
      const entry = normalizeEntry({
        price: data.price,
        startDate: new Date(startAtMs).toISOString(),
        endDate: new Date(endAtMs).toISOString(),
      })

      hourlyCacheRef.current.set(cacheKey, entry)
      return entry
    }

    async function fetchLongRangeEntries(totalHours) {
      const startMs = getHourWindowStartMs(totalHours, Date.now())
      const timestamps = Array.from({ length: totalHours }, (_, index) => startMs + index * ONE_HOUR_MS)
      const loaded = []

      for (let index = 0; index < timestamps.length; index += 24) {
        const chunk = timestamps.slice(index, index + 24)
        const chunkEntries = await Promise.all(chunk.map((startAtMs) => fetchSingleHourEntry(startAtMs)))
        loaded.push(...chunkEntries.filter(Boolean))
      }

      return loaded
        .sort((a, b) => a.startAtMs - b.startAtMs)
        .map(({ startAtMs, endAtMs, ...entry }) => entry)
    }

    async function loadPrices(showLoader = false) {
      try {
        if (showLoader) {
          setLoading(true)
        }
        setError('')

        const periodHours = TRACKING_PERIODS[trackingPeriod].hours
        const periodEntries =
          trackingPeriod === 'daily'
            ? await fetchDailyEntries()
            : await fetchLongRangeEntries(periodHours)

        if (!isActive) {
          return
        }

        if (!periodEntries.length) {
          throw new Error('No prices available for selected period.')
        }

        setEntries(periodEntries)
      } catch {
        if (isActive) {
          setError('Unable to load electricity prices right now. Please try again.')
        }
      } finally {
        if (showLoader && isActive) {
          setLoading(false)
        }
      }
    }

    loadPrices(true)

    const refreshInterval = window.setInterval(() => {
      loadPrices()
    }, 10 * 60 * 1000)

    return () => {
      isActive = false
      window.clearInterval(refreshInterval)
    }
  }, [trackingPeriod])

  const updatedAt = useMemo(() => {
    if (!entries.length) {
      return ''
    }

    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [entries])

  const activePeriodLabel = TRACKING_PERIODS[trackingPeriod].label

  return (
    <main className="app-shell">
      <TrackerHeader />

      {loading && <p className="status-message">Loading prices...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="period-toggle" role="tablist" aria-label="Tracking period">
            {Object.entries(TRACKING_PERIODS).map(([key, config]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={trackingPeriod === key}
                className={`period-button${trackingPeriod === key ? ' is-active' : ''}`}
                onClick={() => setTrackingPeriod(key)}
              >
                {config.label}
              </button>
            ))}
          </div>
          <p className="status-message">Updated at {updatedAt} (auto-refresh every 10 min)</p>
          <PriceSummary entries={entries} />
          <PriceChart entries={entries} />
          <PriceTable entries={entries} periodLabel={activePeriodLabel} />
        </>
      )}
    </main>
  )
}

export default App
