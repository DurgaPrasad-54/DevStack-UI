import React from 'react';
import './about.css';
import marsImage from '../../assests/mars.png';
import mobileImage from '../../assests/mobile-mars.png';

function About() {
  return (
    <div
      className="impact-container"
      style={{ backgroundImage: `url(${window.innerWidth <= 767 ? mobileImage : marsImage})` }}
    >
      <div className="mars-con" />

      <div className="cards-con">
        {/* Card 1 */}
        <div className="cards">
          <h3 className="impact-title">01. Sparkling Innovation</h3>
          <p className="impact-description">
            Students have developed, their impact on the community or industry, and any patents or copyrights obtained
          </p>
        </div>

        {/* Card 2 */}
        <div className="cards">
          <h3 className="impact-title">02. Empowering Future Leaders</h3>
          <p className="impact-description">
            500+ students who have participated in the program, the percentage who have secured internships or full-time jobs, won by students.
          </p>
        </div>

        {/* Card 3 */}
        <div className="cards">
          <h3 className="impact-title">03. Creating a Better World</h3>
          <p className="impact-description">
            10+ social issues addressed by student projects, the positive impact these projects have had on society, and any awards or recognition received for their contributions.
          </p>
        </div>

        {/* Card 4 */}
        <div className="cards">
          <h3 className="impact-title">04. Building Bridges</h3>
          <p className="impact-description">
            5+ industry partners involved in the program, the types of internships and mentorship opportunities offered, and the success stories of students who have benefited from these partnerships.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
