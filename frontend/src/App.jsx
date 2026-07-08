import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'
import TopNavbar from "./components/TopNavbar";
import SideNavbar from './components/Sidebar/SideNavbar'
import ProfileSidebar from "./components/Sidebar/profileSidebar";
import MiddleChatarea  from "./components/Sidebar/MiddleChatarea"


function App() {
  return(
   
    <Router>
      <div className="App">
        <Routes>
              {/* by default users are redirected to login */}
              <Route path='/' element={<Navigate to='/login' replace/>}/>

              {/*Authentication routes*/}
              <Route path='/login' element={<Login/>}/>
              <Route path="/register" element= {<Register/>}/>


               {/* Main Dashboard */}
               <Route path="/dashboard" element= {<Dashboard/>}/>
               <Route path="/topnavbar" element= {<TopNavbar/>}/>
               <Route path="/sidenavbar" element={<SideNavbar/>}/>
               <Route path="/profilesidebar" element={<ProfileSidebar/>}/>
               <Route path="/middlechatarea" element={<MiddleChatarea/>}/>

               {/*fallback routes for unknown routes will redirect to login */}
               <Route path="*" element={<Navigate to="/login replace"/>}/>
          </Routes>
      </div>
    </Router>

  )
}

export default App;
