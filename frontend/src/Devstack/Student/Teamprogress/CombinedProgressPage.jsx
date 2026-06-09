import { useState } from "react";
import { Button } from "antd";
import TeamProgressPage from "./Teamprogess";
import AllTeamsProgressPage from "./TeamsProgress";
import "./ProgressToggle.css";

const CombinedProgressPage = () => {
  const [activePage, setActivePage] = useState("team");

  return (
    <div className="progress-page-wrapper">
      {/* Toggle */}
      <div className="progress-toggle-container">
        <Button
          className={`combine-toggle-btn ${activePage === "team" ? "active" : ""}`}
          onClick={() => setActivePage("team")}
        >
          Team
        </Button>

        <Button
          className={`combine-toggle-btn ${activePage === "teams" ? "active" : ""}`}
          onClick={() => setActivePage("teams")}
        >
          Teams
        </Button>
      </div>

      {/* Content */}
      {activePage === "team" ? <TeamProgressPage /> : <AllTeamsProgressPage />}
    </div>
  );
};

export default CombinedProgressPage;
