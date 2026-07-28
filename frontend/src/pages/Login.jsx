import { useState } from 'react';
import { IoMailOutline, IoLockClosedOutline, IoLogInOutline, IoPersonOutline } from 'react-icons/io5';
import { FaGoogle } from 'react-icons/fa';
import { IoChatbubbles } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // make sure password is strong enough
  const validatePassword = (pass) => {
    if (pass.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(pass)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // basic email format check
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // validate all fields before sending to server
    if (!fullname.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (fullname.trim().length < 2) {
      setError("Name must be at least 2 characters");
      setLoading(false);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        fullname: fullname.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      console.log('=== SIGNUP RESPONSE ===');
      console.log('Response data:', response.data);

      if (response.status >= 200 && response.status < 300) {
        const { token, user } = response.data;
        
        if (token && user) {
          login(user, token);
          navigate("/dashboard");
        } else {
          setError("Invalid response from server");
        }
      } else {
        setError(response.data?.message || "Signup failed");
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        email: email.toLowerCase().trim(),
        password,
      });

      console.log(' LOGIN RESPONSE ');
      console.log('Response data:', response.data);

      if (response.status >= 200 && response.status < 300) {
        const { token, user } = response.data;
        
        if (token && user) {
          login(user, token);
          navigate("/dashboard");
        } else {
          setError("Invalid response from server");
        }
      } else {
        setError(response.data?.message || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* colored bar at the very top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600" />
      
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* app logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6252fe] via-[#526bff] to-[#11bdff] rounded-2xl flex items-center justify-center shadow-lg">
              <IoChatbubbles className="text-white text-3xl" />
            </div>
          </div>

          {/* app title */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            FlowChat
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            {activeTab === 'signin' 
              ? "Welcome back! Please sign in to your account"
              : "Create a new account to get started"}
          </p>

          {/* sign in / sign up tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab('signin');
                setError("");
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'signin'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError("");
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {activeTab === 'signin' && (
            <>
              {/* email field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Email address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoMailOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* password field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* remember me checkbox and forgot password link */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-purple-600 checked:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Forgot password?
                </a>
              </div>

              {/* sign in button */}
              <button 
                onClick={handleLogin} 
                disabled={loading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IoLogInOutline className="text-xl" />
                )}
                {loading ? "Signing in..." : "Sign in to FlowChat"}
              </button>
            </>
          )}

          {activeTab === 'signup' && (
            <>
              {/* full name field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Full name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullname}
                    placeholder="Enter your full name"
                    onChange={(e) => setFullname(e.target.value)}
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoPersonOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* email field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Email address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoMailOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* password field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters with one uppercase letter and one number
                </p>
              </div>

              {/* confirm password field */}
              <div className="mb-4">
                <label className="text-gray-700 mb-2 block font-medium text-sm">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <IoLockClosedOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* terms and conditions checkbox */}
              <div className="flex items-center mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-purple-600 checked:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                    I agree to the{" "}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-medium underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-medium underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* sign up button */}
              <button 
                onClick={handleSignup} 
                disabled={loading || !fullname || !email || !password || !confirmPassword || !acceptTerms}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sign up for FlowChat"
                )}
              </button>
            </>
          )}

          {/* divider text */}
          <div className="text-center text-sm text-gray-500 mb-6">
            Or continue with
          </div>

          {/* social login - google only, centered */}
          <div className="flex justify-center mb-6">
            <button className="w-48 h-12 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <FaGoogle className="text-red-500 text-lg" />
              <span className="text-gray-700 font-medium">Google</span>
            </button>
          </div>

          {/* support link */}
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

export default Login;