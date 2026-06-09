"use client";

import React, { useState } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { experiencesData } from "../curriculumData/data";
import { useSectionInView } from "../curriculumData/hooks";
import styles from './curriculum.module.css';

export default function Curriculum() {
  const { ref } = useSectionInView("Education");
  const [visibleCount, setVisibleCount] = useState(4); // Initially show 4 cards

  const handleReadMore = () => {
    setVisibleCount(prevCount => prevCount + 2); // Show 2 more cards on button click
  };

  return (
    <section id="curriculum" ref={ref} className={styles.curriculumSection}>
      <h1 className={styles.heading}>Curriculum</h1>

      <VerticalTimeline lineColor="#e5e7eb">
        {experiencesData.slice(0, visibleCount).map((item, index) => (
          <React.Fragment key={index}>
            <VerticalTimelineElement
              contentStyle={{
                background: "rgb(243, 244, 246)",
                boxShadow: "none",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                textAlign: "left",
                padding: "1.3rem 2rem",
              }}
              contentArrowStyle={{
                borderRight: "0.4rem solid #9ca3af",
              }}
              date={item.date}
              icon={item.icon}
              iconStyle={{
                background: "white",
                fontSize: "1.5rem",
              }}
            >
              <h3 className={styles.timelineTitle}>{item.title}</h3>
              <p className={styles.timelineLocation}>{item.location}</p>
              <p className={styles.timelineDescription}>
                {item.description}
              </p>
            </VerticalTimelineElement>
          </React.Fragment>
        ))}
      </VerticalTimeline>

      <div className={styles.btn}>
        {visibleCount < experiencesData.length && (
          <button onClick={handleReadMore} className={styles.readMoreButton}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Read More
          </button>
        )}
      </div>
    </section>
  );
}