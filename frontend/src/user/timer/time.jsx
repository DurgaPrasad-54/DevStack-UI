import { useState, useEffect } from "react";
import config from '../../config';

const UserActiveTimer = () => {
  const [activeTime, setActiveTime] = useState(() => {
    return parseInt(localStorage.getItem("activeTime")) || 0;
  });

  const [minuteCounter, setMinuteCounter] = useState(() => {
    return parseInt(localStorage.getItem("minuteCounter")) || 0;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let interval, sendInterval;

    const updateActivity = () => {
      setLastActive(Date.now());
      if (isPaused) setIsPaused(false);
    };

    const sendTimeToServer = async () => {
      if (isSending) return; // Prevent multiple simultaneous requests
      
      try {
        setIsSending(true);
        const studentId = localStorage.getItem("student");
        if (!studentId) {
          console.error("❌ No studentId found in localStorage");
          setIsSending(false);
          return;
        }

        console.log(`⏳ Sending Active Time: 5 minutes`);

        const response = await fetch(`${config.backendUrl}/activetime/active-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, activeTime: 5 }),
        });

        const data = await response.json();
        console.log("✅ Server Response:", data);

        if (!response.ok) {
          console.error(`❌ Error ${response.status}: ${data.message}`);
        } else {
          setMinuteCounter(0); // Reset counter after successful send
          localStorage.setItem("minuteCounter", 0);
        }
      } catch (error) {
        console.error("❌ Fetch Error:", error);
      } finally {
        setIsSending(false);
      }
    };

    const startTimer = () => {
      interval = setInterval(() => {
        if (!isPaused) {
          setActiveTime((prev) => {
            const updatedTime = prev + 1;
            localStorage.setItem("activeTime", updatedTime);
            return updatedTime;
          });

          setMinuteCounter((prev) => {
            const updatedCounter = prev + 1;
            localStorage.setItem("minuteCounter", updatedCounter);
            
            // Check if we've hit 5 minutes (300 seconds) exactly
            if (updatedCounter === 300 && !isSending) {
              sendTimeToServer();
            }
            
            return updatedCounter;
          });
        }
      }, 1000);
    };

    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    startTimer();

    const inactivityChecker = setInterval(() => {
      if (Date.now() - lastActive > 30000) setIsPaused(true);
    }, 1000);

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("mousedown", updateActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      clearInterval(inactivityChecker);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("mousedown", updateActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPaused, lastActive, minuteCounter, isSending]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

    // return (
    //   <div style={{ textAlign: "center", fontSize: "20px", marginTop: "20px" }}>
    //     <h2>Active Time: {formatTime(activeTime)}</h2>
    //     {isPaused && <p style={{ color: "red" }}>Paused due to inactivity</p>}
    //     {isSending && <p style={{ color: "blue" }}>Sending activity data...</p>}
    //   </div>
    // );
};

export default UserActiveTimer;