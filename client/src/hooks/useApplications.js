import { useEffect, useState } from 'react'
import { getApplications } from '../services/applicationService'

export function useApplications({
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    sortBy,
    order,
    refreshTrigger,
}) {
    const [applications, setApplications] = useState([])
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    })
    const [statistics, setStatistics] = useState({
        total: 0,
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0,
    })

    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        let isActive = true
        const controller = new AbortController()

        async function loadApplications() {
            try {
                if (!hasLoadedOnce) {
                    setIsLoading(true)
                } else {
                    setIsRefreshing(true)
                }

                setLoadError('')

                const result = await getApplications(
                    currentPage,
                    10,
                    debouncedSearchTerm,
                    statusFilter,
                    sortBy,
                    order,
                    controller.signal
                )

                if (!isActive) return

                setApplications(result.data)
                setPagination(result.pagination)
                setStatistics(result.statistics)
            } catch (err) {
                if (!isActive || err.name === 'AbortError') return

                console.error('Failed to load applications:', err)

                setLoadError(
                    err.message || 'Unable to load applications'
                )
            } finally {
                if (isActive) {
                    setIsLoading(false)
                    setIsRefreshing(false)
                    setHasLoadedOnce(true)
                }
            }
        }

        loadApplications()


        return () => {
            isActive = false
            controller.abort()
        }
    }, [
        currentPage,
        debouncedSearchTerm,
        statusFilter,
        sortBy,
        order,
        refreshTrigger,
    ])

    return {
        applications,
        pagination,
        statistics,
        isLoading,
        isRefreshing,
        hasLoadedOnce,
        loadError,
    }

}
