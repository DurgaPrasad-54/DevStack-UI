import React from 'react';
import './about.css';
// import aboutImage from '../../assests/First 5.png';
import aboutImg from '../../assests/about.jpg';

const AboutUs = () => {
  return (
    <section className="about-container" id="about">
      <div className="about-wrapper">
        <figure className="image-section">
          <img 
            src={aboutImg} 
            alt="Geometric pattern representing innovation" 
            className="about-image"
          />
          {/* <figcaption className="image-caption">Geometric pattern representing innovation</figcaption> */}
        </figure>
        <article className="content-section">
          <div className="title-container">
            <span className="vertical-line"></span>
            <h2 className="about-title">About Us</h2>
          </div>
          <p className="about-description">
            Dev-Orbit is a student-centric initiative at Kiet College dedicated to fostering 
            innovation and creativity. Our program provides a platform for students to explore their 
            passions, develop essential skills, and collaborate with like-minded individuals. Through 
            mentorship, workshops, and hands-on projects, we empower students to become future 
            leaders and innovators. Join us in creating a vibrant community of learners and problem-solvers.
          </p>
        </article>
      </div>
    </section>
  );
};

export default AboutUs;