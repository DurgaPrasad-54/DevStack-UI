import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import "../header/header.css"; // Make sure your CSS is linked
import Logo from '../../assests/heroheadericon.png';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize the navigate hook

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLoginClick = () => {
    navigate('/login'); // Navigate to the login page
  };

  return (
    <div className='navbar-container'>
      <nav className='navbar'>
        <div className='logo-container'>
          <img className="logo" src={Logo} alt='logo' />
        </div>
        <div id="nav-icon3" className={isOpen ? 'open' : ''} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className={`navbar-items ${isOpen ? 'open' : ''}`}>
          <li><a className="mobile-nav-bar" href="#home" onClick={toggleMenu}>Home</a></li>
          <li><a href="#about" onClick={toggleMenu}>About</a></li>
          <li><a href="#curriculum" onClick={toggleMenu}>Curriculum</a></li>
          <li><a href="#projects" onClick={toggleMenu}>Project's</a></li>
          {/* <li><a href="##" onClick={toggleMenu}>Winner's</a></li> */}
          <li><a href="#contact" onClick={toggleMenu}>Contact</a></li>
          <button className='login-button-hero' onClick={handleLoginClick}>Login</button>
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
