import React, { useEffect, useState } from 'react';
import { FaGithub, FaLinkedin, FaEnvelope, FaArrowLeft } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';
import './TeamDetails.css';
import Footer from '../components/footer/footer';
import Akhila from '../assests/teampics/akhila.jpg' ;
import prudhvi from '../assests/teampics/prudhvi.jpeg' ;
import neeraj from '../assests/teampics/neeraj.jpeg' ;
import sowjanya from '../assests/teampics/sowjanya.jpeg' ;
import yasaswinii from '../assests/teampics/yasaswinii.jpeg' ;
import saikumar from '../assests/teampics/saikumar.jpg' ;
import aravvind from '../assests/teampics/aravvind.jpg' ;
import venky from '../assests/teampics/venky.jpg' ;
import umaa from '../assests/teampics/umaa.jpg' ;

const TeamDetails = () => {
  const navigate = useNavigate();

  const [teamDetails, setTeamDetails] = useState({
    batch: "2024",
    teamNumber: 4,
    teamLead: [
      { 
        name: 'Prudhvi', 
        role: 'Team-Lead',
        image: prudhvi, 
        social: {
          github: 'https://github.com/Prudhvi2k3',
          linkedin: 'https://www.linkedin.com/in/prudhvi-ankamreddi/',
          email: 'prudhviankamreddi1@gmail.com'
        }
      }
    ],
    seniorDevelopers: [
      { 
        name: 'NEERA MADHAV', 
        role: 'Senior-Developer',
        image: neeraj,
        social: {
          github: 'https://github.com/NeerajMadhav',
          linkedin: 'https://www.linkedin.com/in/neerajmadhav/',
          email: 'neerajmadhav777@gmail.com'
        }
      },
      { 
        name: 'Yasaswini', 
        role: 'Senior-Developer',
        image: yasaswinii,
        social: {
          github: 'https://github.com/Yasaswini313',
          linkedin: 'https://www.linkedin.com/in/yasaswini-jakkula-a74413226/',
          email: 'yasaswinianudurga@gmail.com'
        }
      },
      { 
        name: 'Sowjanya', 
        role: 'Senior-Developer',
        image: sowjanya,
        social: {
          github: 'https://github.com/SOWJANYATILLAPUDI',
          linkedin: 'https://www.linkedin.com/in/sowjanya-tillapudi-19005623b/',
          email: 'tillapudisowjanya04@gmail.com'
        }
      },
      { 
        name: 'Venky', 
        role: 'Senior-Developer',
        image: venky,
        social: {
          github: 'https://github.com/venky-1710',
          linkedin: 'https://www.linkedin.com/in/venky1710',
          email: 'venkysss47@gmail.com'
        }
      }
    ],
    juniorDevelopers: [
      { 
        name: 'Aravind Swamy', 
        role: 'Junior-Developer',
        image: aravvind,
        social: {
          github: 'https://github.com/Aravindswamymajjuri',
          linkedin: 'https://linkedin.com/in/prudhvi',
          email: 'aravindswamymajjuri143@gmail.com'
        }
      },
      {
        name: 'Saikumar', 
        role: 'Junior-Developer',
        image: saikumar,
        social: {
          github: 'https://github.com/SAIKUMAR008212',    
          linkedin: 'https://www.linkedin.com/in/sai-kumar-kannuru-661673287/',
          email: 'ksai33393@gmail.com'
        }
      },
      { 
        name: 'Akhila', 
        role: 'Junior-Developer',
        image: Akhila,
        social: {
          github: 'https://github.com/AkhilaBelugula15',
          linkedin: 'https://www.linkedin.com/in/akhila-belugula-801444287/',
          email: 'belugulaakhilanaidu@gmail.com'
        }
      },
      { 
        name: 'Uma Seershika', 
        role: 'Junior-Developer',
        image: umaa,
        social: {
          github: 'https://github.com/umaseershika4',
          linkedin: 'https://www.linkedin.com/in/uma-seershika-yadla-b88a15276/ ',
          email: ' umaseershika@gmail.com'
        }
      },
    ]
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div>
      <div className="teamdetails-container">
        <button className="teamdetails-back-button" onClick={handleBackClick}>
          <FaArrowLeft /> 
        </button>
        
        <h1 className='teamdetails-heading'>Batch-{teamDetails.batch}</h1>
        <h2 className="teamdetails-team-title" style={{marginTop : "-20px"}}>Team {teamDetails.teamNumber}</h2>

        {/* Team Lead Section */}
        <h2 className="teamdetails-team-title">Team Lead</h2>
        <div className="teamdetails-team-section">
          {teamDetails.teamLead.map((member, index) => (
            <div key={index} className="teamdetails-team-card teamdetails-lead">
              <div className="teamdetails-profile-image-container">
                <img src={member.image} alt={member.name} className="teamdetails-profile-image" />
              </div>
              <div className="teamdetails-member-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <div className="teamdetails-social-links">
                  <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                    <FaGithub className="teamdetails-social-icon" />
                  </a>
                  <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                    <FaLinkedin className="teamdetails-social-icon" />
                  </a>
                  <a href={`mailto:${member.social.email}`}>
                    <FaEnvelope className="teamdetails-social-icon" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Senior Developers Section */}
        <h2 className="teamdetails-team-title">Senior Developers</h2>
        <div className="teamdetails-team-section">
          {teamDetails.seniorDevelopers.map((member, index) => (
            <div key={index} className="teamdetails-team-card teamdetails-senior">
              <div className="teamdetails-profile-image-container">
                <img src={member.image} alt={member.name} className="teamdetails-profile-image" />
              </div>
              <div className="teamdetails-member-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <div className="teamdetails-social-links">
                  <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                    <FaGithub className="teamdetails-social-icon" />
                  </a>
                  <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                    <FaLinkedin className="teamdetails-social-icon" />
                  </a>
                  <a href={`mailto:${member.social.email}`}>
                    <FaEnvelope className="teamdetails-social-icon" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Junior Developers Section */}
        <h2 className="teamdetails-team-title">Junior Developers</h2>
        <div className="teamdetails-team-section">
          {teamDetails.juniorDevelopers.map((member, index) => (
            <div key={index} className="teamdetails-team-card teamdetails-junior">
              <div className="teamdetails-profile-image-container">
                <img src={member.image} alt={member.name} className="teamdetails-profile-image" />
              </div>
              <div className="teamdetails-member-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <div className="teamdetails-social-links">
                  <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                    <FaGithub className="teamdetails-social-icon" />
                  </a>
                  <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                    <FaLinkedin className="teamdetails-social-icon" />
                  </a>
                  <a href={`mailto:${member.social.email}`}>
                    <FaEnvelope className="teamdetails-social-icon" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Footer/>
      </div>
    </div>
  );
};

export default TeamDetails;