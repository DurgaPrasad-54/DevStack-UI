import { useState, useEffect } from 'react';
import axios from 'axios';
import './WinnersPage.css';
import config from "../../config";




import {
  TrophyOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,

  CrownOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  InboxOutlined,
  GithubOutlined,
  ThunderboltOutlined } from
'@ant-design/icons';

const WinnersPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [topTeams, setTopTeams] = useState([]);
  const [hackathonDetails, setHackathonDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const API_BASE_URL = config.backendUrl;

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <CrownOutlined className="wp-rank-icon wp-rank-gold" />;
      case 2: return <TrophyOutlined className="wp-rank-icon wp-rank-silver" />;
      case 3: return <TrophyOutlined className="wp-rank-icon wp-rank-bronze" />;
      default: return <TrophyOutlined className="wp-rank-icon" />;
    }
  };

  const getCardColor = (rank) => {
    switch(rank) {
      case 1: return 'linear-gradient(135deg, #1890ff 0%, #003a8c 100%)';
      case 2: return 'linear-gradient(135deg, #52c41a 0%, #237804 100%)';
      case 3: return 'linear-gradient(135deg, #fa8c16 0%, #ad4e00 100%)';
      default: return 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)';
    }
  };

  useEffect(() => {
    fetchAllHackathons();
  }, []);

  const fetchAllHackathons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/winners/all-hackathons`);
      if (response.data.success) {
        const allHackathons = [];
        Object.values(response.data.hackathonsByYear).forEach(yearGroup => {
          allHackathons.push(...yearGroup);
        });
        setHackathons(allHackathons);
        setFilteredHackathons(allHackathons);
      }
    } catch (err) {
      setError('Failed to fetch hackathons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (value) => {
    setSearchQuery(value);
    
    if (value.trim() === '') {
      setFilteredHackathons(hackathons);
      setShowDropdown(true);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/winners/search-hackathons`, {
        params: { query: value },
      });
      if (response.data.success) {
        setFilteredHackathons(response.data.hackathons);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setFilteredHackathons([]);
    }
  };

  const handleSelectHackathon = async (hackathon) => {
    const hackathonId = hackathon._id || hackathon.id;
    if (!hackathonId) {
      setError('Invalid hackathon selected');
      return;
    }

    setSelectedHackathon(hackathon);
    setSearchQuery(hackathon.hackathonname || hackathon.hackathonName || hackathon.name || '');
    setShowDropdown(false);
    setError('');
    
    try {
      setLoading(true);

      const teamsResponse = await axios.get(`${API_BASE_URL}/winners/top-teams/${hackathonId}`);
      if (teamsResponse.data.success) {
        setTopTeams(teamsResponse.data.topTeams);
      }

      const detailsResponse = await axios.get(`${API_BASE_URL}/winners/${hackathonId}/details`);
      if (detailsResponse.data.success) {
        setHackathonDetails(detailsResponse.data.details);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch hackathon details';
      setError(errorMsg);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        hackathonId
      });
      setTopTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedHackathon(null);
    setTopTeams([]);
    setHackathonDetails(null);
    setError('');
    setShowDropdown(false);
    setFilteredHackathons(hackathons);
  };

  return (
    <div className="wp-page-wrapper">
      <div className="wp-page-container">
        {/* Header with Search on Right */}
        <div className="wp-header-search-wrapper">
          <div className="wp-header-content">
            <h1 className="wp-page-title">
              <TrophyOutlined className="wp-title-icon" />
              Top Hackathon Winners
            </h1>
            <p className="wp-page-subtitle">
              {selectedHackathon && hackathonDetails 
                ? `Celebrating our most innovative and talented teams from ${hackathonDetails.hackathonName}` 
                : 'Celebrating our most innovative and talented teams'}
            </p>
          </div>

          {/* Search Section - Right Side */}
          <div className="wp-search-wrapper">
            <div className="wp-search-input-group">
              <div className="wp-search-input-container">
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="wp-search-input"
                />
                <SearchOutlined className="wp-search-icon" />
                
                {showDropdown && filteredHackathons.length > 0 && (
                  <div className="wp-dropdown-menu">
                    {filteredHackathons.map((hackathon) => (
                      <div
                        key={hackathon._id || hackathon.id}
                        onMouseDown={(e) => { e.preventDefault(); handleSelectHackathon(hackathon); }}
                        className={`wp-dropdown-item ${selectedHackathon?._id === (hackathon._id || hackathon.id) ? 'wp-active' : ''}`}
                      >
                        <h4>{hackathon.hackathonname || hackathon.hackathonName || hackathon.name}</h4>
                        <div className="wp-dropdown-meta">
                          <span className="wp-dropdown-tech">{hackathon.technology}</span>
                          <span className="wp-dropdown-year">{hackathon.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedHackathon && (
                <button 
                  onClick={handleClear}
                  className="wp-clear-btn"
                >
                  <CloseCircleOutlined /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="wp-error-message">
            <ExclamationCircleOutlined className="wp-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="wp-loading-container">
            <LoadingOutlined className="wp-spinner-icon" />
            <p className="wp-loading-text">Loading winners data...</p>
          </div>
        )}

        {/* Winners Cards Section */}
        {selectedHackathon && !loading && topTeams.length > 0 && (
          <div className="wp-cards-section">
            <div className="wp-cards-grid">
              {topTeams.slice(0, 3).map((team) => (
                <div 
                  key={team.teamId}
                  className="wp-winner-card"
                >
                  {/* Card Header - Colored Banner */}
                  <div 
                    className="wp-card-header"
                    style={{ background: getCardColor(team.rank) }}
                  >
                    {/* Medal Badge - Top Right */}
                    <div className="wp-medal-badge">
                      {getRankIcon(team.rank)}
                    </div>

                    {/* Rank Circle - Left */}
                    <div className="wp-rank-circle">
                      {team.rank}
                    </div>

                    {/* Team Name - Right */}
                    <h2 className="wp-team-name-header">
                      <TeamOutlined className="wp-team-icon" />
                      {team.teamName}
                    </h2>
                  </div>

                  {/* Card Body - White Section */}
                  <div className="wp-card-body">
                    {/* Event Name */}
                    <p className="wp-event-name">
                      {hackathonDetails?.hackathonName || selectedHackathon.hackathonname}
                    </p>

                    {/* Team Lead */}
                    {team.teamLead && team.teamLead.name !== "N/A" && (
                      <p className="wp-team-lead-name">
                        <UserOutlined className="wp-lead-icon" />
                        <span className="wp-team-lead-label">Lead:</span> {team.teamLead.name}
                      </p>
                    )}

                    {/* Technology Stack */}
                    <div className="wp-tech-stack-box">
                      <div className="wp-tech-stack-header">
                        <ThunderboltOutlined className="wp-tech-icon" />
                        <span className="wp-tech-label">TECHNOLOGY STACK</span>
                      </div>
                      <p className="wp-tech-stack-list">
                        {hackathonDetails?.hackathonTechnology || selectedHackathon.technology}
                      </p>
                    </div>

                    {/* Rank Badge */}
                    <div className={`wp-rank-badge wp-rank-badge-${team.rank}`}>
                      {team.rank === 1 && 'Champion'}
                      {team.rank === 2 && 'Runner-up'}
                      {team.rank === 3 && '3rd Place'}
                    </div>

                    {/* View Code Button */}
                    {(team.githubRepo || team.liveDemoLink) && (
                      <a 
                        href={team.githubRepo || team.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wp-view-code-btn"
                      >
                        <GithubOutlined /> View Code
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend at Bottom */}
            <div className="wp-legend">
              <div className="wp-legend-item">
                <div className="wp-legend-circle wp-gold">1</div>
                <span className="wp-legend-text">Champion</span>
              </div>
              
              <div className="wp-legend-item">
                <div className="wp-legend-circle wp-silver">2</div>
                <span className="wp-legend-text">Runner-up</span>
              </div>
              
              <div className="wp-legend-item">
                <div className="wp-legend-circle wp-bronze">3</div>
                <span className="wp-legend-text">3rd Place</span>
              </div>
            </div>
          </div>
        )}

        {/* No Teams Message */}
        {selectedHackathon && !loading && topTeams.length === 0 && (
          <div className="wp-empty-state">
            <InboxOutlined className="wp-empty-icon" />
            <h3>No Winners Yet</h3>
            <p>Winners will be announced soon for this hackathon</p>
          </div>
        )}

        {/* Initial Empty State */}
        {!selectedHackathon && !loading && hackathons.length > 0 && (
          <div className="wp-empty-state">
            <FileSearchOutlined className="wp-empty-icon" />
            <h3>Search for a Hackathon</h3>
            <p>Select a hackathon from the search dropdown to view the top winners</p>
          </div>
        )}

        {/* No Hackathons State */}
        {hackathons.length === 0 && !loading && (
          <div className="wp-empty-state">
            <InboxOutlined className="wp-empty-icon" />
            <h3>No Hackathons Found</h3>
            <p>There are no hackathons yet. Please check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnersPage;