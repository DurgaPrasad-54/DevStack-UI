import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../loginpage/LoginPage.css';
import loginimage from '../../assests/robo.png';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';

const LoginPage = ({ onNavigate = () => {} }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await axios.post(`${config.backendUrl}/roles/${role.toLowerCase()}/login`, 
      { email, password },
      { 
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status === 200) {
      // Console log the entire response to check data
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      // Store the token
      localStorage.setItem('token', response.data.token);
      
      // Store user role - ensure we save as lowercase
      const userRole = role.toLowerCase();
      localStorage.setItem('userRole', userRole);
      
      // Handle role-specific data storage
      if (userRole === 'student') {
        if (response.data.student) {
          localStorage.setItem('student', response.data.student.id);
        }
        
        // Store student current year if available
        if (response.data.student.currentYear) {
          localStorage.setItem('studentYear', response.data.student.currentYear);
          console.log('Student year stored in localStorage:', response.data.student.currentYear);
        } else {
          console.log('No studentyear found in response');
        }
      } else if (userRole === 'mentor') {
        // Store mentor ID
        if (response.data.mentor) {
          localStorage.setItem('mentor', response.data.mentor);
          console.log('Mentor ID stored in localStorage:', response.data.mentor);
        } else {
          console.log('No mentor ID found in response');
        }
      }
      
      // Show success message
      toast.success('Login successful!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });

      // Navigate based on role
      const navigatePath = userRole === 'mentor' ? '/mentor' : '/user';
      setTimeout(() => navigate(navigatePath), 2000);
    }
  } catch (error) {
    let errorMessage = 'An error occurred during login';
    
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          errorMessage = 'Invalid email or password';
          break;
        case 403:
          errorMessage = error.response.data.message || 'Account not approved';
          break;
        case 404:
          errorMessage = 'User not found';
          break;
        default:
          errorMessage = error.response.data.message || 'Login failed';
      }
    }

    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-form">
          <h2>WELCOME BACK</h2>
          <p>Welcome back! Please enter your details.</p>
          
          <div className="role-toggle">
            <div className="toggle-switch">
              {['student', 'mentor'].map(type => (
                <button 
                  key={type}
                  type="button"
                  className={role === type ? 'selected' : ''}
                  onClick={() => setRole(type)}
                  disabled={isLoading}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email"
                placeholder="projectnest@kietgroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-input">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="options">
              <span 
                onClick={() => !isLoading && navigate('/reset-password')} 
                className="reset-password"
              >
                Reset Password
              </span>
              <span 
                onClick={() => !isLoading && navigate('/forgot-password')} 
                className="forgot-password"
              >
                Forgot Password
              </span>
            </div>

            <button 
              type="submit" 
              className="sign-in-button"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="signup-link">
            Don't have an account? {' '}
            <span 
              onClick={() => !isLoading && navigate('/signup')} 
              className="clickable-text"
            >
              Sign up
            </span>
          </p>
        </div>
        <div className="login-image">
          <img src={loginimage} alt="Astronaut" />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;