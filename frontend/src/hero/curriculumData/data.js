import React from "react";
import { FaLaptopCode,FaBullhorn } from "react-icons/fa";
import { RiCalendarCheckLine } from "react-icons/ri";
import { FaRegHandshake } from "react-icons/fa6";
import { HiOutlineRocketLaunch } from "react-icons/hi2";
import { FaRegComments } from "react-icons/fa";
import { TbCertificate } from "react-icons/tb";


export const experiencesData = [
  {
    title: "Introduction and Orientation",
    description: "Welcome to the DevOrbit Program! Introduction to mentors, team members, and program expectations. Overview of the tools and resources available to participants.",
    icon: React.createElement(RiCalendarCheckLine),
    date: "Week - 1",
  },
  {
    title: "Foundational Technologies",
    description: "Deep dive into core technologies relevant to DevOrbit. Learn essential libraries and frameworks for efficient development.",
    icon: React.createElement(FaRegHandshake),
    date: "Week - 2",
  },
  {
    title: " Core Concepts and Principles",
    description: "Explore key concepts and principles of DevRel and DevOrbit. Understand the importance of building strong developer communities.",
    icon: React.createElement(HiOutlineRocketLaunch),
    date: "Week - 3",
  },
  {
    title: " Practical Application: Coding Exercises",
    description: "Practice coding skills through a series of exercises. Apply learned technologies to real-world scenarios.",
    icon: React.createElement(FaLaptopCode),
    date: "Week - 4",
  },
  {
    title: "Mini-Project 1: Community Building",
    description: "Initiate a small-scale community project. Build a basic community platform or organize a small event.",
    icon: React.createElement(FaRegComments),
    date: "Week - 5",
  },
  {
    title: " Advanced Topics and Best Practices",
    description: "Delve into advanced DevRel techniques and strategies. Learn best practices for content creation, community management, and developer advocacy.",
    icon: React.createElement(TbCertificate),
    date: "Week - 6",
  },
  {
    title: " Mini-Project 2: DevRel Campaign",
    description: "Plan and execute a mini-DevRel campaign. Create a targeted campaign to engage developers and drive adoption.",
    icon: React.createElement(FaBullhorn),
    date: "Week - 7",
  }
];