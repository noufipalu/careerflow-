import { API_URL, apiRequest } from './apiClient';

export async function getApplications(
  page = 1,
  limit = 10,
  search = '',
  status = 'All',
  sortBy = '',
  order = 'asc',
  signal
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (status !== 'All') {
    params.set('status', status)
  }

  if (sortBy) {
    params.set('sortBy', sortBy)
    params.set('order', order)
  }

  const result = await apiRequest(
    `${API_URL}/applications?${params.toString()}`,
    { signal }
  )

  if (!result || !Array.isArray(result.data)) {
    throw new Error(
      'Invalid response received from the server.'
    )
  }

  const hasInvalidApplication = result.data.some(
    (application) =>
      !application ||
      typeof application.company !== 'string' ||
      typeof application.position !== 'string'
  )

  if (hasInvalidApplication) {
    throw new Error(
      'The server returned an application with invalid data.'
    )
  }

  if (
    !result.pagination ||
    typeof result.pagination !== 'object' ||
    !result.statistics ||
    typeof result.statistics !== 'object'
  ) {
    throw new Error(
      'The server returned invalid pagination or statistics data.'
    )
  }

  return {
    data: result.data.map((application) => ({
      ...application,
      id: application._id,
    })),
    pagination: result.pagination,
    statistics: result.statistics,
  }
}

export async function createApplication(application) {
  const result = await apiRequest(`${API_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(application),
  });

  return {
    ...result,
    id: result._id,
  };
}

export async function updateApplication(id, updates) {
  const result = await apiRequest(`${API_URL}/applications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return {
    ...result,
    id: result._id,
  };
}

export async function deleteApplication(id) {
  return await apiRequest(`${API_URL}/applications/${id}`, {
    method: "DELETE",
  });
}