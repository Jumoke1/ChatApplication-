import { Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TopNavbar from "./components/TopNavbar";
import SideNavbar from './components/Sidebar/SideNavbar';
import ProfileSidebar from "./components/Sidebar/ProfileSidebar";
import MiddleChatarea from "./components/Sidebar/MiddleChatarea";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/login' element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topnavbar" element={<TopNavbar />} />
        <Route path="/sidenavbar" element={<SideNavbar />} />
        <Route path="/profilesidebar" element={<ProfileSidebar />} />
        <Route path="/middlechatarea" element={<MiddleChatarea />} />
     
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;