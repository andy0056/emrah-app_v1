import React, { Suspense } from 'react';
import { LoadingSpinner } from '../ui';
import type { FormData, PromptSet } from '../../types';

const ProjectManager = React.lazy(() => import('../ProjectManager'));

interface LazyProjectManagerProps {
  formData: FormData;
  prompts: PromptSet;
  enhancedPrompts: PromptSet | null;
  onLoadProject: (project: any) => void;
  currentProjectId?: string;
}

const LazyProjectManager: React.FC<LazyProjectManagerProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <LoadingSpinner size="lg" text="Loading project manager..." />
        </div>
      }
    >
      <ProjectManager {...props} />
    </Suspense>
  );
};

export default LazyProjectManager;