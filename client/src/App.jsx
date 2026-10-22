import { useState } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { useApplications } from './hooks/useApplications'
import { createApplication, updateApplication, deleteApplication } from './services/applicationService.js'
import './App.css'
import ApplicationsTable from './components/ApplicationsTable.jsx'
import ApplicationFilters from './components/ApplicationFilters.jsx'

function StatCard({ title, value }) {
  return (
    <section className="stat-card">
      <h2>{title}</h2>
      <p>{value}</p>
    </section>
  )
}

function App() {

  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const [sortBy, setSortBy] = useState('dateApplied')
  const [order, setOrder] = useState('desc')
  const [newCompany, setNewCompany] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editingApplicationId, setEditingApplicationId] = useState(null)
  const [editCompany, setEditCompany] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editStatus, setEditStatus] = useState('Applied')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const {
    applications,
    pagination,
    statistics,
    isLoading,
    isRefreshing,
    hasLoadedOnce,
    loadError,
  } = useApplications({
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    sortBy,
    order,
    refreshTrigger,
  })

  async function handleAddApplication(event) {
    event.preventDefault()

    const company = newCompany.trim()
    const position = newPosition.trim()

    if (!company || !position) {
      setError('Please enter both company name and job position.')
      return
    }

    try {
      setError('')
      setIsSaving(true)

      await createApplication({
        company,
        position,
        status: 'Applied',
      })

      setNewCompany('')
      setNewPosition('')
      setError('')

      if (currentPage === 1) {
        setRefreshTrigger((previous) => previous + 1)
      } else {
        setCurrentPage(1)
      }
    } catch (err) {
      setError(err.message || 'Unable to create application')
      setNewCompany('')
      setNewPosition('')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditClick(application) {
    setError('')
    setEditingApplicationId(application.id)
    setEditCompany(application.company)
    setEditPosition(application.position)
    setEditStatus(application.status)
  }

  async function handleDeleteApplication(idToDelete) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application? This action cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteApplication(idToDelete)

      if (applications.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        setRefreshTrigger((previous) => previous + 1)
      }
    } catch (err) {
      setError(err.message || 'Unable to delete application')
    }
  }

  async function handleSaveEdit(event) {
    event.preventDefault()

    const company = editCompany.trim()
    const position = editPosition.trim()

    if (!company || !position) {
      setError('Please enter both company name and job position.')
      return
    }

    try {
      setError('')
      setIsSavingEdit(true)

      const updatedApplication = await updateApplication(
        editingApplicationId,
        {
          company,
          position,
          status: editStatus,
        }
      )

      setEditingApplicationId(null)
      setEditCompany('')
      setEditPosition('')
      setEditStatus('Applied')

      setRefreshTrigger((previous) => previous + 1)
    } catch (err) {
      setError(err.message || 'Unable to update application')
    } finally {
      setIsSavingEdit(false)
    }
  }

  function handleSort(field, toggleOrder = false) {
    if (toggleOrder) {
      setOrder((previousOrder) =>
        previousOrder === 'asc' ? 'desc' : 'asc'
      )
    } else {
      setSortBy(field)
      setOrder(field === 'dateApplied' ? 'desc' : 'asc')
    }

    setCurrentPage(1)
  }

  const [error, setError] = useState('')
  const dashboardStatistics = [
    {
      id: 1,
      title: 'Total Applications',
      value: statistics.total,
    },
    {
      id: 2,
      title: 'Applied',
      value: statistics.Applied,
    },
    {
      id: 3,
      title: 'Interviews',
      value: statistics.Interview,
    },
    {
      id: 4,
      title: 'Offers',
      value: statistics.Offer,
    },
  ]

  return (
    <main>
      <h1>Welcome to CareerFlow</h1>
      <p>Your personal job application tracker.</p>

      <form className="add-application-form" onSubmit={handleAddApplication}>
        <h2>Add a Job Application</h2>

        <label htmlFor="new-company">Company Name</label>
        <input
          id="new-company"
          type="text"
          placeholder="e.g. Netflix"
          value={newCompany}
          onChange={(event) => setNewCompany(event.target.value)}
        />

        <label htmlFor="new-position">Job Position</label>
        <input
          id="new-position"
          type="text"
          placeholder="e.g. React Developer"
          value={newPosition}
          onChange={(event) => setNewPosition(event.target.value)}
        />

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add Application'}
        </button>
      </form>

      <div className="statistics-grid">
        {dashboardStatistics.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
          />
        ))}
      </div>

      <ApplicationFilters
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        searchTerm={searchTerm}
        setSearchTerm={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
      />


      {editingApplicationId !== null && (
        <form
          className="edit-application-form"
          onSubmit={handleSaveEdit}
        >
          <h2>Edit Job Application</h2>

          <label htmlFor="edit-company">Company Name</label>
          <input
            id="edit-company"
            value={editCompany}
            onChange={(event) => setEditCompany(event.target.value)}
            required
          />

          <label htmlFor="edit-position">Job Position</label>
          <input
            id="edit-position"
            value={editPosition}
            onChange={(event) => setEditPosition(event.target.value)}
            required
          />

          <label htmlFor="edit-status">Application Status</label>
          <select
            id="edit-status"
            value={editStatus}
            onChange={(event) => {
              setEditStatus(event.target.value)
              setError('')
            }}
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button type="submit" disabled={isSavingEdit}>
            {isSavingEdit ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => {
              setError('')
              setEditingApplicationId(null)
              setEditCompany('')
              setEditPosition('')
              setEditStatus('Applied')
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {isLoading ? (
        <p role="status">Loading applications...</p>

      ) : loadError ? (
        <div className="error-message-container">
          <p className="error-message" role="alert">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => {
              setRefreshTrigger((current) => current + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="error-message" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error message"
              >
                ×
              </button>
            </div>
          )}

          {isRefreshing && (
            <p className="refresh-indicator" role="status">
              Updating applications...
            </p>
          )}

          <ApplicationsTable
            applications={applications}
            pagination={pagination}
            onEdit={handleEditClick}
            onDelete={handleDeleteApplication}
            onSort={handleSort}
            sortBy={sortBy}
            order={order}
          />

          <div className="pagination-controls">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

    </main>
  )
}

export default App
