export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "Unable to connect to the server. Please check that the backend is running and try again."
    );
  }

  const responseText = await response.text();
  let result = null;

  if (responseText.trim()) {
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
}
