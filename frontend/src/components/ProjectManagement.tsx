import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Project {
  id: number;
  client_name: string;
  project_name: string;
  work_type: string;
  location: string;
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'client_name' | 'work_type' | 'location'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [newProject, setNewProject] = useState({
    client_name: '',
    project_name: '',
    work_type: '',
    location: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.work_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all' && filterValue) {
      filtered = filtered.filter(project =>
        project[filterBy].toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterBy, filterValue]);

  const fetchProjects = async () => {
    try {
      const projects = await apiService.getProjects();
      setProjects(projects);
      setFilteredProjects(projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createProject(newProject);
      setNewProject({ client_name: '', project_name: '', work_type: '', location: '' });
      setShowAddProject(false);
      fetchProjects();
      alert('Project added successfully!');
    } catch (error) {
      console.error('Failed to add project:', error);
      alert('Failed to add project. Please try again.');
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      await apiService.updateProject(editingProject.id, {
        client_name: newProject.client_name,
        project_name: newProject.project_name,
        work_type: newProject.work_type,
        location: newProject.location
      });
      
      setEditingProject(null);
      setNewProject({ client_name: '', project_name: '', work_type: '', location: '' });
      setShowAddProject(false);
      fetchProjects(); // Refresh the list
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiService.deleteProject(projectId);
        fetchProjects(); // Refresh the list
        alert('Project deleted successfully!');
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      client_name: project.client_name,
      project_name: project.project_name,
      work_type: project.work_type,
      location: project.location
    });
    setShowAddProject(true);
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) {
      alert('Please select projects to delete.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedProjects.size} selected project(s)?`)) {
      try {
        const projectIds = Array.from(selectedProjects);
        const deletePromises = projectIds.map(id => apiService.deleteProject(id));
        
        await Promise.all(deletePromises);
        
        setSelectedProjects(new Set());
        fetchProjects(); // Refresh the list
        alert(`${projectIds.length} project(s) deleted successfully!`);
      } catch (error) {
        console.error('Failed to delete projects:', error);
        alert('Failed to delete projects. Please try again.');
      }
    }
  };

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  // Get unique values for filter options
  const getUniqueValues = (field: keyof Project) => {
    const uniqueSet = new Set(projects.map(p => p[field]));
    return Array.from(uniqueSet).filter(Boolean);
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="mt-2 text-sm text-gray-600">Manage projects and assignments</p>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Total: {projects.length} projects | Showing: {filteredProjects.length} projects
              </div>
              <div className="text-sm text-gray-500">
                {selectedProjects.size > 0 && `${selectedProjects.size} selected`}
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter By</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filterBy}
                  onChange={(e) => {
                    setFilterBy(e.target.value as any);
                    setFilterValue('');
                  }}
                >
                  <option value="all">All Projects</option>
                  <option value="client_name">Client</option>
                  <option value="work_type">Work Type</option>
                  <option value="location">Location</option>
                </select>
              </div>

              {/* Filter Value */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter Value</label>
                {filterBy === 'all' ? (
                  <input
                    type="text"
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    placeholder="Select filter type first"
                  />
                ) : (
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">All {filterBy.replace('_', ' ')}</option>
                    {getUniqueValues(filterBy).map((value, index) => (
                      <option key={index} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                    setFilterValue('');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingProject(null);
                setNewProject({ client_name: '', project_name: '', work_type: '', location: '' });
                setShowAddProject(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <span>➕</span> Add Project
            </button>
            
            {selectedProjects.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <span>🗑️</span> Delete Selected ({selectedProjects.size})
              </button>
            )}
            
            <button
              onClick={() => window.print()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <span>🖨️</span> Export/Print
            </button>
          </div>

          {showAddProject && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingProject ? 'Edit Project' : 'Add New Project'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddProject(false);
                        setEditingProject(null);
                        setNewProject({ client_name: '', project_name: '', work_type: '', location: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={editingProject ? handleEditProject : handleAddProject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Name</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newProject.client_name}
                        onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newProject.project_name}
                        onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Work Type</label>
                      <select
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newProject.work_type}
                        onChange={(e) => setNewProject({...newProject, work_type: e.target.value})}
                      >
                        <option value="">Select Work Type</option>
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Testing">Testing</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Support">Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <select
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newProject.location}
                        onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                      >
                        <option value="">Select Location</option>
                        <option value="Remote">Remote</option>
                        <option value="Office">Office</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Client Site">Client Site</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProject(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {editingProject ? 'Update Project' : 'Add Project'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Projects Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className={`hover:bg-gray-50 ${selectedProjects.has(project.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project.id)}
                            onChange={() => toggleProjectSelection(project.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{project.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                            <div className="text-sm text-gray-500">{project.client_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.work_type === 'Development' ? 'bg-blue-100 text-blue-800' :
                            project.work_type === 'Design' ? 'bg-purple-100 text-purple-800' :
                            project.work_type === 'Testing' ? 'bg-yellow-100 text-yellow-800' :
                            project.work_type === 'DevOps' ? 'bg-gray-100 text-gray-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {project.work_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.location === 'Remote'
                              ? 'bg-green-100 text-green-800'
                              : project.location === 'Office'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.location}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(project)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                              title="Edit Project"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                              title="Delete Project"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="text-lg">📋</div>
                        <div className="mt-2">
                          {searchTerm || filterValue ? 
                            'No projects match your search criteria' : 
                            'No projects found. Click "Add Project" to get started.'
                          }
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination could go here if needed for large datasets */}
          {filteredProjects.length > 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <div>
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded">Total Projects: {projects.length}</span>
                <span className="px-2 py-1 bg-blue-100 rounded">Filtered: {filteredProjects.length}</span>
                {selectedProjects.size > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 rounded">Selected: {selectedProjects.size}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;