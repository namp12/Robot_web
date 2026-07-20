import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import robotService from '../services/robot.service';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [robotStatus, setRobotStatus] = useState('ONLINE');

  const handleEmergencyStop = async () => {
    try {
      await robotService.emergencyStop();
      setRobotStatus('EMERGENCY_STOP');
      alert('⚠️ EMERGENCY STOP ACTIVATED!');
    } catch (err) {
      console.error('Failed to send E-STOP', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          robotStatus={robotStatus}
          isConnected={true}
          onEmergencyStop={handleEmergencyStop}
        />

        {/* Page Content View */}
        <main
          className={`flex-1 transition-all duration-300 pt-20 px-6 pb-8 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
