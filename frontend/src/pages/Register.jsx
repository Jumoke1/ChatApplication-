 import { useState } from 'react';
import { IoMailOutline, IoLockClosedOutline, IoLogInOutline, IoPersonOutline, IoChatbubbles } from 'react-icons/io5';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Signup = () => {
  const [activeTab, setActiveTab] = useState('signup'); // default tab
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (activeTab === 'signup' && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const url = activeTab === 'signup'
       ? `${API_BASE}/api/auth/register`   
        : `${API_BASE}/api/auth/login`;       


      const bodyData = activeTab === 'signup'
        ? formData
        : { email: formData.email, password: formData.password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (res.ok) {
        // Save token & user to localStorage
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user); // update auth context
        navigate("/dashboard"); // redirect
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Network error, try again");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600" />

      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6252fe] via-[#526bff] to-[#11bdff] rounded-2xl flex items-center justify-center shadow-lg">
              <IoChatbubbles className="text-white text-3xl" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            FlowChat
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            {activeTab === 'signin' ? "Welcome back! Please sign in to your account" : "Create your FlowChat account"}
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${activeTab === 'signup' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${activeTab === 'signin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Sign In
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <>
                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Fullname</label>
                  <div className="relative">
                    <input type="text" name="fullname" placeholder="Enter your fullname" value={formData.fullname} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoPersonOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Email address</label>
                  <div className="relative">
                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoMailOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Password</label>
                  <div className="relative">
                    <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Confirm Password</label>
                  <div className="relative">
                    <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <button type="submit" className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all">
                  <IoLogInOutline className="text-xl" />
                  Create FlowChat account
                </button>
              </>
            )}

            {activeTab === 'signin' && (
              <>
                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Email address</label>
                  <div className="relative">
                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoMailOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-gray-700 mb-2 block font-medium text-sm">Password</label>
                  <div className="relative">
                    <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                    <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                </div>

                <button type="submit" className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all">
                  <IoLogInOutline className="text-xl" />
                  Sign in to FlowChat
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;