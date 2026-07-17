import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import './index.css';
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  //<React.StrictMode>
    <BrowserRouter>          
      <SocketProvider>        
        <AuthProvider>
          <App />
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  //</React.StrictMode>
);