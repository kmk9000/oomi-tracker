function PriceTable({ entries, periodLabel }) {
  return (
    <section className="table-card" aria-label="Price table">
      <h2>{periodLabel} Hourly Prices</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Price (c/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.label}</td>
                <td>{entry.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PriceTable
