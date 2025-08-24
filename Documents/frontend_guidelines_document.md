# Frontend Guideline Document

This document lays out how the frontend of the Brand2Stand POP Display Design Automation App is built and maintained. It explains the architecture, design principles, styling, components, state handling, navigation, performance tricks, testing approach, and wraps up with a summary. Anyone reading this—technical or not—should clearly understand how the frontend works and how to keep it running smoothly.

## 1. Frontend Architecture

### 1.1 Overview
- We use **React** (with TypeScript) to build a component-based user interface. Each piece of the UI is a self-contained React component.
- **Vite** powers our development and build process. It offers fast startup times, hot module replacement, and optimized production bundles.
- **Tailwind CSS** (through **PostCSS**) handles styling in a utility-first way, letting us compose classes directly in our markup.
- **Lucide React** brings in a consistent set of icons as React components.
- **Bolt** provided our initial folder structure, build scripts, and best-practice configs (ESLint, tsconfig).

### 1.2 Scalability, Maintainability, Performance
- **Scalability:** Components live in logical folders (`/components`, `/features`, `/services`). As new features arrive, we add new folders without cluttering existing code.
- **Maintainability:** TypeScript types and ESLint rules catch errors early. Clear naming conventions and folder structures make finding and updating code straightforward.
- **Performance:** Vite’s code splitting and tree-shaking remove unused code. Tailwind’s purge step strips out unused CSS. We lazy-load heavy parts (modals, image galleries) so the initial load is quick.

## 2. Design Principles

### 2.1 Key Principles
- **Usability:** Forms, buttons, and feedback follow a clear flow. Labels and error messages guide users step by step.
- **Accessibility:** We follow WCAG 2.1 AA standards. Color contrasts meet guidelines, form fields are properly labeled, and interactive elements support keyboard navigation.
- **Responsiveness:** The layout adapts seamlessly from mobile to desktop using Tailwind’s responsive utilities (`sm:`, `md:`, `lg:`).
- **Consistency:** Shared UI patterns (buttons, inputs, modals) behave the same way everywhere.

### 2.2 Applying These Principles
- **Forms:** Inline validation messages appear next to fields. Focus states highlight the active input.
- **Feedback:** Loading spinners and disabled states inform users when AI services are working.
- **Layout:** A mobile-first grid system ensures the app looks good on phones, tablets, and desktops.
- **Icons & Text:** Lucide icons pair with concise text labels for clarity.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Utility-First CSS:** Tailwind CSS classes are used in JSX (`className="bg-primary text-white p-4"`). This avoids custom CSS files and keeps styles co-located with markup.
- **PostCSS Plugins:** Tailwind and autoprefixer run via PostCSS to add vendor prefixes and purge unused styles.

### 3.2 Theming
- We define a theme in `tailwind.config.js` with custom color and font settings. All colors are referenced by name (`bg-primary`, `text-secondary`) rather than raw hex codes in components.
- Dark mode support is enabled via a `dark` variant, making it easy to switch themes if needed.

### 3.3 Visual Style
- **Design Style:** Modern flat design with subtle shadows and rounded corners for depth.
- **Color Palette:**  
  • Primary: #3B82F6 (blue)  
  • Secondary: #14B8A6 (teal)  
  • Accent: #F59E0B (orange)  
  • Neutral Light: #F3F4F6 (light gray)  
  • Neutral Dark: #1F2937 (dark gray)  
  • Success: #10B981 (green)  
  • Error: #EF4444 (red)
- **Font:** Inter – a clean, highly legible sans-serif. Loaded via Google Fonts in `index.html` and set as the default in Tailwind’s config.

## 4. Component Structure

### 4.1 Organization
- `/src/components/ui` – Generic, reusable building-blocks (Button, Input, Modal, Icon).
- `/src/components/layout` – Layout elements (Header, Footer, Sidebar, DashboardLayout).
- `/src/components/features` – Feature-specific UI (StandRequestForm, PromptPreview, ImageGallery, ImageEditModal).
- `/src/services` – API wrappers (`falService.ts`, `openaiService.ts`, `projectService.ts`, `supabaseClient.ts`).
- `/src/hooks` – Custom React hooks (useAuth, useProject, usePrompt).

### 4.2 Reusability and Maintainability
- Each component has its own folder with:
  - `ComponentName.tsx` – the JSX logic
  - `ComponentName.module.css` (if needed)
  - `ComponentName.test.tsx` – unit tests
  - `index.ts` – re-exports
- We avoid deeply nested prop drilling by keeping components small and focused. Shared logic lives in hooks or context.

## 5. State Management

### 5.1 Approach
- **Local State:** `useState` for form inputs, loading flags, modal open/close states.
- **Global State:** React’s **Context API** holds user session (from Supabase) and current project data (inputs, prompts, images).
- **Custom Hooks:** `useAuth()` wraps Supabase auth logic; `useProject()` wraps project CRUD; `usePrompt()` manages prompt generation/enhancement.

### 5.2 Data Flow
1. **Authentication:** `useAuth` exposes `user`, `signIn`, `signOut`.
2. **Project Context:** On successful sign-in, `ProjectProvider` fetches saved projects.
3. **Component Interaction:** Form writes to project context. PromptPreview reads form data to show the prompt. ImageGallery reads the refined prompt to trigger AI calls.
4. **Persistence:** `projectService` methods (`save`, `load`, `duplicate`, `delete`) sync context with Supabase.

## 6. Routing and Navigation

### 6.1 Current Setup
- This version uses **conditional rendering** rather than a routing library. We show the login screen if no user is signed in, otherwise we show the dashboard or new project form, based on context flags.

### 6.2 Future Considerations
- For clearer page URLs and browser history, we can adopt **React Router v6**. That would allow paths like `/login`, `/dashboard`, `/project/:id`.

## 7. Performance Optimization

### 7.1 Strategies
- **Code Splitting:** We dynamically import heavy components (e.g., ImageGallery, ImageEditModal) using `React.lazy` and `Suspense`.
- **Lazy Loading Images:** Gallery images use the `loading="lazy"` attribute and small blurred placeholders before full-size loads.
- **CSS Purging:** Tailwind removes unused styles in production builds.
- **Asset Optimization:** SVG icons from Lucide are inlined; image downloads use compressed formats.
- **API Caching (Optional):** We can cache AI prompt results in local storage or session state to avoid repeated calls.

### 7.2 Impact
These measures shrink initial bundle sizes, speed up page loads, and deliver a snappy user experience even on slower connections.

## 8. Testing and Quality Assurance

### 8.1 Unit Testing
- **Jest** + **React Testing Library** for component and hook tests. Each component’s key behaviors (renders correct text, handles click events, shows loading states) are covered.

### 8.2 Integration Testing
- We write tests that render multiple components together (e.g., filling out the form and generating a prompt) to ensure features work end to end in isolation.

### 8.3 End-to-End Testing
- **Cypress** (or Playwright) simulates real user flows: sign in, create project, generate images, save, load, and delete.

### 8.4 Linting and Formatting
- **ESLint** enforces coding standards.  
- **Prettier** (optional) auto-formats code on save or pre-commit.  
- **Husky** + **lint-staged** run linters on staged files before commits.

## 9. Conclusion and Overall Frontend Summary

The frontend of Brand2Stand is built to be fast, maintainable, and user-friendly. By combining React, TypeScript, Vite, and Tailwind CSS, we achieve a modern flat design that scales as the app grows. Our component structure and Context-based state management keep the code organized and easy to reason about. Performance optimizations and a robust testing suite guarantee a smooth experience for end users and confidence for developers. These guidelines ensure every contributor understands how the frontend fits together and how to extend it without introducing confusion or regressions.

---

With these guidelines in hand, developers and stakeholders alike have a clear map of the frontend setup, from folder structure to final delivery, ensuring the Brand2Stand app remains robust, scalable, and delightful to use.