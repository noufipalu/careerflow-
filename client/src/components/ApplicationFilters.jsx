
function ApplicationFilters({
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
}) {
    return (
        <section className="application-filters">
            <label htmlFor="status-filter">
                Filter by status:
            </label>


            <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
            >
                <option value="All">All</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
            </select>


            <label htmlFor="application-search">
                Search applications:
            </label>

            <input
                id="application-search"
                type="text"
                placeholder="Search company or position..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
            />
        </section>
    )
}

export default ApplicationFilters
