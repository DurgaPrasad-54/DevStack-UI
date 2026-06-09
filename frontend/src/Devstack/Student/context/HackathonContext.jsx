import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../../config';

const HackathonContext = createContext();

export const HackathonProvider = ({ children }) => {
  const studentId = localStorage.getItem('student');
  const [currentHackathonId, setCurrentHackathonId] = useState(localStorage.getItem('selectedHackathonId') || null);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch server-approved ongoing hackathon for the student and keep in sync
  useEffect(() => {
    const fetchApprovedHackathon = async () => {
      setLoading(true);
      try {
        if (!studentId) {
          setHackathon(null);
          setCurrentHackathonId(null);
          localStorage.removeItem('selectedHackathonId');
          setLoading(false);
          return;
        }

        const { data } = await axios.get(`${config.backendUrl}/hackreg/student/${studentId}/ongoing-approved`);
        if (data?.hackathon) {
          const hackId = data.hackathon._id;
          setCurrentHackathonId(hackId);
          localStorage.setItem('selectedHackathonId', hackId);
          setHackathon(data.hackathon);
        } else {
          setCurrentHackathonId(null);
          localStorage.removeItem('selectedHackathonId');
          setHackathon(null);
        }
      } catch (err) {
        console.error('HackathonProvider: failed to fetch approved hackathon', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedHackathon();
  }, [studentId]);

  // Allow manual override (e.g., admin selection) and fetch details
  const setSelectedHackathon = async (hackId) => {
    if (!hackId) {
      setCurrentHackathonId(null);
      setHackathon(null);
      localStorage.removeItem('selectedHackathonId');
      return;
    }

    try {
      const resp = await axios.get(`${config.backendUrl}/hackathon/${hackId}`);
      setCurrentHackathonId(hackId);
      setHackathon(resp.data.hackathon || resp.data);
      localStorage.setItem('selectedHackathonId', hackId);
    } catch (err) {
      console.error('Failed to fetch hackathon details for id', hackId, err);
    }
  };

  return (
    <HackathonContext.Provider value={{ currentHackathonId, hackathon, loading, setSelectedHackathon }}>
      {children}
    </HackathonContext.Provider>
  );
};

export const useHackathon = () => useContext(HackathonContext) || {};
export default HackathonContext;