/*
# Brand2Stand Project Management System

1. New Tables
  - `projects` - Main project data with form fields and metadata
  - `project_versions` - Track different iterations and versions
  - `generated_images` - Store AI-generated images with metadata
  - `project_exports` - Track export history and downloads

2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own projects
  - Public read access for shared projects (optional)

3. Features
  - Auto-versioning with timestamps
  - Image storage integration
  - Export tracking
  - Project sharing capabilities
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Project',
  description text,
  
  -- Form data (JSON for flexibility)
  form_data jsonb NOT NULL DEFAULT '{}',
  
  -- Generated prompts
  base_prompts jsonb DEFAULT '{}',
  enhanced_prompts jsonb DEFAULT '{}',
  
  -- Project metadata
  brand text,
  product text,
  stand_type text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  
  -- Sharing and collaboration
  is_public boolean DEFAULT false,
  share_token uuid DEFAULT gen_random_uuid(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Project versions for tracking iterations
CREATE TABLE IF NOT EXISTS project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  
  -- Snapshot data
  form_data jsonb NOT NULL,
  base_prompts jsonb DEFAULT '{}',
  enhanced_prompts jsonb DEFAULT '{}',
  
  -- Version metadata
  version_name text,
  change_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(project_id, version_number)
);

-- Generated images storage
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES project_versions(id) ON DELETE SET NULL,
  
  -- Image details
  image_type text NOT NULL CHECK (image_type IN ('front_view', 'store_view', 'three_quarter_view', 'edited')),
  image_url text NOT NULL,
  storage_path text,
  
  -- Generation metadata
  prompt_used text,
  model_used text DEFAULT 'imagen4',
  generation_params jsonb DEFAULT '{}',
  
  -- Image properties
  aspect_ratio text,
  file_size bigint,
  width integer,
  height integer,
  
  -- Status and quality
  status text DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed', 'archived')),
  quality_score decimal(3,2),
  
  created_at timestamptz DEFAULT now()
);

-- Project exports tracking
CREATE TABLE IF NOT EXISTS project_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Export details
  export_type text NOT NULL CHECK (export_type IN ('pdf', 'zip', 'json', 'images_only')),
  file_path text,
  file_size bigint,
  
  -- Export metadata
  includes_images boolean DEFAULT true,
  includes_prompts boolean DEFAULT true,
  includes_form_data boolean DEFAULT true,
  export_format_version text DEFAULT '1.0',
  
  created_at timestamptz DEFAULT now(),
  downloaded_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public projects are readable"
  ON projects
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS Policies for project_versions
CREATE POLICY "Users can manage versions of their projects"
  ON project_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_versions.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for generated_images
CREATE POLICY "Users can manage images of their projects"
  ON generated_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = generated_images.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_exports
CREATE POLICY "Users can manage their exports"
  ON project_exports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON projects(brand);

CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created_at ON project_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_images_project_id ON generated_images(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(image_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);

CREATE INDEX IF NOT EXISTS idx_project_exports_project_id ON project_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_exports_created_at ON project_exports(created_at DESC);

-- Functions for automatic version incrementation
CREATE OR REPLACE FUNCTION increment_project_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number := COALESCE(
    (SELECT MAX(version_number) + 1 FROM project_versions WHERE project_id = NEW.project_id),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_project_version
  BEFORE INSERT ON project_versions
  FOR EACH ROW EXECUTE FUNCTION increment_project_version();

-- Function to update project timestamp
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET updated_at = now(), last_accessed_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_timestamp
  AFTER INSERT OR UPDATE ON project_versions
  FOR EACH ROW EXECUTE FUNCTION update_project_timestamp();