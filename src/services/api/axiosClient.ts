import axios from 'axios';
import { env } from '../../app/config/env';
import { ApiError } from './apiError';

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error?.response?.data;
    const message = responseData?.detail
      ?? responseData?.message
      ?? responseData?.title
      ?? error.message
      ?? 'Request failed';
    return Promise.reject(new ApiError(message, error?.response?.status ?? 500));
  }
);
