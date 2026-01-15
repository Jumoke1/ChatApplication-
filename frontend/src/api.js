import axios from "axios";

// Create axios instance with config
const api = axios.create({
    baseURL: "http://localhost:5001/api",
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
});

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

// Request interceptor adds token to requests
api.interceptors.request.use(
    (config) => {
        // Get token from local storage
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

// Response interceptor handles errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response, config } = error;
        const currentPath = window.location.pathname;
        
        console.log('API Error:', {
            url: config?.url,
            status: response?.status,
            path: currentPath,
            isRedirecting
        });

        // Prevent multiple redirects
        if (isRedirecting) {
            return Promise.reject(error);
        }

        // Handle authentication errors (401, 403)
        if ((response?.status === 401 || response?.status === 403) && 
            currentPath !== '/login' && 
            currentPath !== '/register') {
            
            console.warn('Authentication error detected. Token might be expired or invalid.');
            
            // Check if token actually exists before clearing
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Token already cleared, no need to redirect again');
                return Promise.reject(error);
            }
            
            // Set flag to prevent multiple redirects
            isRedirecting = true;
            
            // Clear user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            console.log('Redirecting to login...');
            
            // Use setTimeout to allow current operations to complete
            setTimeout(() => {
                // Use navigate if in React context, otherwise window.location
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }, 100);
            
            return Promise.reject(error);
        }
        
        // Handle bad request with invalid token message
        if (response?.status === 400 && 
            response?.data?.message && 
            response.data.message.includes('token')) {
            
            console.warn('Invalid token detected in 400 response');
            
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

// Reset redirect flag on successful navigation
if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
        isRedirecting = false;
    });
    
    // Reset flag when we're on login/register pages
    const resetRedirectFlag = () => {
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register') {
            isRedirecting = false;
        }
    };
    
    window.addEventListener('popstate', resetRedirectFlag);
    resetRedirectFlag(); // Initial check
}

// Helper methods for common requests
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const messageAPI = {
    getMessages: (room) => api.get(`/messages/${room}`),
    sendMessage: (room, messageData) => api.post(`/messages/${room}`, messageData),
    getMessageCount: (room) => api.get(`/messages/count/${room}`),
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getOnlineUsers: () => api.get('/users/online'),
};


export default api;