import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const serverInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

const handleSuccess = (response) => {
    return response;
};

const handleError = async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for login, signup, or refresh-token endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/login') || 
                          originalRequest.url?.includes('/signup') || 
                          originalRequest.url?.includes('/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
            // If we're already refreshing, queue this request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                return serverInstance(originalRequest);
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            console.log('🔄 Attempting to refresh token...');
            const refreshResponse = await serverInstance.post('/refresh-token');

            if (refreshResponse.data.success) {
                console.log('✅ Token refresh successful');
                processQueue(null, refreshResponse.data.token);
                isRefreshing = false;
                return serverInstance(originalRequest);
            } else {
                console.error('❌ Refresh failed:', refreshResponse.data.message);
                processQueue(new Error('Token refresh failed'), null);
                isRefreshing = false;
                window.location.href = '/login';
            }
        } catch (refreshError) {
            console.error('❌ Error during refresh:', refreshError);
            processQueue(refreshError, null);
            isRefreshing = false;
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }

    // For login/signup errors or other 401s, let them pass through
    if (error.response?.status === 401 && isAuthEndpoint) {
        return Promise.reject(error);
    }

    if (error.response?.status === 403) {
        if (error.response.data?.logout) {
            console.error('Account blocked. Logging out.');
            window.location.href = '/login';
        } else {
            console.error('You don\'t have permission for this.');
        }
    }

    if (error.response?.status === 500) {
        console.error('Server problem. Try again later.');
    }

    return Promise.reject(error);
};

serverInstance.interceptors.response.use(handleSuccess, handleError);