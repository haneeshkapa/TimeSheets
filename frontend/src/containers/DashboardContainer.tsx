import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardComponent from '../components/Dashboard';
import { apiService } from '../services';
import { Project, Timesheet } from '../types';
import { getWeekStart } from '../utils';

const DashboardContainer: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentWeekStart = getWeekStart(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projectsData, timesheetsData] = await Promise.all([
          apiService.getUserProjects(),
          apiService.getUserTimesheets(currentWeekStart),
        ]);
        
        setProjects(projectsData);
        setTimesheets(timesheetsData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, currentWeekStart]);

  const getTotalHoursThisWeek = () => {
    return timesheets.reduce((total, timesheet) => total + timesheet.total_hours, 0);
  };

  const getActiveProjects = () => {
    return projects.length;
  };

  const getCompletedTimesheets = () => {
    return timesheets.filter(t => t.status === 'completed').length;
  };

  const handleCompleteProject = async (projectId: number) => {
    try {
      await apiService.completeProject(projectId);
      // Refresh projects list after completion
      const updatedProjects = await apiService.getUserProjects();
      setProjects(updatedProjects);
      alert('Project completed successfully!');
    } catch (err) {
      console.error('Failed to complete project:', err);
      alert('Failed to complete project. Please try again.');
    }
  };

  return (
    <DashboardComponent
      user={user}
      projects={projects}
      timesheets={timesheets}
      loading={loading}
      error={error}
      stats={{
        totalHoursThisWeek: getTotalHoursThisWeek(),
        activeProjects: getActiveProjects(),
        completedTimesheets: getCompletedTimesheets(),
      }}
      onCompleteProject={handleCompleteProject}
    />
  );
};

export default DashboardContainer;