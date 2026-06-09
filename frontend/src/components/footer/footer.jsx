import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../footer/footer.css';
import Logo from '../../assests/heroheadericon.png';
import mail from '../../assests/locationmailicon.png';
import { RxInstagramLogo } from "react-icons/rx";
import { FaYoutube } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa6";

function Footer() {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleTeamClick = () => {
    navigate('/team-details'); // Navigate to team details page
  };

  return (
    <div className='main-footer'>
      <div className='footer-container'>
        <div className='footer-subcontainer1'>
          <img src={Logo} alt='logo' className='header-logo'/>
          <div className='footer-subcontainer1-social-media-icons'>
            <ul>
              <li><a href='https://www.instagram.com/khub_kiet/'><RxInstagramLogo /></a></li>
              <li><a href='https://www.youtube.com/@Kiet-Hub'><FaYoutube /></a></li>
              <li><a href='https://www.linkedin.com/company/khub-kiet/'><FaLinkedin /></a></li>
            </ul>
          </div>
          <p className='footer-matter1'>Dev-Orbit is your go to hub established by KIET Group for turning ideas into reality. Join a community of creators, access valuable resources and gain invaluable insights, and collaborate on projects.</p>
        </div>

        <div className='footer-subcontainer2'>
          <ul className='footer-list-items'>
            <li className='header'><h3>Quick Links</h3></li>
            <li><a href='#about'>About Us</a></li>
            <li><a href='#curriculum'>Cirriculum</a></li>
            <li><a href='#projects'>Project's</a></li>
            <li><a href='#contact'>Contact Us</a></li>
          </ul>
        </div>
        <div className='footer-subcontainer3'>
          <div className='footer-body'>
            <h3 className='footer-body-header'>Address</h3>
            <p className='footer-matter3'>Kiet College,Yanam Road,Korangi,Andhra Pradesh-533461</p>
            <div className='footer-subcontainer3-icons-bar'>
              <img src={mail} alt='' className='mail-icon'/>
              <p className='footer-matter3-para'>Dev-Orbit@kietgroup.com</p>
            </div>
          </div>
        </div>
       
        <div className='footer-subcontainer4'>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3819.294687742681!2d82.23744937525314!3d16.811730683980617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3821143f89e271%3A0x8ec5e22d8d18e4e6!2sKIET-HUB!5e0!3m2!1sen!2sin!4v1726982557087!5m2!1sen!2sin" width="100%" height="auto" style={{border:0}} allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title='map'></iframe>
        </div>
      </div>
      <div className='bottom-footer'>
        <hr className="line"/>
        <div className='copy-rights'>
          <p>Copyright © 2024 | All rights reserved.  Kiet Group</p>
          <p onClick={handleTeamClick} style={{ cursor: 'pointer' }}>Code + Design by K-Hub Team 4</p> {/* Add onClick handler */}
        </div>
      </div>
    </div>
  );
}

export default Footer;