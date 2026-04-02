import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 24

function PriceTable({ entries, periodLabel }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [entries, periodLabel])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const visibleEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return entries.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, entries])

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

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
            {visibleEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.label}</td>
                <td>{entry.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length > PAGE_SIZE && (
        <div className="table-pagination" aria-label="Table pagination">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="period-button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={!canGoPrevious}
            >
              Previous
            </button>
            <button
              type="button"
              className="period-button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default PriceTable
