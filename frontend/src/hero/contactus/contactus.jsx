import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../contactus/contact.css';
import linkedin from '../../assests/contactus icons/linkedinicon.png';
import youtube from '../../assests/contactus icons/youtubeicon.png';
import instagram from '../../assests/contactus icons/instagramicon.png';
import location from '../../assests/contactus icons/location-sign.png';
import mail from '../../assests/contactus icons/mailicon.png';
import phone from '../../assests/contactus icons/Telephoneicon.png';
import config from '../../config';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${config.backendUrl}/contact`, formData);
      toast.success('Message sent successfully!', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        phone: '',
      });
    } catch (error) {
      toast.error('Error sending message. Please try again later.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section id='contact'>
    <div className="contact-container">
      {/* Previous code remains the same until the button */}
      <h1 className="contact-title">Contact Us</h1>
      <div className="containers">
        <div className="container1">
          <label className="main-heading">Let's discuss</label>
          <label className="main-heading">
            on something <span>cool</span>
          </label>
          <div className="our-info">
            <div className="mailicon-section">
              <img className="mailicon" src={mail} alt="email icon" />
              <p>Dev-Orbit@gmail.com</p>
            </div>
            <div className="phoneicon-section">
              <img className="phoneicon" src={phone} alt="phone icon" />
              <p className="phone">+123 456 789</p>
            </div>
            <div className="locationicon-section">
              <img className="locationicon" src={location} alt="location icon" />
              <p className="location-matter">Kiet College, Yanam Road, Korangi, Andhra Pradesh-533451</p>
            </div>
            <div className="contact-us">
              <ul>
                <li><a href='##1'><img src={linkedin} alt="LinkedIn" /></a></li>
                <li><a href='##0'><img src={youtube} alt="Email" /></a></li>
                <li><a href='##3'><img src={instagram} alt="Instagram" /></a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container2">
          <label className="second-title">
            Get in <span>touch!</span>
          </label>
          <form onSubmit={handleSubmit} className="inp-container">
            <input
              className="input-field"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
            />
            <input
              className="input-field"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <input
              className="input-field"
              type="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone no"
              required
            />
            <input
              className="input-field"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              required
            />
            <textarea
              className="msg-inp"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your message"
              required
            />
            <div className="button-container">
              <button type="submit" >
               {/* <div className="loader"></div>  */}
                <div className="svg-wrapper-1">
                  <div className="svg-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                    >
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path
                        fill="currentColor"
                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <span className="send-icon">Send Message</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
    </section>
  );
};

export default Contact;