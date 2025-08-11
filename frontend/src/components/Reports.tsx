import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Timesheet } from '../types';

interface ReportData {
  name: string;
  totalHours: number;
  projectCount?: number;
  averageHours?: number;
}

const Reports: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [reportType, setReportType] = useState<'user' | 'project'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const timesheets = await apiService.getAdminTimesheets();
      
      setTimesheets(timesheets);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserReport = (): ReportData[] => {
    const userStats = new Map<string, { name: string; hours: number; projects: Set<string> }>();

    timesheets.forEach(ts => {
      const key = ts.user_name || 'Unknown User';
      if (!userStats.has(key)) {
        userStats.set(key, {
          name: ts.user_name || 'Unknown User',
          hours: 0,
          projects: new Set()
        });
      }
      const stats = userStats.get(key)!;
      stats.hours += ts.total_hours;
      if (ts.project_name) stats.projects.add(ts.project_name);
    });

    return Array.from(userStats.values()).map(stat => ({
      name: stat.name,
      totalHours: stat.hours,
      projectCount: stat.projects.size,
      averageHours: stat.hours / stat.projects.size || 0
    })).sort((a, b) => b.totalHours - a.totalHours);
  };

  const generateProjectReport = (): ReportData[] => {
    const projectStats = new Map<string, { name: string; client: string; hours: number; users: Set<string> }>();

    timesheets.forEach(ts => {
      const key = ts.project_name || 'Unknown Project';
      if (!projectStats.has(key)) {
        projectStats.set(key, {
          name: ts.project_name || 'Unknown Project',
          client: ts.client_name || 'Unknown Client',
          hours: 0,
          users: new Set()
        });
      }
      const stats = projectStats.get(key)!;
      stats.hours += ts.total_hours;
      if (ts.user_name) stats.users.add(ts.user_name);
    });

    return Array.from(projectStats.values()).map(stat => ({
      name: `${stat.name} (${stat.client})`,
      totalHours: stat.hours,
      projectCount: stat.users.size, // Using projectCount field for user count
      averageHours: stat.hours / stat.users.size || 0
    })).sort((a, b) => b.totalHours - a.totalHours);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const reportData = reportType === 'user' ? generateUserReport() : generateProjectReport();
  const totalHours = reportData.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-sm text-gray-600">Generate detailed reports by user or project</p>
          </div>

          <div className="mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Report Type:</label>
                <select
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'user' | 'project')}
                >
                  <option value="user">By User</option>
                  <option value="project">By Project</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Hours</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalHours}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {reportType === 'user' ? 'Users' : 'Projects'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{reportData.length}</dd>
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
                      <span className="text-white font-bold">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Hours</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {reportData.length > 0 ? (totalHours / reportData.length).toFixed(1) : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reportType === 'user' ? 'User Performance Report' : 'Project Hours Report'}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {reportType === 'user' ? 'User' : 'Project'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {reportType === 'user' ? 'Projects Count' : 'Team Size'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Hours per {reportType === 'user' ? 'Project' : 'Person'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item, index) => {
                      const percentage = totalHours > 0 ? ((item.totalHours / totalHours) * 100).toFixed(1) : 0;
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.totalHours}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.projectCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.averageHours?.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              {percentage}%
                            </div>
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
      </div>
    </div>
  );
};

export default Reports;