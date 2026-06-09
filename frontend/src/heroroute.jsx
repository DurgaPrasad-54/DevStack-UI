import React from 'react';
// import CurriculumTimeline from './hero/cirrculum/cirrculum';
import Navbar from './components/header/header';
import Projectnest from './hero/herohomepage/herohomepage';
import Ourmission from './hero/ourmission/ourmission';
import Certificate from './hero/certificates/certificates'; 
import About from './hero/aboutUs/about';
import Faqs from './hero/faqs/Faqs';
import Contact from './hero/contactus/contactus'
import Footer from './components/footer/footer';
import Project from './hero/project/project';
import Curriculum from './hero/cirrculum/curriculum';
import AboutUs from './hero/About-us/about';

function Hero() {
  return (
    <>
      <Navbar />
      <Projectnest />
      <AboutUs/>
      <About />
      <Ourmission />
      <Curriculum />
      {/* <CurriculumTimeline /> */}
      <Project />
      {/* <Certificate /> */}
      <Faqs/>
      <Contact />
      <Footer />
    </>
  );
}

export default Hero;