import { useState, useEffect } from "react";
import Profile from "./github";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./GithubApp.css"; // Importing the CSS file
import loadingAnimation from '../assests/Loading.lottie'; // Update with the correct path to your .lottie file
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import config from '../config';


const Githubapp = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRepos(user);
    }
  }, [user]);

  const fetchRepos = async (username) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      toast.success("Repositories fetched successfully!");
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories!");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${config.backendUrl}/teams/myteam`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Error fetching teams: ${res.status}`);
        }
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Failed to fetch teams!");
      }
    };

    fetchTeams();
  }, []);

  const handleTeamChange = (e) => {
    const teamId = e.target.value;
    const team = teams.find((t) => t._id === teamId);
    setSelectedTeam(team);
    setSelectedStudent(null);
    if (team) toast.info(`Selected team: ${team.name}`);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setUser(extractGithubUsername(student.github));
    toast.success(`Fetching repositories for ${student.name}`);
  };

  const extractGithubUsername = (url) => {
    const match = url.match(/https:\/\/github\.com\/([^\/]+)/);
    return match ? match[1] : url;
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setUser(null);
    setItems([]);
    toast.info("Back to team selection");
  };

  const getAvatarUrl = (githubUrl) => {
    const username = extractGithubUsername(githubUrl);
    return `https://github.com/${username}.png?size=100`;
  };


  return (
    <div className="git-hub-overall">
    <div className="github-container">
      <div className="github-header">
        <select className="github-select-dropdown" onChange={handleTeamChange}>
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
        {selectedStudent && (
          <button onClick={handleBack} className="github-back-button">
            ← Back
          </button>
        )}
      </div>
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <DotLottieReact
            src={loadingAnimation}
            loop
            autoplay
            style={{ width: '300px', height: '300px' }}
          />
        </div>
      ) : selectedStudent ? (
        <div className="repositories-container">
          <h2 className="repo-title">Repositories of {selectedStudent.name}</h2>
          {items.length === 0 ? (
            <p className="no-repos-message">You don't have any repositories on GitHub.</p>
          ) : (
            <div className="repo-grid">
              {items.map((item) => (
                <Profile key={item.id} {...item} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="github-team-container">
          <h1 className="GITHUB-title">GitHub Repository Explorer</h1>
          {selectedTeam && (
            <div className="github-team-section">
              <h2 className="github-team-title">Team Members</h2>
              <div className="github-team-grid">
                {selectedTeam.students.map((student) => (
                  <div
                    key={student._id}
                    className="github-card"
                    onClick={() => handleStudentClick(student)}
                  >
                    <img
                      src={getAvatarUrl(student.github)}
                      alt={`${student.name}'s avatar`}
                      className="github-avatar"
                    />
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.email}</p>
                      {student.rollNo && <p>Roll No: {student.rollNo}</p>}
                      {student.github && (
                        <p>GitHub: {extractGithubUsername(student.github)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
    </div>
  );
};

export default Githubapp;
