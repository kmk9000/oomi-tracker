function PriceSummary({ entries }) {
  if (!entries.length) {
    return null
  }

  const values = entries.map((entry) => entry.price)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const now = Date.now()
  const current =
    entries.find((entry) => {
      const startTime = new Date(entry.startAt).getTime()
      const endTime = new Date(entry.endAt).getTime()
      return startTime <= now && now < endTime
    }) ??
    entries
      .filter((entry) => new Date(entry.startAt).getTime() <= now)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0] ??
    entries[0]

  const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const clientTimeLabel = dateTimeFormatter.format(new Date(now))
//   const currentIntervalLabel = `${timeFormatter.format(new Date(current.startAt))} - ${timeFormatter.format(new Date(current.endAt))}`
const priceClass = current.price < 10 ? 'low-price' : (current.price >= 20 ? 'high-price' : 'normal-price');

  return (
    <section className="summary-grid" aria-label="Price summary">
      <article className="summary-card">
        <h2>Current</h2>
        <p className={priceClass}>
            {current.price.toFixed(2)} c/kWh
        </p>
        <span>{`Client time: ${clientTimeLabel}`}</span>
        {/* <span>{`Active slot: ${currentIntervalLabel}`}</span> */}
      </article>
      <article className="summary-card">
        <h2>Low</h2>
        <p>{low.toFixed(2)} c/kWh</p>
      </article>
      <article className="summary-card">
        <h2>Average</h2>
        <p>{average.toFixed(2)} c/kWh</p>
      </article>
      <article className="summary-card">
        <h2>High</h2>
        <p>{high.toFixed(2)} c/kWh</p>
      </article>
    </section>
  )
}

export default PriceSummary
