import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import './faqs.css';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={onClick}>
        {question}
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="faq-answer">{answer}</div>}
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      question: "What is the Dev-Orbit?",
      answer: "Dev Orbit is a platform designed for developers to enhance their coding skills, collaborate with others, and stay up-to-date with the latest trends in technology. It offers a range of resources such as coding challenges, tutorials, community-driven discussions, and opportunities to connect with other developers. Whether you’re a beginner or an experienced professional, Dev Orbit provides a space to grow, learn, and contribute to the tech community. It aims to create an ecosystem where developers can share knowledge, solve problems, and improve their coding proficiency."
    },
    {
      question: "Can I collaborate with other developers on Dev Orbit?",
      answer: "Yes, Dev Orbit encourages collaboration through features like community forums, pair programming sessions, and group challenges. You can join teams for specific tasks or work on open-source projects to gain practical experience and share knowledge with peers."
    },
    {
      question: "Is there a community forum for developers to ask questions and share ideas?",
      answer: "Absolutely! Dev Orbit has an active community forum where developers can ask questions, share coding tips, discuss challenges, and collaborate on projects. The forum is a great place to seek advice, get feedback on your code, or explore new technologies with others."
    },
    {
      question: "Are there any certifications available after completing challenges?",
      answer: "Yes, Dev Orbit offers certifications for successfully completing certain coding challenges or courses. These certificates can be shared on your LinkedIn profile or added to your portfolio to showcase your skills to potential employers."
    },
    {
      question: "What programming languages are supported on Dev Orbit?",
      answer: "Dev Orbit supports a wide range of programming languages, including Python, Java, C++, C. You can choose your preferred language for coding challenges and even filter challenges based on the language you wish to practice."
    }
  ];

  const handleItemClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <h1 className='faqh1'>FREQUENTLY ASKED QUESTIONS</h1>
      {faqData.map((item, index) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onClick={() => handleItemClick(index)}
        />
      ))}
    </div>
  );
};

export default FAQ;