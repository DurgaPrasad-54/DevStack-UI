import { useState } from 'react';
import RoomAllocationTable from './roomallocation';
import Schedule from '../schedule/studentschedule';
import './RoomAllocationSchedule.css';

const RoomAllocationSchedule = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="room-schedule-main-wrapper">
      <div className="room-schedule-tabs-header">
         <button
          className={`room-schedule-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`room-schedule-tab-btn ${activeTab === 'roomallocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('roomallocation')}
        >
          Room Allocation
        </button>
       
      </div>
      
      <div className="room-schedule-tab-content">
        {activeTab === 'roomallocation' && <RoomAllocationTable />}
        {activeTab === 'schedule' && <Schedule />}
      </div>
    </div>
  );
};

export default RoomAllocationSchedule;
