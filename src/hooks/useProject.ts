import { useState, useCallback } from 'react';
import { ProjectService, SavedProject, FormData } from '../services/projectService';

interface UseProjectReturn {
  projects: SavedProject[];
  currentProject: SavedProject | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  loadProjects: () => Promise<void>;
  loadProject: (projectId: string) => Promise<SavedProject | null>;
  saveProject: (formData: FormData, prompts: any, enhancedPrompts?: any, name?: string, description?: string) => Promise<SavedProject | null>;
  updateProject: (projectId: string, formData: FormData, prompts: any, enhancedPrompts?: any) => Promise<SavedProject | null>;
  duplicateProject: (projectId: string, newName?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  searchProjects: (query: string) => Promise<void>;
  exportProject: (projectId: string, projectName: string) => Promise<void>;
  clearMessages: () => void;
}

export const useProject = (): UseProjectReturn => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  }, []);

  const setSuccessMessage = useCallback((message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      const userProjects = await ProjectService.getUserProjects();
      setProjects(userProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setErrorMessage('Failed to load projects. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage]);

  const loadProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearMessages();
      const project = await ProjectService.loadProject(projectId);
      setCurrentProject(project);
      setSuccessMessage(`Project "${project.name}" loaded successfully!`);
      return project;
    } catch (err) {
      console.error('Error loading project:', err);
      setErrorMessage(`Failed to load project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage]);

  const saveProject = useCallback(async (
    formData: FormData,
    prompts: any,
    enhancedPrompts?: any,
    name?: string,
    description?: string
  ) => {
    try {
      setLoading(true);
      clearMessages();
      const savedProject = await ProjectService.saveProject(formData, prompts, enhancedPrompts, name, description);
      setCurrentProject(savedProject);
      await loadProjects();
      setSuccessMessage('Project saved successfully!');
      return savedProject;
    } catch (err) {
      console.error('Error saving project:', err);
      setErrorMessage(`Failed to save project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage, loadProjects]);

  const updateProject = useCallback(async (
    projectId: string,
    formData: FormData,
    prompts: any,
    enhancedPrompts?: any
  ) => {
    try {
      setLoading(true);
      clearMessages();
      const updatedProject = await ProjectService.updateProject(projectId, formData, prompts, enhancedPrompts);
      setCurrentProject(updatedProject);
      await loadProjects();
      setSuccessMessage('Project updated successfully!');
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      setErrorMessage(`Failed to update project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage, loadProjects]);

  const duplicateProject = useCallback(async (projectId: string, newName?: string) => {
    try {
      setLoading(true);
      clearMessages();
      await ProjectService.duplicateProject(projectId, newName);
      await loadProjects();
      setSuccessMessage('Project duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating project:', err);
      setErrorMessage(`Failed to duplicate project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage, loadProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearMessages();
      await ProjectService.deleteProject(projectId);
      await loadProjects();
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      setSuccessMessage('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      setErrorMessage(`Failed to delete project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage, loadProjects, currentProject]);

  const searchProjects = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadProjects();
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      const results = await ProjectService.searchProjects(query);
      setProjects(results);
    } catch (err) {
      console.error('Error searching projects:', err);
      setErrorMessage('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, loadProjects]);

  const exportProject = useCallback(async (projectId: string, projectName: string) => {
    try {
      setLoading(true);
      clearMessages();
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

      setSuccessMessage('Project exported successfully!');
    } catch (err) {
      console.error('Error exporting project:', err);
      setErrorMessage(`Failed to export project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, setErrorMessage, setSuccessMessage]);

  return {
    projects,
    currentProject,
    loading,
    error,
    success,
    loadProjects,
    loadProject,
    saveProject,
    updateProject,
    duplicateProject,
    deleteProject,
    searchProjects,
    exportProject,
    clearMessages
  };
};