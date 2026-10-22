
function ApplicationsTable({
    applications,
    pagination,
    onEdit,
    onDelete,
    onSort = () => {},
    sortBy = 'dateApplied',
    order = 'desc',
}) {
    function formatDate(date) {
        if (!date) return '—'

        const parsedDate = new Date(date)

        if (Number.isNaN(parsedDate.getTime())) {
            return '—'
        }

        return parsedDate.toLocaleDateString()
    }

    return (
        <section className="applications-section">
            <div className="applications-header">
                <h2>Recent Applications</h2>

                <div className="sort-controls">
                    <label htmlFor="application-sort">Sort by</label>

                    <select
                        id="application-sort"
                        value={sortBy}
                        onChange={(event) => onSort(event.target.value)}
                    >
                        <option value="company">Company</option>
                        <option value="position">Position</option>
                        <option value="status">Status</option>
                        <option value="dateApplied">Date Applied</option>
                    </select>

                    <button
                        type="button"
                        className="sort-order-button"
                        onClick={() => onSort(sortBy, true)}
                        aria-label={
                            order === 'asc'
                                ? 'Sort descending'
                                : 'Sort ascending'
                        }
                        title={
                            order === 'asc'
                                ? 'Sort descending'
                                : 'Sort ascending'
                        }
                    >
                        {order === 'asc' ? '↑ Ascending' : '↓ Descending'}
                    </button>
                </div>
            </div>

            <p className="application-count">
                {pagination.total === 0
                    ? '0 applications found'
                    : `Showing ${
                        (pagination.page - 1) * pagination.limit + 1
                    }–${
                        (pagination.page - 1) * pagination.limit +
                        applications.length
                    } of ${pagination.total} applications`}
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Position</th>
                        <th>Status</th>
                        <th>Date Applied</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {applications.length > 0 ? (
                        applications.map((application) => (
                            <tr key={application.id}>
                                <td>{application.company}</td>
                                <td>{application.position}</td>
                                <td>
                                    <span
                                        className={`status-badge status-${application.status.toLowerCase()}`}
                                    >
                                        {application.status}
                                    </span>
                                </td>
                                <td>{formatDate(application.dateApplied)}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(application)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onDelete(application.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5}>No applications found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    )
}

export default ApplicationsTable
