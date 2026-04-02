import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatTimestampToTime(timestamp) {
  return new Date(Number(timestamp)).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimestampForTooltip(timestamp) {
  return new Date(Number(timestamp)).toLocaleString([], {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDotColor(price) {
  if (price < 10) {
    return '#22c55e'
  }

  if (price <= 15) {
    return '#eab308'
  }

  return '#ef4444'
}

function PriceChart({ entries }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [])

  const chartData = useMemo(() => {
    return entries
      .map((entry) => ({
        ...entry,
        xTime: new Date(entry.startAt).getTime(),
      }))
      .sort((a, b) => a.xTime - b.xTime)
  }, [entries])

  const nowMarkerX = useMemo(() => now, [now])

  const activePoint = useMemo(() => {
    if (!chartData.length) {
      return null
    }

    const inRange = chartData.find((entry) => {
      const startTime = new Date(entry.startAt).getTime()
      const endTime = new Date(entry.endAt).getTime()
      return startTime <= now && now < endTime
    })

    if (inRange) {
      return inRange
    }

    return chartData.reduce((closest, entry) => {
      const closestDistance = Math.abs(closest.xTime - nowMarkerX)
      const entryDistance = Math.abs(entry.xTime - nowMarkerX)
      return entryDistance < closestDistance ? entry : closest
    }, chartData[0])
  }, [chartData, now, nowMarkerX])

  return (
    <section className="chart-card" aria-label="Price chart">
      <h2>Price Trend</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="xTime"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatTimestampToTime(Number(value))}
            />
            <YAxis
              unit=" c/kWh"
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              labelFormatter={(value) =>
                `Time: ${formatTimestampForTooltip(Number(value))}`
              }
              formatter={(value) => `${Number(value).toFixed(2)} c/kWh`}
            />
            {activePoint && (
              <ReferenceDot
                x={activePoint.xTime}
                y={activePoint.price}
                r={6}
                fill={getDotColor(activePoint.price)}
                stroke="#ffffff"
                strokeWidth={2}
                isFront
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke="currentColor"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default PriceChart
