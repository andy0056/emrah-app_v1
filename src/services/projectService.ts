import { supabase, Project, ProjectInsert, ProjectUpdate, ProjectVersion, GeneratedImage, GeneratedImageInsert } from './supabaseClient';
import { OfflineProjectService } from './offlineProjectService';
import { APIError, NetworkError, ValidationError, AuthenticationError } from '../types';

export interface FormData {
  submissionId: string;
  respondentId: string;
  submittedAt: string;
  brand: string;
  brandLogo: string | null;
  product: string;
  productImage: string | null;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  frontFaceCount: number;
  backToBackCount: number;
  keyVisual: string | null;
  exampleStands: string[];
  standType: string;
  materials: string[];
  standBaseColor: string;
  standWidth: number;
  standDepth: number;
  standHeight: number;
  shelfWidth: number;
  shelfDepth: number;
  shelfCount: number;
  description: string;
}

export interface SavedProject extends Project {
  images?: GeneratedImage[];
  versions?: ProjectVersion[];
}

export class ProjectService {

  // Create a new version of a project
  static async saveProjectVersion(
    projectId: string,
    formData: FormData,
    basePrompts: any,
    enhancedPrompts: any = null,
    versionName?: string,
    changeNotes?: string
  ): Promise<ProjectVersion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthenticationError('User not authenticated');

    const versionData = {
      project_id: projectId,
      form_data: formData,
      base_prompts: basePrompts,
      enhanced_prompts: enhancedPrompts,
      version_name: versionName,
      change_notes: changeNotes,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('project_versions')
      .insert(versionData)
      .select()
      .single();

    if (error) throw new APIError('PROJECT_SAVE_ERROR', `Failed to save project version: ${error.message}`, 'high', 'system');
    return data;
  }

  // Load a project by ID
  static async loadProject(projectId: string): Promise<SavedProject> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          generated_images(*),
          project_versions(*)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw new APIError('PROJECT_LOAD_ERROR', `Failed to load project: ${error.message}`, 'medium', 'system');
      return data;
    } catch (networkError) {
      console.warn('Network error accessing Supabase:', networkError);
      // Fallback to offline project
      const offlineProject = OfflineProjectService.getProject(projectId);
      if (offlineProject) {
        console.log('📁 Using offline project data as fallback');
        return offlineProject;
      }
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  // Get user's projects
  static async getUserProjects(limit = 50, offset = 0): Promise<SavedProject[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          generated_images(count),
          project_versions(count)
        `)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('Supabase projects query failed:', error.message);
        // Return mock/cached data if Supabase is unreachable
        return this.getMockProjects();
      }

      return data || [];
    } catch (networkError) {
      console.warn('Network error accessing Supabase:', networkError);
      // Fallback to local storage or mock data
      return this.getMockProjects();
    }
  }

  // Fallback method to provide mock projects when Supabase is unavailable
  private static getMockProjects(): SavedProject[] {
    // Use offline service to get projects
    let projects = OfflineProjectService.getProjects();

    // If no offline projects exist, create samples
    if (projects.length === 0) {
      OfflineProjectService.createSampleProjects();
      projects = OfflineProjectService.getProjects();
    }

    console.log(`📁 Using ${projects.length} offline projects as fallback`);
    return projects;
  }

  // Delete a project
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw new Error(`Failed to delete project: ${error.message}`);
    } catch (networkError) {
      console.warn('Network error accessing Supabase:', networkError);
      // Fallback to offline deletion
      const deleted = OfflineProjectService.deleteProject(projectId);
      if (!deleted) {
        throw new Error(`Project not found: ${projectId}`);
      }
      console.log('📁 Project deleted from offline storage as fallback');
    }
  }

  // Save generated image to project
  static async saveGeneratedImage(
    projectId: string,
    imageType: 'front_view' | 'store_view' | 'three_quarter_view' | 'edited',
    imageUrl: string,
    promptUsed: string,
    aspectRatio: string,
    versionId?: string
  ): Promise<GeneratedImage> {
    try {
      const imageData: GeneratedImageInsert = {
        project_id: projectId,
        version_id: versionId || null,
        image_type: imageType,
        image_url: imageUrl,
        prompt_used: promptUsed,
        model_used: 'imagen4',
        aspect_ratio: aspectRatio,
        status: 'generated'
      };

      const { data, error } = await supabase
        .from('generated_images')
        .insert(imageData)
        .select()
        .single();

      if (error) throw new Error(`Failed to save generated image: ${error.message}`);
      return data;
    } catch (networkError) {
      console.warn('Network error accessing Supabase:', networkError);
      // Fallback to offline image saving
      OfflineProjectService.saveGeneratedImage(projectId, imageType, imageUrl, promptUsed, aspectRatio);

      // Return a mock GeneratedImage object for offline use
      return {
        id: `offline-image-${Date.now()}`,
        project_id: projectId,
        version_id: versionId || null,
        image_type: imageType,
        image_url: imageUrl,
        storage_path: null,
        prompt_used: promptUsed,
        model_used: 'imagen4',
        generation_params: null,
        aspect_ratio: aspectRatio,
        file_size: null,
        width: null,
        height: null,
        status: 'generated',
        quality_score: null,
        created_at: new Date().toISOString()
      };
    }
  }

  // Upload file to Supabase Storage
  static async uploadFile(file: File, bucket = 'uploads'): Promise<string> {
    try {
      // Check if user is authenticated before attempting upload
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload files. Please log in first.');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Don't add 'uploads/' prefix since bucket is already 'uploads'

      console.log('Uploading file:', { name: file.name, size: file.size, type: file.type });

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Storage bucket '${bucket}' not found. Please create an '${bucket}' bucket in your Supabase project dashboard under Storage > Create bucket.`);
        }
        if (error.message.includes('row-level security policy') || error.message.includes('Unauthorized')) {
          throw new Error('Upload permission denied. Please ensure you are logged in and have the correct storage permissions configured in your Supabase project.');
        }
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
    }
  }

  // Upload multiple files and return their URLs
  static async uploadFiles(files: File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];
    
    try {
      const uploadPromises = files.map(file => this.uploadFile(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process form data to upload files and convert to URLs
  static async processFormDataFiles(formData: any): Promise<FormData> {
    try {
      const processedData = { ...formData };

      // Upload brand logo if it's a File
      if (formData.brandLogo && formData.brandLogo instanceof File) {
        console.log('Uploading brand logo...');
        processedData.brandLogo = await this.uploadFile(formData.brandLogo);
      }

      // Upload product image if it's a File
      if (formData.productImage && formData.productImage instanceof File) {
        console.log('Uploading product image...');
        processedData.productImage = await this.uploadFile(formData.productImage);
      }

      // Upload key visual if it's a File
      if (formData.keyVisual && formData.keyVisual instanceof File) {
        console.log('Uploading key visual...');
        processedData.keyVisual = await this.uploadFile(formData.keyVisual);
      }

      // Upload example stands if they're Files
      if (formData.exampleStands && Array.isArray(formData.exampleStands) && formData.exampleStands.length > 0 && formData.exampleStands[0] instanceof File) {
        console.log('Uploading example stands...');
        processedData.exampleStands = await this.uploadFiles(formData.exampleStands);
      }

      return processedData as FormData;
    } catch (error) {
      console.error('Error processing form data files:', error);
      throw error;
    }
  }

  // Updated save method to handle file uploads
  static async saveProject(
    formData: any,
    basePrompts: any,
    enhancedPrompts: any = null,
    name?: string,
    description?: string
  ): Promise<SavedProject> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AuthenticationError('User not authenticated');

      // Process and upload files
      const processedFormData = await this.processFormDataFiles(formData);

      const projectData: ProjectInsert = {
        user_id: user.id,
        name: name || `${processedFormData.brand} - ${processedFormData.product}`,
        description: description || processedFormData.description,
        form_data: processedFormData,
        base_prompts: basePrompts,
        enhanced_prompts: enhancedPrompts,
        brand: processedFormData.brand,
        product: processedFormData.product,
        stand_type: processedFormData.standType,
        status: 'draft'
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw new Error(`Failed to save project: ${error.message}`);
      return data;
    } catch (error) {
      console.warn('Network error saving project, using offline mode:', error);
      // Fallback to offline saving (without file uploads for now)
      return OfflineProjectService.saveProject(
        formData,
        basePrompts,
        enhancedPrompts,
        name,
        description
      );
    }
  }

  // Updated update method to handle file uploads
  static async updateProject(
    projectId: string,
    formData: any,
    basePrompts: any,
    enhancedPrompts: any = null
  ): Promise<SavedProject> {
    try {
      // Process and upload files
      const processedFormData = await this.processFormDataFiles(formData);

      const updateData: ProjectUpdate = {
        form_data: processedFormData,
        base_prompts: basePrompts,
        enhanced_prompts: enhancedPrompts,
        brand: processedFormData.brand,
        product: processedFormData.product,
        stand_type: processedFormData.standType
      };

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update project: ${error.message}`);
      return data;
    } catch (error) {
      console.warn('Network error updating project, using offline mode:', error);
      // Fallback to offline updating (without file uploads for now)
      const updatedProject = OfflineProjectService.updateProject(
        projectId,
        formData,
        basePrompts,
        enhancedPrompts
      );
      if (!updatedProject) {
        throw new Error(`Project not found: ${projectId}`);
      }
      return updatedProject;
    }
  }

  // Save edited image to project
  static async saveEditedImage(
    projectId: string,
    originalImageUrl: string,
    editedImageUrl: string,
    editPrompt: string,
    versionId?: string
  ): Promise<GeneratedImage> {
    try {
      const imageData: GeneratedImageInsert = {
        project_id: projectId,
        version_id: versionId || null,
        image_type: 'edited',
        image_url: editedImageUrl,
        prompt_used: `EDIT: ${editPrompt} | ORIGINAL: ${originalImageUrl}`,
        model_used: 'flux-kontext-max',
        aspect_ratio: '1:1', // Default, could be determined from image
        status: 'generated',
        generation_params: {
          original_image_url: originalImageUrl,
          edit_prompt: editPrompt
        }
      };

      const { data, error } = await supabase
        .from('generated_images')
        .insert(imageData)
        .select()
        .single();

      if (error) throw new Error(`Failed to save edited image: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Error saving edited image:', error);
      throw error;
    }
  }

  // Export project data as JSON
  static async exportProject(projectId: string): Promise<any> {
    const project = await this.loadProject(projectId);
    
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        brand: project.brand,
        product: project.product,
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      formData: project.form_data,
      prompts: {
        base: project.base_prompts,
        enhanced: project.enhanced_prompts
      },
      images: project.images?.map(img => ({
        type: img.image_type,
        url: img.image_url,
        prompt: img.prompt_used,
        aspect_ratio: img.aspect_ratio,
        created_at: img.created_at
      })),
      versions: project.versions?.map(v => ({
        version_number: v.version_number,
        version_name: v.version_name,
        change_notes: v.change_notes,
        created_at: v.created_at
      })),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    // Track export in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('project_exports').insert({
        project_id: projectId,
        user_id: user.id,
        export_type: 'json',
        includes_images: true,
        includes_prompts: true,
        includes_form_data: true
      });
    }

    return exportData;
  }

  // Search projects
  static async searchProjects(query: string): Promise<SavedProject[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,product.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Failed to search projects: ${error.message}`);
    return data || [];
  }

  // Duplicate a project
  static async duplicateProject(projectId: string, newName?: string): Promise<SavedProject> {
    const originalProject = await this.loadProject(projectId);
    
    const duplicateData: ProjectInsert = {
      user_id: originalProject.user_id,
      name: newName || `${originalProject.name} (Copy)`,
      description: originalProject.description,
      form_data: originalProject.form_data,
      base_prompts: originalProject.base_prompts,
      enhanced_prompts: originalProject.enhanced_prompts,
      brand: originalProject.brand,
      product: originalProject.product,
      stand_type: originalProject.stand_type,
      status: 'draft'
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(duplicateData)
      .select()
      .single();

    if (error) throw new Error(`Failed to duplicate project: ${error.message}`);
    return data;
  }
}