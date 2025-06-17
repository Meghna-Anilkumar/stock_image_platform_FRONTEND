import { createAsyncThunk } from "@reduxjs/toolkit";
import { serverInstance } from "@/services";
import { AxiosError } from "axios";
import { userEndPoints } from "@/services/endPoints/endPoints";

interface ISignupInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ILoginInput {
  email?: string;
  phone?: string;
  password: string;
}

// Updated to match backend response structure
interface ResponseData {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  token: string;
  redirectUrl?: string;
}

interface IResetPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const signUpUser = createAsyncThunk<ResponseData, ISignupInput>(
  "user/signup",
  async (userData: ISignupInput, { rejectWithValue }) => {
    console.log('Sending signup request with data:', userData);
    console.log('Endpoint:', userEndPoints.signup);
    try {
      const response = await serverInstance.post<ResponseData>(userEndPoints.signup, userData);
      console.log('Signup response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('Signup request error:', error.message, error.response?.data);
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Signup failed' }
      });
    }
  }
);

export const loginUser = createAsyncThunk<ResponseData, ILoginInput>(
  "user/login",
  async (userData: ILoginInput, { rejectWithValue }) => {
    console.log('Sending login request with data:', userData);
    console.log('Endpoint:', userEndPoints.login);
    try {
      const response = await serverInstance.post<ResponseData>(userEndPoints.login, userData);
      console.log('Login response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('Login request error:', error.message, error.response?.data);
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Login failed' }
      });
    }
  }
);


export const resetPassword = createAsyncThunk<ResponseData, IResetPasswordInput>(
  "user/resetPassword",
  async (passwordData: IResetPasswordInput, { rejectWithValue }) => {
    console.log('Sending reset password request with data:', passwordData);
    console.log('Endpoint:', userEndPoints.resetPassword);
    try {
      const response = await serverInstance.post<ResponseData>(userEndPoints.resetPassword, passwordData);
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('Reset password request error:', error.message, error.response?.data);
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Failed to reset password' }
      });
    }
  }
);