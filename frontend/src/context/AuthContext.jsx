import { createContext, useContext, useState, useEffect} from "react";


const AuthContext = createContext()


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user"))||null
    )
    const [token, setToken] = useState(
        localStorage.getItem("token") || null);
    
        //login
        const login = (userData, jwt) => {
            setUser(userData);
            setToken(jwt);

            //save to the local storage 
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setIem("token", jwt)
        }

        const logout = () => {
            setUser(null);
            setUser(null);

            localStorage.removeItem("user")
            localStorage.removeItem("token ")
        }


     return(
    <AuthContext.Provider value= {{user, token, login,logout, setUser}}>
        {children}
    </AuthContext.Provider>
 );
}
export const useAuth = () => useContext(AuthContext);