import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, History, Download, Search, Plus, Copy, Trash2, Eye, Edit3 } from 'lucide-react';
import { ProjectService, SavedProject, FormData } from '../services/projectService';
import { supabase } from '../services/supabaseClient';

interface ProjectManagerProps {
  formData: FormData;
  prompts: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  };
  enhancedPrompts: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } | null;
  onLoadProject: (project: SavedProject) => void;
  currentProjectId?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  formData,
  prompts,
  enhancedPrompts,
  onLoadProject,
  currentProjectId
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        loadProjects();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
    if (session?.user) {
      loadProjects();
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const userProjects = await ProjectService.getUserProjects();
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async (isNewVersion = false) => {
    if (!isAuthenticated) {
      alert('Please sign in to save projects.');
      return;
    }

    try {
      setIsLoading(true);
      const name = projectName || `${formData.brand} - ${formData.product}`;
      const description = projectDescription || formData.description;

      let savedProject: SavedProject;

      if (isNewVersion && currentProjectId) {
        // Save as new version
        await ProjectService.saveProjectVersion(
          currentProjectId,
          formData,
          prompts,
          enhancedPrompts,
          `Version ${Date.now()}`,
          'Updated design parameters'
        );
        savedProject = await ProjectService.loadProject(currentProjectId);
      } else if (currentProjectId) {
        // Update existing project
        savedProject = await ProjectService.updateProject(currentProjectId, formData, prompts, enhancedPrompts);
      } else {
        // Save new project
        savedProject = await ProjectService.saveProject(formData, prompts, enhancedPrompts, name, description);
      }

      onLoadProject(savedProject);
      setShowSaveDialog(false);
      setProjectName('');
      setProjectDescription('');
      loadProjects();
      
      alert(`Project ${isNewVersion ? 'version' : ''} saved successfully!`);
    } catch (error) {
      console.error('Error saving project:', error);
      alert(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (project: SavedProject) => {
    try {
      setIsLoading(true);
      const fullProject = await ProjectService.loadProject(project.id);
      onLoadProject(fullProject);
      setShowProjectList(false);
      alert(`Project "${fullProject.name}" loaded successfully!`);
    } catch (error) {
      console.error('Error loading project:', error);
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateProject = async (projectId: string) => {
    try {
      setIsLoading(true);
      await ProjectService.duplicateProject(projectId);
      loadProjects();
      alert('Project duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating project:', error);
      alert(`Failed to duplicate project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await ProjectService.deleteProject(projectId);
      loadProjects();
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportProject = async (projectId: string, projectName: string) => {
    try {
      setIsLoading(true);
      const exportData = await ProjectService.exportProject(projectId);
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Project exported successfully!');
    } catch (error) {
      console.error('Error exporting project:', error);
      alert(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const searchProjects = async (query: string) => {
    if (!query.trim()) {
      loadProjects();
      return;
    }

    try {
      setIsLoading(true);
      const results = await ProjectService.searchProjects(query);
      setProjects(results);
    } catch (error) {
      console.error('Error searching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setProjects([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Save className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Your Projects</h3>
          <p className="text-gray-600 mb-6">
            Sign in to save, load, and manage your POP stand design projects with full version history.
          </p>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Save className="w-5 h-5 mr-2" />
          Project Management
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
          
          {currentProjectId && (
            <button
              onClick={() => saveProject(true)}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <History className="w-4 h-4 mr-2" />
              New Version
            </button>
          )}
          
          <button
            onClick={() => setShowProjectList(true)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Load
          </button>

          <button
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">Save Project</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={`${formData.brand} - ${formData.product}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setProjectName('');
                  setProjectDescription('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveProject(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List Dialog */}
      {showProjectList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Your Projects</h4>
                <button
                  onClick={() => setShowProjectList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchProjects(e.target.value);
                    }}
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={loadProjects}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No projects found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map(project => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{project.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {project.brand} • {project.product} • {project.stand_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Updated: {new Date(project.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => loadProject(project)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Load Project"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateProject(project.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Duplicate Project"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportProject(project.id, project.name)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                            title="Export Project"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id, project.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentProjectId && (
        <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium">
            ✅ Project is saved and synced to the cloud. All changes are automatically backed up.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;