import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IoLogoGithub, IoClose } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import './project.css';
import config from '../../config';

const API_URL = `${config.backendUrl}`;

const Project = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoading, setImageLoading] = useState({});
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            console.log("Fetching projects...");
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) throw new Error('Failed to fetch projects');

            const data = await response.json();
            console.log("Fetched data:", data);

            // **Preload Images for Faster Display**
            data.forEach((project) => {
                const img = new Image();
                img.src = `${API_URL}/projects/${project._id}/thumbnail`;
            });

            setProjects([...data, ...data]); // Clone for infinite scroll
        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 3000);
        }
    };

    useEffect(() => {
        const container = scrollRef.current;
        let scrollInterval;

        const handleScroll = () => {
            if (container.scrollLeft >= container.scrollWidth / 2) {
                container.style.scrollBehavior = "auto";
                container.scrollLeft = 0;
                container.style.scrollBehavior = "smooth";
            }
        };

        if (!isHovered && container) {
            scrollInterval = setInterval(() => {
                container.scrollLeft += 1;
            }, 20);

            container.addEventListener("scroll", handleScroll);
        }

        return () => {
            clearInterval(scrollInterval);
            container?.removeEventListener("scroll", handleScroll);
        };
    }, [isHovered]);

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        const videoId = url.includes('youtu.be') 
            ? url.split('/').pop()
            : url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    const handleYoutubeClick = (project, e) => {
        e.preventDefault();
        const embedUrl = getYoutubeEmbedUrl(project.youtubeLink);
        if (embedUrl) {
            setSelectedProject({ ...project, embedUrl });
        }
    };

    const handleImageLoad = (id) => {
        setImageLoading((prev) => ({ ...prev, [id]: false }));
    };

    if (loading) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
        </div>
    );

    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <section id='projects'>
            <h1 className="project-titles">Project's</h1>
            <div 
                ref={scrollRef}
                className="project-container"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {projects.map((project) => (
                    <div key={project._id} className="box1">
                        {imageLoading[project._id] !== false && (
                            <div className="image-placeholder loading-animation"></div>
                        )}
                        <img 
                            src={`${API_URL}/projects/${project._id}/thumbnail`}
                            alt={project.title}
                            loading="lazy"
                            onLoad={() => handleImageLoad(project._id)}
                            style={imageLoading[project._id] === false ? {} : { display: 'none' }}
                        />
                        <div className="box2">
                            <h2 className="heading">{project.title}</h2>
                            <p>{project.description}</p>
                            <p className="more-details">For More Details...</p>
                            <div className="our-information">
                                <ul>
                                    {project.githubLink && (
                                        <li>
                                            <a 
                                                href={project.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <IoLogoGithub className='github' />
                                            </a>
                                        </li>
                                    )}
                                    {project.youtubeLink && (
                                        <li>
                                            <a 
                                                href="#"
                                                onClick={(e) => handleYoutubeClick(project, e)}
                                            >
                                                <FaYoutube />
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProject && (
                <div className="youtube-popup">
                    <button 
                        onClick={() => setSelectedProject(null)}
                        className="close-btn"
                        aria-label="Close video"
                    >
                        <IoClose size={24} />
                    </button>
                    <iframe
                        className="youtube-iframe"
                        src={selectedProject.embedUrl}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )} 
        </section>
    );
};

export default Project;
