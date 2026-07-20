import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

import Dashboard from '../pages/Dashboard';
import RobotControl from '../pages/RobotControl';
import Camera from '../pages/Camera';
import LiDAR from '../pages/LiDAR';
import SLAM from '../pages/SLAM';
import Navigation from '../pages/Navigation';
import Maps from '../pages/Maps';
import AIAssistant from '../pages/AIAssistant';
import BlackBox from '../pages/BlackBox';
import SystemMonitor from '../pages/SystemMonitor';
import Settings from '../pages/Settings';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="control" element={<RobotControl />} />
        <Route path="camera" element={<Camera />} />
        <Route path="lidar" element={<LiDAR />} />
        <Route path="slam" element={<SLAM />} />
        <Route path="navigation" element={<Navigation />} />
        <Route path="maps" element={<Maps />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="black-box" element={<BlackBox />} />
        <Route path="system-monitor" element={<SystemMonitor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
