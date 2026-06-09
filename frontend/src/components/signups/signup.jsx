import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signup.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import config from '../../config';

const SignupPage = () => {
  const [selectedRole, setSelectedRole] = useState('student'); // Default to 'student'
  const [isAnimating, setIsAnimating] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Student Form State
  const [studentFormData, setStudentFormData] = useState({
    name: '', email: '', phoneNumber: '',
    rollNo: '', branch: '', year: '', currentYear: '', college: '',
    github: '', linkedin: '',
    password: '', confirmPassword: ''
  });

  // Mentor Form State
  const [mentorFormData, setMentorFormData] = useState({
    name: '', email: '', phoneNumber: '',
    github: '', linkedin: '',
    password: '', confirmPassword: ''
  });

  // Current step states
  const [studentStep, setStudentStep] = useState(1);
  const [mentorStep, setMentorStep] = useState(1);

  // Current Year options
  const currentYearOptions = [
    { value: 'first year', label: 'First Year' },
    { value: 'second year', label: 'Second Year' },
    { value: 'third year', label: 'Third Year' },
    { value: 'fourth year', label: 'Fourth Year' },
    { value: 'alumni', label: 'Alumni' }
  ];

  const handleRoleSelect = (role) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedRole(role);
      setIsAnimating(false);
    }, 500);
  };

  const validateField = (name, value, formData) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phoneNumber':
        if (!/^\d{10}$/.test(value)) {
          error = 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'github':
      case 'linkedin':
        if (!/^https?:\/\/.+/.test(value)) {
          error = 'Please enter a valid URL';
        }
        break;
      case 'password':
      case 'confirmPassword':
        if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        }
        if (name === 'confirmPassword' && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      default:
        if (!value) {
          error = 'This field is required';
        }
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  // Student form handlers
  const handleStudentInputChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData({ ...studentFormData, [name]: value });
    validateField(name, value, studentFormData);
  };

  const isStudentStepComplete = (step) => {
    switch (step) {
      case 1:
        return studentFormData.name && studentFormData.email && studentFormData.phoneNumber && !errors.name && !errors.email && !errors.phoneNumber;
      case 2:
        return studentFormData.rollNo && studentFormData.branch && 
               studentFormData.year && studentFormData.currentYear && studentFormData.college && 
               !errors.rollNo && !errors.branch && !errors.year && !errors.currentYear && !errors.college;
      case 3:
        return studentFormData.github && studentFormData.linkedin && !errors.github && !errors.linkedin;
      case 4:
        return studentFormData.password && studentFormData.confirmPassword && 
               studentFormData.password === studentFormData.confirmPassword && !errors.password && !errors.confirmPassword;
      default:
        return false;
    }
  };

  // Mentor form handlers
  const handleMentorInputChange = (e) => {
    const { name, value } = e.target;
    setMentorFormData({ ...mentorFormData, [name]: value });
    validateField(name, value, mentorFormData);
  };

  const isMentorStepComplete = (step) => {
    switch (step) {
      case 1:
        return mentorFormData.name && mentorFormData.email && mentorFormData.phoneNumber && !errors.name && !errors.email && !errors.phoneNumber;
      case 2:
        return mentorFormData.github && mentorFormData.linkedin && !errors.github && !errors.linkedin;
      case 3:
        return mentorFormData.password && mentorFormData.confirmPassword && 
               mentorFormData.password === mentorFormData.confirmPassword && !errors.password && !errors.confirmPassword;
      default:
        return false;
    }
  };

  // Submit handlers
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (studentStep === 4) {
      try {
        console.log("Student Signup Payload:", studentFormData);
        const response = await fetch(`${config.backendUrl}/roles/student/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentFormData)
        });
        if (response.ok) {
          toast.success('Student registration successful!');
          navigate('/login');
        } else {
          const errorData = await response.json();
          toast.error(`Registration failed: ${errorData.error}`);
        }
      } catch (error) {
        toast.error('Error during registration: ' + error.message);
      }
    }
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();
    if (mentorStep === 3) {
      try {
        // Show loading toast
        const loadingToast = toast.loading("Submitting registration...");
        
        // Prepare the payload
        const mentorPayload = {
          name: mentorFormData.name,
          email: mentorFormData.email,
          phoneNumber: mentorFormData.phoneNumber,
          github: mentorFormData.github,
          linkedin: mentorFormData.linkedin,
          password: mentorFormData.password
        };
  

        
        console.log("Mentor Signup Payload:", mentorPayload);
        
        const response = await fetch(`${config.backendUrl}/roles/mentor/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mentorPayload)
        });
  
        // Dismiss loading toast
        toast.dismiss(loadingToast);
  
        if (response.ok) {
          const data = await response.json();
          toast.success(data.message || 'Registration submitted successfully! Awaiting admin approval.');
          
          // Delay navigation to allow user to read the success message
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          const errorData = await response.json();
          let errorMessage = errorData.error || 'Registration failed';
          
          // Handle specific error cases
          if (errorMessage.includes('duplicate key error')) {
            if (errorMessage.includes('email')) {
              errorMessage = 'This email is already registered';
            } else if (errorMessage.includes('phoneNumber')) {
              errorMessage = 'This phone number is already registered';
            }
          }
          
          toast.error(errorMessage);
        }
      } catch (error) {
        toast.error('Error during registration: ' + (error.message || 'Please try again later'));
        console.error('Mentor registration error:', error);
      }
    }
  };

  // Step indicators
  const renderStepIndicator = (currentStep, totalSteps, isStepComplete) => {
    return Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
      <div 
        key={step}
        className={`step-indicator ${currentStep === step ? 'active' : ''} 
                   ${isStepComplete(step) ? 'completed' : ''}`}
      >
        {isStepComplete(step) ? '✓' : step}
      </div>
    ));
  };

  // Form renderers
  const renderStudentForm = () => {
    switch (studentStep) {
      case 1:
        return (
          <div className="form-group">
            <label className="signup-label">Personal Information</label>
            <input
              className="signup-input-field"
              name="name"
              placeholder="Full Name"
              value={studentFormData.name}
              onChange={handleStudentInputChange}
              required
            />
            {errors.name && <span className="error">{errors.name}</span>}
            <input
              className="signup-input-field"
              name="email"
              type="email"
              placeholder="Email Address"
              value={studentFormData.email}
              onChange={handleStudentInputChange}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
            <input
              className="signup-input-field"
              name="phoneNumber"
              placeholder="Phone Number"
              value={studentFormData.phoneNumber}
              onChange={handleStudentInputChange}
              required
              pattern="^\d{10}$"
              title="Please enter a valid 10-digit phone number"
            />
            {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
          </div>
        );
      case 2:
        return (
          <div className="form-group">
            <label className="signup-label">Academic Information</label>
            <input
              className="signup-input-field"
              name="rollNo"
              placeholder="Roll Number"
              value={studentFormData.rollNo}
              onChange={handleStudentInputChange}
              required
            />
            {errors.rollNo && <span className="error">{errors.rollNo}</span>}
            <input
              className="signup-input-field"
              name="branch"
              placeholder="Branch"
              value={studentFormData.branch}
              onChange={handleStudentInputChange}
              required
            />
            {errors.branch && <span className="error">{errors.branch}</span>}
            <input
              className="signup-input-field"
              name="year"
              placeholder="Year (e.g., 2024)"
              value={studentFormData.year}
              onChange={handleStudentInputChange}
              required
            />
            {errors.year && <span className="error">{errors.year}</span>}
            <select
              className="signup-input-field"
              name="currentYear"
              value={studentFormData.currentYear}
              onChange={handleStudentInputChange}
              required
            >
              <option value="">Select Current Year</option>
              {currentYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.currentYear && <span className="error">{errors.currentYear}</span>}
            <input
              className="signup-input-field"
              name="college"
              placeholder="College"
              value={studentFormData.college}
              onChange={handleStudentInputChange}
              required
            />
            {errors.college && <span className="error">{errors.college}</span>}
          </div>
        );
      case 3:
        return (
          <div className="form-group">
            <label className="signup-label">Social Media Profiles</label>
            <input
              className="signup-input-field"
              name="github"
              placeholder="GitHub Profile URL"
              value={studentFormData.github}
              onChange={handleStudentInputChange}
              required
              pattern="https?://.+"
              title="Please enter a valid URL"
            />
            {errors.github && <span className="error">{errors.github}</span>}
            <input
              className="signup-input-field"
              name="linkedin"
              placeholder="LinkedIn Profile URL"
              value={studentFormData.linkedin}
              onChange={handleStudentInputChange}
              required
              pattern="https?://.+"
              title="Please enter a valid URL"
            />
            {errors.linkedin && <span className="error">{errors.linkedin}</span>}
          </div>
        );
      case 4:
        return (
          <div className="form-group">
            <label className="signup-label">Password</label>
            <div className="password-container">
              <input
                className="signup-input-field"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={studentFormData.password}
                onChange={handleStudentInputChange}
                required
                minLength="8"
                title="Password must be at least 8 characters long"
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error">{errors.password}</span>}
            <div className="password-container">
              <input
                className="signup-input-field"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={studentFormData.confirmPassword}
                onChange={handleStudentInputChange}
                required
                minLength="8"
                title="Password must be at least 8 characters long"
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMentorForm = () => {
    switch (mentorStep) {
      case 1:
        return (
          <div className="form-group">
            <label className="signup-label">Personal Information</label>
            <input
              className="signup-input-field"
              name="name"
              placeholder="Full Name"
              value={mentorFormData.name}
              onChange={handleMentorInputChange}
              required
            />
            {errors.name && <span className="error">{errors.name}</span>}
            <input
              className="signup-input-field"
              name="email"
              type="email"
              placeholder="Email Address"
              value={mentorFormData.email}
              onChange={handleMentorInputChange}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
            <input
              className="signup-input-field"
              name="phoneNumber"
              placeholder="Phone Number"
              value={mentorFormData.phoneNumber}
              onChange={handleMentorInputChange}
              required
              pattern="^\d{10}$"
              title="Please enter a valid 10-digit phone number"
            />
            {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
          </div>
        );
      case 2:
        return (
          <div className="form-group">
            <label className="signup-label">Social Media Profiles</label>
            <input
              className="signup-input-field"
              name="github"
              placeholder="GitHub Profile URL"
              value={mentorFormData.github}
              onChange={handleMentorInputChange}
              required
              pattern="https?://.+"
              title="Please enter a valid URL"
            />
            {errors.github && <span className="error">{errors.github}</span>}
            <input
              className="signup-input-field"
              name="linkedin"
              placeholder="LinkedIn Profile URL"
              value={mentorFormData.linkedin}
              onChange={handleMentorInputChange}
              required
              pattern="https?://.+"
              title="Please enter a valid URL"
            />
            {errors.linkedin && <span className="error">{errors.linkedin}</span>}
          </div>
        );
      case 3:
        return (
          <div className="form-group">
            <label className="signup-label">Password</label>
            <div className="password-container">
              <input
                className="signup-input-field"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={mentorFormData.password}
                onChange={handleMentorInputChange}
                required
                minLength="8"
                title="Password must be at least 8 characters long"
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error">{errors.password}</span>}
            <div className="password-container">
              <input
                className="signup-input-field"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={mentorFormData.confirmPassword}
                onChange={handleMentorInputChange}
                required
                minLength="8"
                title="Password must be at least 8 characters long"
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const renderButtons = () => (
    <div className="buttons-card">
      <h2 className="signup-title">Choose Your Role</h2>
      <button 
        className="role-button student-btn"
        onClick={() => handleRoleSelect('student')}
      >
        Register as Student
      </button>
      <button 
        className="role-button mentor-btn"
        onClick={() => handleRoleSelect('mentor')}
      >
        Register as Mentor
      </button>
      <div className='signup-matter-div'>
      <p className='signup-matter'> Already Register? <Link to={"/login"}>Login</Link> </p>
      </div>
    </div>
  );

  return (
    <div className="choice-container">
      <ToastContainer />
      <div className="cards-wrapper">
        {selectedRole === 'student' ? (
          <>
            <div className={`signup-card ${isAnimating ? 'slide-in' : ''}`}>
              <h2 className="signup-title">Student Registration</h2>
              <div className="progress-bar">
                {renderStepIndicator(studentStep, 4, isStudentStepComplete)}
              </div>
              <form onSubmit={handleStudentSubmit}>
                {renderStudentForm()}
                <div className="button-groupsss">
                  <button
                    type="button"
                    onClick={() => setStudentStep((curr) => curr - 1)}
                    disabled={studentStep === 1}
                    className="btn btn-prev"
                  >
                    Previous
                  </button>
                  <button
                    type={studentStep === 4 ? 'submit' : 'button'}
                    onClick={() =>
                      studentStep < 4 && setStudentStep((curr) => curr + 1)
                    }
                    disabled={!isStudentStepComplete(studentStep)}
                    className="btn btn-next"
                  >
                    {studentStep === 4 ? 'Submit' : 'Next'}
                  </button>
                </div>
              </form>
            </div>
            <div className={`card-container ${isAnimating ? 'slide-out' : ''}`}>
              {renderButtons()}
            </div>
          </>
        ) : selectedRole === 'mentor' ? (
          <>
            <div className={`card-container ${isAnimating ? 'slide-out' : ''}`}>
              {renderButtons()}
            </div>
            <div className={`signup-card ${isAnimating ? 'slide-in' : ''}`}>
              <h2 className="signup-title">Mentor Registration</h2>
              <div className="progress-bar">
                {renderStepIndicator(mentorStep, 3, isMentorStepComplete)}
              </div>
              <form onSubmit={handleMentorSubmit}>
                {renderMentorForm()}
                <div className="button-groupsss">
                  <button
                    type="button"
                    onClick={() => setMentorStep((curr) => curr - 1)}
                    disabled={mentorStep === 1}
                    className="btn btn-prev"
                  >
                    Previous
                  </button>
                  <button
                    type={mentorStep === 3 ? 'submit' : 'button'}
                    onClick={() =>
                      mentorStep < 3 && setMentorStep((curr) => curr + 1)
                    }
                    disabled={!isMentorStepComplete(mentorStep)}
                    className="btn btn-next"
                  >
                    {mentorStep === 3 ? 'Submit' : 'Next'}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className={`card-container ${isAnimating ? 'slide-in' : ''}`}>
            {renderButtons()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;