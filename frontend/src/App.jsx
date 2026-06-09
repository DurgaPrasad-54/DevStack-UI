import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Hero from './heroroute';
import User from './userroutes';
import Mentor from './mentorroutes';
import Admin from './adminroutes';
import Login from './components/loginpage/LoginPage';
import AdminLogin from './components/adminlogin/adminlogin';
import Reset from './components/adminlogin/resetpassword';
import Forgot from './components/adminlogin/forgotpassword';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import loadingAnimation from './assests/Loading.lottie';
import ForgotPassword from './components/loginpage/ForgotPassword';
import ResetPassword from './components/loginpage/ResetPassword';
import SignupPage from './components/signups/signup';
import Footer from './components/footer/footer';
import TeamDetails from './pages/TeamDetails';
import RoleBasedProtectedRoute from './protected-routes/protectedroutes';

function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 500); // Duration of the fade-out animation
    }, 2000); // Adjust the timeout duration as needed // 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <DotLottieReact
          src={loadingAnimation}
          loop
          autoplay
          style={{ width: '300px', height: '300px' }}
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/adminreset" element={<Reset />} />
          <Route path="/adminforgot" element={<Forgot />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/team-details" element={<TeamDetails />} />
          
          {/* Protected student routes */}
          <Route element={<RoleBasedProtectedRoute allowedRoles={['student']} />}>
            <Route path='/user/*' element={<User />} />
          </Route>
          
          {/* Protected mentor routes */}
          <Route element={<RoleBasedProtectedRoute allowedRoles={['mentor']} />}>
            <Route path='/mentor/*' element={<Mentor />} />
          </Route>
          
          {/* Protected admin routes */}
          <Route element={<RoleBasedProtectedRoute allowedRoles={['admin']} />}>
            <Route path='/admin/*' element={<Admin />} />
          </Route>
        </Routes>
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;