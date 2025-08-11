import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: number;
  client_name: string;
  project_name: string;
  work_type: string;
  location: string;
}

interface TimeEntry {
  id?: number;
  project_id: number;
  date: string;
  clock_in: string;
  clock_out?: string;
  duration?: number; // in minutes
  status: string; // 'active' or 'completed'
}


const TimesheetEntry: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntries, setActiveEntries] = useState<Record<number, TimeEntry>>({});
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };


  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const projects = await apiService.getUserProjects();
      setProjects(projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  const fetchTimeEntries = useCallback(async (weekStart: string) => {
    try {
      // Fetch active entries from backend
      const activeEntriesData = await apiService.getActiveEntries();
      const activeEntriesMap: Record<number, TimeEntry> = {};
      activeEntriesData.forEach((entry: any) => {
        activeEntriesMap[entry.project_id] = {
          id: entry.id,
          project_id: entry.project_id,
          date: entry.date,
          clock_in: entry.clock_in,
          status: entry.status
        };
      });
      setActiveEntries(activeEntriesMap);

      // Fetch completed time entries for the week from backend
      const timeEntriesData = await apiService.getTimeEntries();
      const completedEntries = timeEntriesData
        .filter((entry: any) => entry.status === 'completed')
        .map((entry: any) => ({
          id: entry.id,
          project_id: entry.project_id,
          date: entry.date,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          duration: entry.duration,
          status: entry.status
        }));
      setTimeEntries(completedEntries);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      // Fallback to localStorage for offline functionality
      const storedActiveEntries = localStorage.getItem(`activeEntries_${user?.id}`);
      if (storedActiveEntries) {
        setActiveEntries(JSON.parse(storedActiveEntries));
      }
      const storedTimeEntries = localStorage.getItem(`timeEntries_${user?.id}_${weekStart}`);
      if (storedTimeEntries) {
        setTimeEntries(JSON.parse(storedTimeEntries));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const monday = getMonday(new Date());
    const weekStart = formatDate(monday);
    setCurrentWeek(weekStart);
    
    fetchProjects();
    fetchTimeEntries(weekStart);
  }, [fetchProjects, fetchTimeEntries]);

  const clockIn = async (projectId: number) => {
    try {
      const response = await apiService.clockIn(projectId);
      
      // Update local state with the entry from backend
      const entry: TimeEntry = {
        id: response.entry.id,
        project_id: response.entry.project_id,
        date: response.entry.date,
        clock_in: response.entry.clock_in,
        status: response.entry.status
      };

      const newActiveEntries = {
        ...activeEntries,
        [projectId]: entry
      };
      setActiveEntries(newActiveEntries);

      // Keep localStorage as backup
      localStorage.setItem(`activeEntries_${user?.id}`, JSON.stringify(newActiveEntries));
      
      console.log('Successfully clocked in to backend:', response.message);
    } catch (error) {
      console.error('Failed to clock in:', error);
      alert('Failed to clock in. Please try again.');
    }
  };

  const clockOut = async (projectId: number) => {
    try {
      const activeEntry = activeEntries[projectId];
      if (!activeEntry || !activeEntry.id) {
        alert('No active session found for this project.');
        return;
      }

      const response = await apiService.clockOut(activeEntry.id);
      
      // Update local state with the completed entry from backend
      const completedEntry: TimeEntry = {
        id: response.entry.id,
        project_id: response.entry.project_id,
        date: response.entry.date,
        clock_in: response.entry.clock_in,
        clock_out: response.entry.clock_out,
        duration: response.entry.duration,
        status: response.entry.status
      };

      // Move from active to completed entries
      const newActiveEntries = { ...activeEntries };
      delete newActiveEntries[projectId];
      setActiveEntries(newActiveEntries);

      // Update localStorage for active entries
      localStorage.setItem(`activeEntries_${user?.id}`, JSON.stringify(newActiveEntries));

      // Update time entries
      const newTimeEntries = [...timeEntries, completedEntry];
      setTimeEntries(newTimeEntries);
      localStorage.setItem(`timeEntries_${user?.id}_${currentWeek}`, JSON.stringify(newTimeEntries));

      console.log('Successfully clocked out from backend:', response.message);
      
      // Convert to existing timesheet format and save
      await saveToTimesheet(completedEntry);
    } catch (error) {
      console.error('Failed to clock out:', error);
      alert('Failed to clock out. Please try again.');
    }
  };

  const saveToTimesheet = async (entry: TimeEntry) => {
    if (!entry.duration) return;

    try {
      setSaving(true);
      const hours = entry.duration / 60;
      const date = new Date(entry.date);
      const dayName = date.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
      
      const hoursData = {
        sunday: dayName === 'sunday' ? hours : 0,
        monday: dayName === 'monday' ? hours : 0,
        tuesday: dayName === 'tuesday' ? hours : 0,
        wednesday: dayName === 'wednesday' ? hours : 0,
        thursday: dayName === 'thursday' ? hours : 0,
        friday: dayName === 'friday' ? hours : 0,
        saturday: dayName === 'saturday' ? hours : 0,
      };

      await apiService.saveTimesheet(entry.project_id, currentWeek, hoursData);
    } catch (error) {
      console.error('Failed to save timesheet:', error);
    } finally {
      setSaving(false);
    }
  };

  const getActiveTime = (projectId: number) => {
    const entry = activeEntries[projectId];
    if (!entry) return 0;

    // Handle both formats: full datetime string or just time
    let clockInTime: Date;
    if (entry.clock_in.includes('T') || entry.clock_in.includes('Z')) {
      // Full datetime string from backend
      clockInTime = new Date(entry.clock_in);
    } else {
      // Time-only format, combine with date
      clockInTime = new Date(`${entry.date}T${entry.clock_in}`);
    }
    
    const now = currentTime;
    const diffMs = now.getTime() - clockInTime.getTime();
    return Math.floor(diffMs / (1000 * 60));
  };

  const getTodayEntries = () => {
    const today = formatDate(new Date());
    return timeEntries.filter(entry => entry.date === today);
  };

  const getWeekTotal = () => {
    return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  const getTodayTotal = () => {
    const todayEntries = getTodayEntries();
    const completedMinutes = todayEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
    const activeMinutes = Object.values(activeEntries).reduce((total, entry) => {
      return total + getActiveTime(entry.project_id);
    }, 0);
    return completedMinutes + activeMinutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Time Clock</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Week of {new Date(currentWeek).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Time</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatDuration(getTodayTotal())}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Week Total</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatDuration(getWeekTotal())}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">⏰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.keys(activeEntries).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-4">
            {projects.map((project) => {
              const isActive = activeEntries[project.id];
              const activeMinutes = isActive ? getActiveTime(project.id) : 0;
              
              return (
                <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="text-white">
                        <h3 className="text-lg font-semibold">{project.project_name}</h3>
                        <p className="text-blue-100">{project.client_name} • {project.work_type} • {project.location}</p>
                      </div>
                      <div className="text-white text-right">
                        {isActive ? (
                          <div className="text-2xl font-bold animate-pulse">
                            {formatDuration(activeMinutes)}
                          </div>
                        ) : (
                          <div className="text-2xl font-bold">--:--</div>
                        )}
                        <div className="text-sm text-blue-100">
                          {isActive ? 'Active' : 'Stopped'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        {isActive ? (
                          <>
                            <div className="text-sm text-gray-600">
                              Started at {new Date(isActive.clock_in).toLocaleTimeString()} • {formatDuration(activeMinutes)} elapsed
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Ready to start
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        {isActive ? (
                          <button
                            onClick={() => clockOut(project.id)}
                            disabled={saving}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 flex items-center space-x-2"
                          >
                            <span>⏹️</span>
                            <span>Clock Out</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => clockIn(project.id)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 flex items-center space-x-2"
                          >
                            <span>▶️</span>
                            <span>Clock In</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Time Entries */}
          {getTodayEntries().length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Time Entries</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clock In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clock Out
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getTodayEntries().map((entry, index) => {
                          const project = projects.find(p => p.id === entry.project_id);
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {project?.project_name} ({project?.client_name})
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.clock_in}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.clock_out || '--'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.duration ? formatDuration(entry.duration) : '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <div className="text-lg">No projects assigned</div>
                <div className="text-sm mt-2">Contact your administrator to get assigned to projects</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimesheetEntry;