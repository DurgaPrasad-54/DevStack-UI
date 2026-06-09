import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';
import './mentor.css';

const MentorTeams = () => {
    const [availableTeams, setAvailableTeams] = useState([]);
    const [mentoredTeams, setMentoredTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('myTeams');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAvailableTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.backendUrl}/mentor/available-teams`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            setAvailableTeams(data.teams);
        } catch (err) {
            setError('Failed to fetch available teams');
            console.error(err);
            toast.error('Failed to fetch available teams');
        } finally {
            setLoading(false);
        }
    };

    const fetchMentoredTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.backendUrl}/mentor/my-mentored-teams`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            setMentoredTeams(data.teams);
        } catch (err) {
            setError('Failed to fetch mentored teams');
            console.error(err);
            toast.error('Failed to fetch mentored teams');
        } finally {
            setLoading(false);
        }
    };

    const assignTeam = async (teamId) => {
        try {
            setLoading(true);
            const response = await fetch(`${config.backendUrl}/mentor/assign-team/${teamId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            await fetchAvailableTeams();
            await fetchMentoredTeams();
            
            // Replace alert with toast notification
            toast.success('Successfully assigned as mentor!');
        } catch (err) {
            setError('Failed to assign team');
            console.error(err);
            toast.error('Failed to assign team');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableTeams();
        fetchMentoredTeams();
    }, []);

    const filteredTeams = activeView === 'available' ? availableTeams.filter(team => team.name.toLowerCase().includes(searchTerm.toLowerCase())) : mentoredTeams.filter(team => team.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="mentor-container">
            {/* Add ToastContainer component */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

<div className='mentor-search-bar'>
            <input 
                type="text" 
                placeholder="Search teams by Team Names..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="team-search-bar"
            />
            </div>
            
            <div className="mentor-tabs">
                <button className={activeView === 'myTeams' ? 'active' : ''} onClick={() => setActiveView('myTeams')}>
                    My Teams
                </button>
                <button className={activeView === 'available' ? 'active' : ''} onClick={() => setActiveView('available')}>
                    Teams Without Mentor
                </button>
            </div>
            

            {loading && <div className="loading-spinner"></div>}

            {!loading && (
                <div className="team-list">
                    <h2>{activeView === 'available' ? 'Available Teams' : 'My Mentored Teams'}</h2>
                    {filteredTeams.length === 0 ? (
                        <p>No teams found</p>
                    ) : (
                        filteredTeams.map(team => (
                            <div key={team.id} className="team-card">
                                <div className="team-headers">
                                    <h3>{team.name}</h3>
                                    {activeView === 'available' && (
                                        <button onClick={() => assignTeam(team.id)} className="assign-btn">
                                            Assign Me
                                        </button>
                                    )}
                                </div>
                                <div className="team-detailss">
                                    <div><strong>Team Lead:</strong> {team.teamLead?.name || 'No team lead assigned'}</div>
                                    <div>
                                        <strong>Members:</strong>
                                        {team.members.map(member => (
                                            <div key={member._id}>{member.name} ({member.rollNo})</div>
                                        ))}
                                    </div>
                                    {activeView === 'available' && <div><strong>Vacancies:</strong> {team.vacancies}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MentorTeams;