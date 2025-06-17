import { createSlice } from "@reduxjs/toolkit";
import { signUpUser, loginUser } from "../actions/authActions";

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    dob?: string;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface ErrorPayload {
  error: {
    message: string;
  };
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        // Updated to match backend response structure
        state.user = action.payload.user;
        state.token = action.payload.token;
        // Store token in localStorage
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as ErrorPayload)?.error?.message || "Signup failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // Updated to match backend response structure
        state.user = action.payload.user;
        state.token = action.payload.token;
        // Store token in localStorage
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as ErrorPayload)?.error?.message || "Login failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;