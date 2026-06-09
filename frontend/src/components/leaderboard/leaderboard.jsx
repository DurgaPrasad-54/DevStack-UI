import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './leaderboard.css';
import firstPlace from '../../assests/1stplace.png';
import secondPlace from '../../assests/2ndplace.png';
import thirdPlace from '../../assests/3rdplace.png';
import config from '../../config';

// Format time from minutes to hours and minutes
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const LeaderboardComponent = () => {
  const [leaderboardType, setLeaderboardType] = useState('marks'); // 'marks' or 'time'
  const [marksData, setMarksData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch marks data
        const marksResponse = await axios.post(
          `${config.backendUrl}/api/reports/get-total-marks-all-students`, 
          {}, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (marksResponse.data.success) {
          const sortedMarksData = marksResponse.data.data
            .filter(user => user.totalMarks > 0)
            .sort((a, b) => b.totalMarks - a.totalMarks);
          setMarksData(sortedMarksData);
        }

        // Fetch active time data
        const timeResponse = await axios.get(`${config.backendUrl}/activetime/active-times`);
        if (timeResponse.data && timeResponse.data.data) {
          const sortedTimeData = timeResponse.data.data
            .filter(item => item.studentId && item.studentId.name && item.activeTime > 0) // Filter out invalid entries
            .map(item => ({
              name: item.studentId.name,
              activeTime: item.activeTime,
              _id: item.studentId._id
            }))
            .sort((a, b) => b.activeTime - a.activeTime);
          
          console.log('Processed Time Data:', sortedTimeData);
          setTimeData(sortedTimeData);
        } else {
          console.error('Invalid time response structure:', timeResponse.data);
          setTimeData([]);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        // Set empty arrays on error
        setTimeData([]);
        setMarksData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

 // Get current data based on selected type
  const currentData = leaderboardType === 'marks' ? marksData : timeData;

  // Filter data based on search query
  const filteredData = currentData.filter(user => {
    const name = leaderboardType === 'marks' ? user.student.name : user.name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-container">
        <div className="leaderboard-header sticky-header">

         {/* Toggle stays on the left */}
        <div>
          <div className="toggle-container">
            <button 
              className={`toggle-btn ${leaderboardType === 'marks' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('marks')}
            >
              Total Points
            </button>
            <button 
              className={`toggle-btn ${leaderboardType === 'time' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('time')}
            >
              Active Time
            </button>
          </div>
        </div>
        {/* Search bar on the right */}
        <div className="search-bar-container" style={{ marginBottom: "0", marginLeft: "16px" }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="leaderboard-search-bar"
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              minWidth: "220px"
            }}
          />
        </div>
      </div>
      {/* ...rest of your code... */}
        {/* Podium Section */}
        <div className="podium-section">
          {[1, 0, 2].map((pos, index) => {
            const user = filteredData[pos];
            const value = leaderboardType === 'marks' 
              ? user?.totalMarks 
              : user?.activeTime;
            const displayValue = leaderboardType === 'marks'
              ? (value ? `${value} Pts` : '--')
              : (value ? formatTime(value) : '--');
            const name = leaderboardType === 'marks'
              ? user?.student?.name
              : user?.name;
              
            return (
              <div key={index} className={`podium-spot ${['second-place', 'first-place', 'third-place'][index]}`}>
                <div className="avatar-container">
                  <img 
                    src={[secondPlace, firstPlace, thirdPlace][index]} 
                    alt={`Position ${index + 1}`} 
                    className="position-icon"
                  />
                  {user && <span className="user-name">{name}</span>}
                </div>
                <div className={`podium-platform ${['second', 'first', 'third'][index]}`}>
                  <span className="place-text">{['2nd', '1st', '3rd'][index]}</span>
                  <span className="points-text">{displayValue}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Table Section with Fixed Header */}
        <div className="table-container-wrapper">
          <div className="table-header">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>Name</th>
                  <th>{leaderboardType === 'marks' ? 'Total Points' : 'Active Time'}</th>
                </tr>
              </thead>
            </table>
          </div>
          
          <div className="table-body-container">
            <table className="leaderboard-table">
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="shimmer-row">
                      <td><div className="shimmer-animation"></div></td>
                      <td><div className="shimmer-animation"></div></td>
                      <td><div className="shimmer-animation"></div></td>
                    </tr>
                  ))
                ) : (
                  filteredData.map((user, index) => {
                    const name = leaderboardType === 'marks' ? user.student.name : user.name;
                    const value = leaderboardType === 'marks' 
                      ? user.totalMarks 
                      : formatTime(user.activeTime);
                      
                    return (
                      <tr key={leaderboardType === 'marks' ? user.student._id : user._id} className="fade-in">
                        <td>{index + 1}</td>
                        <td className="name-cell">{name}</td>
                        <td>{value}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardComponent;