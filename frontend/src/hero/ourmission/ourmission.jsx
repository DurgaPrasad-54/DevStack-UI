import React from 'react';
import './MissionVision.css';
// import project from '../../assests/project.png'
import MissionImg from '../../assests/ourMissionVision/ourMission.jpeg';
import VisionImg from '../../assests/ourMissionVision/ourVision.jpeg';
const MissionVision = () => {
  return (
    <div className="mission-vision-container">
      <div className="content-wrapper">
        <div className="mission">
          <div className="section-header">
            <div className="vertical-line"></div>
            <h2 className='missionvision'>Our Mission</h2>
          </div>
          <div className="mission-content">
            <p className='para'>
              Dev-Orbit enhances collaborative learning by having students research and develop innovative
              projects on specific concepts. Teams receive mentorship and are evaluated on innovation,
              practicality, and presentation. Top projects are recognized in a prize ceremony. Our mission is to
              foster teamwork, critical thinking, and real-world problem-solving skills while celebrating student
              achievements.
            </p>
            <img src={MissionImg} alt="Satellite in space" className="mission-image" />
          </div>
        </div>
        
        <div className="vision">
          <div className="vision-content">
            <img src={VisionImg} alt="Satellite in space" className="vision-image" />
            <div className="vision-text">
              <div className="section-header">
                <div className="vertical-line"></div>
                <h2 className='missionvision'>Our Vision</h2>
              </div>
              <p className='para'>
                Our vision is to transform education by creating a dynamic platform where students collaboratively
                tackle real-world problems, drive innovation, and develop essential skills for the future. We aim to
                inspire a generation of problem-solvers who thrive in both academic and practical settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionVision;