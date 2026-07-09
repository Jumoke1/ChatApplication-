import axios from "axios";

//  Use environment variable for base URL ─
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create axios instance with config
const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
});

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

//  Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('No token found for request:', config.url);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor 
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response, config } = error;
        const currentPath = window.location.pathname;

        console.log('API Error:', {
            url: config?.url,
            status: response?.status,
            path: currentPath,
            isRedirecting
        });

        if (isRedirecting) {
            return Promise.reject(error);
        }

        // Handle authentication errors (401, 403)
        if ((response?.status === 401 || response?.status === 403) &&
            currentPath !== '/login' &&
            currentPath !== '/register') {

            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Token already cleared, no need to redirect again');
                return Promise.reject(error);
            }

            isRedirecting = true;
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            console.log('Redirecting to login...');
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }, 100);

            return Promise.reject(error);
        }

        // Handle 400 with invalid token message
        if (response?.status === 400 &&
            response?.data?.message &&
            response.data.message.includes('token')) {

            if (currentPath !== '/login' && currentPath !== '/register' && !isRedirecting) {
                isRedirecting = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }, 100);
            }
        }

        return Promise.reject(error);
    }
);

//  Reset redirect flag
if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
        isRedirecting = false;
    });

    const resetRedirectFlag = () => {
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register') {
            isRedirecting = false;
        }
    };

    window.addEventListener('popstate', resetRedirectFlag);
    resetRedirectFlag();
}

// Helper API modules
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const messageAPI = {
    sendMessage: (roomId, messageData) => api.post(`/messages/${roomId}`, messageData),
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getOnlineUsers: () => api.get('/users/online'),
};

export const dmAPI = {
    getMessages: (dmRoomId) => api.get(`/dmmessages/${dmRoomId}`),
    sendMessage: (dmRoomId, content) => api.post(`/dmmessages/${dmRoomId}`, { content }),
    getCount: (dmRoomId) => api.get(`/dmmessages/count/${dmRoomId}`),
    getUnreadCount: () => api.get('/dmmessages/unread/count'),
    getUnreadDetails: () => api.get('/dmmessages/unread/details'),
    markAsRead: (dmRoomId) => api.post(`/dmmessages/${dmRoomId}/read`),
    markAllAsRead: () => api.post('/dmmessages/read-all'),
};

export const channelAPI = {
    getMessages: (channelId) => api.get(`/messages/${channelId}`),
    sendMessage: (channelId, content) => api.post(`/messages/${channelId}`, { content }),
    getCount: (channelId) => api.get(`/messages/count/${channelId}`),
    getUnreadCount: () => api.get('/messages/unread/count'),
    getUnreadDetails: () => api.get('/messages/unread/details'),
    markAsRead: (channelId) => api.post(`/messages/${channelId}/read`),
    markAllAsRead: () => api.post('/messages/read-all'),
};

export default api;