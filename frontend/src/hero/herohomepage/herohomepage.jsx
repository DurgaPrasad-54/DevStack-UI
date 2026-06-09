import React, { useState, useEffect } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
// import rectangle3 from '../../assests/homepageassests/Rectangle 3.png';
import home1 from '../../assests/homepageassests/homeeee.svg';
import home2 from '../../assests/homepageassests/homeeee2.jpg';
import home3 from '../../assests/homepageassests/homeeee3.jpg';
import home4 from '../../assests/homepageassests/home4.jpg';

import '../herohomepage/herohomepage.css';

const images = [home1, home3,home4,home2];
const textArray = [
  {
    subtitle: "Spark Your Innovation, Your Ideas Deserve a Platform.",
    description: "Join Dev-Orbit and turn your vision into reality."
  },
  {
    subtitle: "Fuel your dreams with endless possibilities.",
    description: "Unleash your potential through Dev-Orbit."
  },
  {
    subtitle: "Where ideas take flight.",
    description: "Step into Dev-Orbit and soar towards success."
  },
  {
    subtitle: "Innovation at its finest.",
    description: "Dev-Orbit is your platform for greatness."
  }
];

const barColors = [
  ['yellow', 'white', 'white'],
  ['white', 'yellow', 'white'],
  ['white', 'white', 'yellow'],
  ['yellow', 'yellow', 'white']
];

const Projectnest = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const wrapLetters = (text) => {
    return text.split('').map((char, index) => {
      if (char === ' ') {
        return <span key={index} className="space"></span>;
      }
      return (
        <span key={index} className="letter" style={{ '--char-index': index }}>
          {char}
        </span>
      );
    });
  };

  return (
    <section id="home">
    <div
      className="project-nest"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="slideshow">
        <img src={images[currentIndex]} alt="Slideshow" className="slideshow-image" />
        <div className="bottom-bars">
          <div className={`bar ${barColors[currentIndex][0]}`}></div>
          <div className={`bar ${barColors[currentIndex][1]}`}></div>
          <div className={`bar ${barColors[currentIndex][2]}`}></div>
        </div>
      </div>
      <div className="overlay">
        <div className="content">
          <h1>{wrapLetters("DEV ORBIT")}</h1>
          <p className="subtitle">{wrapLetters(textArray[currentIndex].subtitle)}</p>
          <p className="description-hero">{wrapLetters(textArray[currentIndex].description)}</p>
        </div>
      </div>
      {isHovered && (
        <>
          <button className="nav-button prev-button" onClick={goToPrevious}>
            <IoIosArrowBack size={32} />
          </button>
          <button className="nav-button next-button" onClick={goToNext}>
            <IoIosArrowForward size={32} />
          </button>
        </>
      )}
    </div>
    </section>
  );
};

export default Projectnest;
