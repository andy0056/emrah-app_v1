// Offline-first project service that works without Supabase
import { SavedProject, FormData } from './projectService';

export class OfflineProjectService {
  private static readonly PROJECTS_KEY = 'offline_projects';
  private static readonly PROJECT_COUNTER_KEY = 'project_counter';

  // Get all projects from localStorage
  static getProjects(): SavedProject[] {
    try {
      const stored = localStorage.getItem(this.PROJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline projects:', error);
      return [];
    }
  }

  // Save a project to localStorage
  static saveProject(
    formData: any,
    basePrompts: any,
    enhancedPrompts: any = null,
    name?: string,
    description?: string
  ): SavedProject {
    const projects = this.getProjects();
    const counter = this.getNextId();

    const project: SavedProject = {
      id: `offline-project-${counter}`,
      name: name || `${formData.brand} - ${formData.product}`,
      description: description || formData.description || 'Offline project',
      form_data: formData,
      base_prompts: basePrompts,
      enhanced_prompts: enhancedPrompts,
      user_id: 'offline-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      generated_images: [],
      project_versions: []
    };

    projects.unshift(project); // Add to beginning
    this.saveProjects(projects);

    console.log('📁 Project saved offline:', project.name);
    return project;
  }

  // Update an existing project
  static updateProject(
    projectId: string,
    formData: any,
    basePrompts: any,
    enhancedPrompts: any = null
  ): SavedProject | null {
    const projects = this.getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      console.warn('Project not found for update:', projectId);
      return null;
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      form_data: formData,
      base_prompts: basePrompts,
      enhanced_prompts: enhancedPrompts,
      updated_at: new Date().toISOString()
    };

    this.saveProjects(projects);
    console.log('📁 Project updated offline:', projects[projectIndex].name);
    return projects[projectIndex];
  }

  // Get a specific project
  static getProject(projectId: string): SavedProject | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  // Delete a project
  static deleteProject(projectId: string): boolean {
    const projects = this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);

    if (filteredProjects.length === projects.length) {
      return false; // Project not found
    }

    this.saveProjects(filteredProjects);
    console.log('🗑️ Project deleted offline:', projectId);
    return true;
  }

  // Save generated images to a project
  static saveGeneratedImage(
    projectId: string,
    imageType: 'front_view' | 'store_view' | 'three_quarter_view',
    imageUrl: string,
    promptUsed: string,
    aspectRatio: string
  ): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      console.warn('Project not found for image save:', projectId);
      return;
    }

    if (!project.generated_images) {
      project.generated_images = [];
    }

    const imageData = {
      id: `offline-image-${Date.now()}`,
      project_id: projectId,
      image_type: imageType,
      image_url: imageUrl,
      prompt_used: promptUsed,
      aspect_ratio: aspectRatio,
      created_at: new Date().toISOString(),
      file_size: null,
      metadata: null
    };

    project.generated_images.push(imageData);
    project.updated_at = new Date().toISOString();

    this.saveProjects(projects);
    console.log('🖼️ Image saved to offline project:', imageType);
  }

  // Create sample projects for demo
  static createSampleProjects(): void {
    const existingProjects = this.getProjects();
    if (existingProjects.length > 0) return; // Already have projects

    const sampleProjects: SavedProject[] = [
      {
        id: 'sample-1',
        name: 'Premium Electronics Display',
        description: 'Showcase for high-end consumer electronics with integrated brand elements',
        form_data: {
          brand: 'TechPro',
          product: 'Wireless Headphones',
          standType: 'Floor Display',
          materials: ['Aluminum', 'Acrylic'],
          standBaseColor: 'Black',
          standWidth: 80,
          standDepth: 60,
          standHeight: 150
        },
        user_id: 'demo-user',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        generated_images: [],
        project_versions: []
      },
      {
        id: 'sample-2',
        name: 'Fashion Brand Showcase',
        description: 'Elegant display for fashion accessories with premium lighting',
        form_data: {
          brand: 'StyleLux',
          product: 'Designer Sunglasses',
          standType: 'Counter Display',
          materials: ['Wood', 'Glass'],
          standBaseColor: 'Natural Wood',
          standWidth: 60,
          standDepth: 40,
          standHeight: 80
        },
        user_id: 'demo-user',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        generated_images: [],
        project_versions: []
      },
      {
        id: 'sample-3',
        name: 'Home & Garden Display',
        description: 'Outdoor product display with weather-resistant materials',
        form_data: {
          brand: 'GardenPro',
          product: 'Smart Garden Tools',
          standType: 'Outdoor Stand',
          materials: ['Stainless Steel', 'Composite'],
          standBaseColor: 'Green',
          standWidth: 100,
          standDepth: 80,
          standHeight: 120
        },
        user_id: 'demo-user',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        generated_images: [],
        project_versions: []
      }
    ];

    this.saveProjects(sampleProjects);
    console.log('📁 Sample projects created for offline demo');
  }

  // Helper methods
  private static saveProjects(projects: SavedProject[]): void {
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects to localStorage:', error);
    }
  }

  private static getNextId(): number {
    try {
      const stored = localStorage.getItem(this.PROJECT_COUNTER_KEY);
      const current = stored ? parseInt(stored, 10) : 0;
      const next = current + 1;
      localStorage.setItem(this.PROJECT_COUNTER_KEY, next.toString());
      return next;
    } catch (error) {
      console.error('Failed to get next project ID:', error);
      return Date.now(); // Fallback to timestamp
    }
  }

  // Clear all offline data
  static clearOfflineData(): void {
    localStorage.removeItem(this.PROJECTS_KEY);
    localStorage.removeItem(this.PROJECT_COUNTER_KEY);
    console.log('🗑️ All offline project data cleared');
  }

  // Get project statistics
  static getProjectStats() {
    const projects = this.getProjects();
    return {
      totalProjects: projects.length,
      recentProjects: projects.filter(p =>
        new Date(p.updated_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
      ).length,
      oldestProject: projects.length > 0 ?
        Math.min(...projects.map(p => new Date(p.created_at).getTime())) : null,
      newestProject: projects.length > 0 ?
        Math.max(...projects.map(p => new Date(p.updated_at).getTime())) : null
    };
  }
}