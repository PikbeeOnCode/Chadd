import { api } from "../../App/api";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // REGISTER
    register: builder.mutation({
      query: (userData) => ({
        url: "/users/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    // LOGIN
    login: builder.mutation({
      query: (userData) => ({
        url: "/users/login",
        method: "POST",
        body: userData,
      }),
    }),

    // LOGOUT
    logout: builder.mutation({
      query: () => ({
        url: "/users/logout",
        method: "POST",
      }),
    }),

    // REFRESH ACCESS TOKEN
    refresh: builder.mutation({
      query: () => ({
        url: "/users/refresh",
        method: "POST",
      }),
    }),

    // GET CURRENT USER
    getProfile: builder.query({
      query: () => ({
        url: "/users/profile",
        method: "GET",
      }),
    }),

    // UPDATE PROFILE
    updateProfile: builder.mutation({
      query: (userData) => ({
        url: "/users/profile",
        method: "PATCH",
        body: userData,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;