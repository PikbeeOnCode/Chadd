
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// This path assumes VITE_BASE_URL already includes /api/v1.
// Change it to match the actual route where refreshTokenUser is registered.
const REFRESH_URL = "/users/refresh-token";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    credentials: "include",
});

// Prevent several simultaneous 401 responses from rotating the refresh
// token multiple times. Requests share the same refresh operation.
let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
    // Send the original request first.
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
        return result;
    }

    // Start a refresh request, or wait for an existing one.
    if (!refreshPromise) {
        refreshPromise = rawBaseQuery(
            {
                url: REFRESH_URL,
                method: "POST",
            },
            api,
            extraOptions
        )
            .then((refreshResult) => !refreshResult.error)
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
    }

    const refreshed = await refreshPromise;

    // Retry the original request only after refresh succeeds.
    if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
    }

    // If refresh fails, return the original request's error.
    return result;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    endpoints: () => ({}),
});
