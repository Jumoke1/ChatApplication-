import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./socketContext";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );
    const [token, setToken] = useState(
        localStorage.getItem("token") || null
    );
    const [loading, setLoading] = useState(true);
    const { socket, connectSocket } = useSocket();

    //  Verify token on mount 
    useEffect(() => {
        const verifyToken = async () => {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            
            if (storedToken && storedUser) {
                try {
                    // If you want to verify with backend, uncomment:
                    // const response = await api.get('/auth/verify');
                    // if (response.data.valid) {
                    //     setUser(JSON.parse(storedUser));
                    //     setToken(storedToken);
                    //     connectSocket(storedToken);
                    // } else {
                    //     logout();
                    // }
                    
                    // For now, just trust the stored values
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                    connectSocket(storedToken);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    logout(); // will clear and redirect
                }
            }
            setLoading(false);
        };
        
        verifyToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //  Login 
    const login = (userData, jwt) => {
        setUser(userData);
        setToken(jwt);
        
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", jwt);
        
        connectSocket(jwt);
        
        console.log('✅ User logged in:', userData.fullname);
    };

    //  Logout 
    const logout = () => {
        setUser(null);
        setToken(null);
        
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
        if (socket) {
            socket.disconnect();
        }
        
        console.log('👋 User logged out');
        
        //  Redirect to login page (works without React Router)
        window.location.href = '/login';   
    };

    // Update user info 
    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    };

    // Provide context 
    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login,        
            logout,       
            updateUser,   
            setUser,      
            loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};