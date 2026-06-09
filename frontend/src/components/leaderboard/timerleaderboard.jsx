import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './leaderboard.css';
import firstPlace from '../../assests/1stplace.png';
import secondPlace from '../../assests/2ndplace.png';
import thirdPlace from '../../assests/3rdplace.png';
import config from '../../config';


// Convert minutes into hours and minutes format
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const LeaderboardComponent = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/activetime/active-times`);
        const sortedData = response.data.data
          .map(item => ({
            name: item.studentId.name,
            activeTime: item.activeTime,
          }))
          .sort((a, b) => b.activeTime - a.activeTime); // Sort in descending order

        setLeaderboardData(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>

      {/* Podium Section */}
      <div className="podium-section">
        {[1, 0, 2].map((pos, index) => (
          <div key={index} className={`podium-spot ${['second-place', 'first-place', 'third-place'][index]}`}>
            <img src={[secondPlace, firstPlace, thirdPlace][index]} alt={`User ${pos + 1}`} className="avatar-container" />
            <div className="avatar-container shimmer"></div>
            <div className={`podium-platform ${['second', 'first', 'third'][index]} shimmer`}>
              <span className="place-text">{['2nd', '1st', '3rd'][index]}</span>
              <span className="points-text">
                {leaderboardData[pos] ? formatTime(leaderboardData[pos].activeTime) : '--'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Name</th>
              <th>Active Time</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="shimmer-row">
                    <td><div className="shimmer-animation"></div></td>
                    <td><div className="shimmer-animation"></div></td>
                    <td><div className="shimmer-animation"></div></td>
                  </tr>
                ))
              : leaderboardData.map((user, index) => (
                  <tr key={index} className="fade-in">
                    <td>{index + 1}</td>
                    <td className="name-cell">{user.name}</td>
                    <td>{formatTime(user.activeTime)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
