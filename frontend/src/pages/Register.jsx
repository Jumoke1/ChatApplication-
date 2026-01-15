import { useState } from 'react';
import { IoMailOutline, IoLockClosedOutline, IoLogInOutline, IoPersonOutline } from 'react-icons/io5';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { IoChatbubbles } from 'react-icons/io5';

const Signup = () => {
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Gradient bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600" />
      
      <div className="w-full max-w-md px-6">
        {/* Card  login details  */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6252fe] via-[#526bff] to-[#11bdff] rounded-2xl flex items-center justify-center shadow-lg">
              <IoChatbubbles className="text-white text-3xl" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            FlowChat
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Welcome back! Please sign in to your account
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'signin'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sign In
            </button>
          </div>

              {/* fullname Input */}
          <div className="mb-4">
            <label className="text-gray-700 mb-2 block font-medium text-sm">Fullname</label>
            <div className="relative">
              <input
                type="name"
                placeholder="Enter your email"
                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <IoPersonOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="text-gray-700 mb-2 block font-medium text-sm">Email address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <IoMailOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="text-gray-700 mb-2 block font-medium text-sm">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>

           {/*  Confirm Password Input */}
          <div className="mb-4">
            <label className="text-gray-700 mb-2 block font-medium text-sm"> Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-purple-600 checked:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                I agree to the Terms of Service and PrivacyPolicy
              </label>
            </div>
          
          </div>

          {/* Sign In Button */}
          <button className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all">
            <IoLogInOutline className="text-xl" />
             Create FlowChat account
          </button>

          {/* Divider */}
          <div className="text-center text-sm text-gray-500 mb-6">
            Or continue with
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 h-12 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <FaGoogle className="text-red-500 text-lg" />
              <span className="text-gray-700 font-medium">Google</span>
            </button>
            <button className="flex-1 h-12 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <FaGithub className="text-gray-800 text-lg" />
              <span className="text-gray-700 font-medium">GitHub</span>
            </button>
          </div>

          {/* Support Link */}
          <div className="text-center text-sm text-gray-600">
            Need help?{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;