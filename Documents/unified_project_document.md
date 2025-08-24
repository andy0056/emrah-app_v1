# Unified Project Documentation

## Project Requirements Document

### 1) Project Overview

The Brand2Stand POP Display Design Automation App is a web application that helps brands and designers create photorealistic mockups of Point of Purchase (POP) display stands in minutes. Instead of spending hours or days working in complex design software, users fill out a simple form with their brand details, product info, and stand specifications. The app then turns those inputs into AI-friendly prompts, refines them with language models, and generates lifelike images of the display stands using Fal.ai’s Imagen 4 model. We will also provide an option to edit the generated images using the Flux Kontext Max model, which is also available on Fal.ai.

This project is built to speed up the prototyping process, reduce manual design effort, and make POP display concepts accessible to non-designers. Key objectives include delivering high-quality renderings, providing an intuitive and responsive user interface, and offering reliable project management features. Success will be measured by user satisfaction with image quality, average time to generate a design, and the stability of the app under growing traffic.

### 2) In-Scope vs. Out-of-Scope

In-Scope:

*   Form-based input for brand name, target audience, product details, stand type, materials, dimensions, and design elements.
*   Automated prompt generation and optional prompt enhancement via OpenAI GPT-4o-mini.
*   Photorealistic image generation using Fal.ai’s Imagen 4 model.
*   Image preview gallery with download and full-screen view.
*   Iterative image editing: select an existing image and supply a new prompt for refinement.
*   User authentication and authorization via Supabase (email/password and Google OAuth).
*   Project management: save, load, duplicate, and delete design projects.
*   Responsive UI built with React, TypeScript, Tailwind CSS, and Lucide React icons.
*   Basic performance optimizations to handle concurrent image requests.

Out-of-Scope (deferred for later phases):

*   Team collaboration or shared project workspaces.
*   Version history and rollback beyond simple duplication.
*   Advanced analytics or usage dashboards for administrators.
*   Mobile-native apps (iOS/Android) or offline support.
*   Integration with additional AI image models beyond Fal.ai’s Imagen 4.
*   Custom template libraries or drag-and-drop design editors.

### 3) User Flow

A new user arrives at the app landing page and clicks “Sign Up.” They enter their email and password or choose Google login. Once authenticated, they land on the dashboard, where they can start a new project or open an existing one. Selecting “New Project” brings up a detailed form. The user fills in brand details, product info, and POP stand specs. After submitting the form, they see the AI-generated prompt and can opt to refine it. When happy with the prompt, they click “Generate Images” and watch the previews appear in a gallery.

From the gallery, the user can download any image or click “Edit” to open a modal where they enter an updated prompt. They can save their work at any stage. Returning users simply sign in, view all saved projects with thumbnails, and click to load, duplicate, or delete as needed. Navigation is straightforward: a sidebar (or top nav on mobile) always links to Dashboard, New Project, and Account Settings.

### 4) Core Features

*   **Structured Design Form:** Guided inputs for brand name, audience, product specs, stand type (floor, counter), materials, dimensions, and custom design notes.
*   **Prompt Generator:** Translates form inputs into detailed AI prompts via a utility (`promptGenerator.ts`).
*   **Prompt Enhancement:** Optional refinement of generated prompts using OpenAI GPT-4o-mini to boost clarity and creative detail.
*   **AI Image Generation:** Integration with Fal.ai’s Imagen 4 model (`falService.ts`) to produce photorealistic stand designs.
*   **Image Gallery & Preview:** Displays generated images; supports full-screen view, download, and selection for editing.
*   **Iterative Editing Workflow:** Modal interface (`ImageEditModal.tsx`) lets users supply a new prompt for an existing image, triggering a fresh AI call.
*   **Authentication & Authorization:** Supabase handles user sign-up, login (including Google OAuth), session management, and role-based access if extended.
*   **Project Management:** Create, save, load, duplicate, and delete projects via `projectService.ts` with data stored in Supabase’s PostgreSQL.
*   **Responsive UI:** Built with React, TypeScript, Vite, Tailwind CSS, and Lucide React icons for consistent and modern styling.
*   **Performance & Scalability:** Use request queuing, caching, and asynchronous processing to manage multiple image generation requests smoothly.

### 5) Tech Stack & Tools

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React icons.\
**Backend & APIs:** Fal.ai Imagen 4 for image generation, OpenAI GPT-4o-mini for prompt enhancement, Supabase for authentication and database.\
**Dev Tools:** ESLint for linting, Prettier for code style (optional), PostCSS with Tailwind, `tsconfig.json` for TypeScript settings, Bolt for project scaffolding and CI hints.

### 6) Non-Functional Requirements

*   **Performance:** Image generation requests should return the first previews within 10–15 seconds. UI interactions (navigation, form validation) should respond under 100 ms.
*   **Scalability:** Support at least 100 concurrent users generating images without degradation.
*   **Security:** All data in transit must use HTTPS/TLS. User passwords hashed and salted. Follow OWASP Top 10 guidelines.
*   **Reliability:** Target 99.9% uptime. Automatic retries for transient AI service failures.
*   **Compliance:** GDPR-ready data privacy; clear terms and consent for data usage.

### 7) Constraints & Assumptions

*   Relies on Fal.ai’s Imagen 4 being available and responsive via API.
*   Requires an OpenAI key for GPT-4o-mini calls with sufficient rate limits.
*   Supabase project provisioning and credentials must be in place before development.
*   Users have stable internet connectivity for large image uploads/downloads.
*   Environment variables (`.env`) store API keys and endpoints securely.
*   Design context is limited to single-user projects—no team features initially.

### 8) Known Issues & Potential Pitfalls

*   **API Rate Limits:** AI services may throttle requests. Mitigate with exponential backoff and user notifications.
*   **Prompt Quality Variance:** Generic prompts might yield inconsistent images. Provide example templates and allow manual edits.
*   **Latency Spikes:** Image rendering can take time. Show progress indicators and allow background generation.
*   **Data Growth:** Large numbers of saved images may bloat storage. Plan for cleanup policies or storage tiering.
*   **Error Handling:** Unclear error messages from AI services can confuse users. Normalize and simplify errors in the UI.

## App Flow Document

### Onboarding and Sign-In/Sign-Up

When a new user lands on the app, they see a clean landing page with a call to action to sign up or sign in. They click “Sign Up” and choose between entering their email and password or using Google OAuth. After filling in credentials, they receive a confirmation email (if email sign-up) or are redirected immediately (if Google). Once confirmed, they land on the dashboard. To sign out, they click their avatar in the top bar and select “Log Out.” If they forget their password, they click “Forgot Password,” receive a reset link, and follow the email instructions to set a new password.

### Main Dashboard or Home Page

After signing in, the user sees a dashboard with a sidebar on the left listing “New Project,” “My Projects,” and “Settings.” The main area shows thumbnails of existing projects with options to load, duplicate, or delete each one. A prominent “+ New Project” button invites them to start fresh. The top bar includes their name or avatar and quick access to notifications. From the dashboard, a single click on any project thumbnail or the new project button navigates them to the project editor.

### Detailed Feature Flows and Page Transitions

When the user starts a new project, the app transitions to a full-page form where they enter brand details, product information, and stand specs in labeled sections. After completing the form and clicking “Next,” they see a prompt preview section where they can read and edit the AI prompt. Hitting “Enhance Prompt” sends it to OpenAI and updates the text. Clicking “Generate Images” sends the final prompt to Fal.ai, and the page shows a loading spinner. When results arrive, a gallery replaces the form with image cards. Clicking an image opens a modal where they can view it full screen, download it, or click “Edit Image” to enter a new prompt and regenerate. When regeneration is triggered, the modal shows a spinner until the new image appears. The user can close the modal to return to the gallery or click “Back to Form” to adjust inputs.

### Settings and Account Management

In Settings, the user can update their profile picture, change their email or password, and toggle notification preferences. If they have a paid subscription (future phase), they can manage billing details here. After saving changes, a confirmation toast appears, and they click “Back to Dashboard” in the sidebar to resume projects.

### Error States and Alternate Paths

If a user submits invalid form data (e.g., missing required fields), inline validation highlights each issue with red text and explanations. If AI services are unreachable or rate-limited, the app shows a friendly error banner suggesting they try again in a few minutes. During network outages, a full-screen “Offline” message appears, and any unsaved changes are stored locally until connectivity returns. If permission is denied (e.g., session expired), the user is redirected to the sign-in page.

### Conclusion and Overall App Journey

From first contact to final download, the user flows smoothly through sign-up, project creation, AI prompt review, image generation, and iterative editing. The dashboard makes it easy to manage past work, and clear navigation ensures they never feel lost. Every step is designed to minimize waiting and keep the focus on turning design ideas into photorealistic POP display mockups.

## Tech Stack Document

### Frontend Technologies

*   React: Provides a component-based structure for building the user interface and managing state.
*   TypeScript: Adds static typing to catch errors early and improve code maintainability.
*   Vite: Offers blazing-fast development server and optimized builds with hot module replacement.
*   Tailwind CSS: Utility-first styling framework that lets us build responsive designs directly in markup.
*   Lucide React: Lightweight SVG icon set integrated as React components for consistent visuals.

### Backend Technologies

*   Fal.ai (Imagen 4): Handles photorealistic image generation from text prompts via `falService.ts`.
*   OpenAI GPT-4o-mini: Refines and enhances user or system-generated prompts through `openaiService.ts`.
*   Supabase: Manages authentication, real-time database, and storage for user projects via `supabaseClient.ts` and `projectService.ts`.

### Infrastructure and Deployment

*   Vercel (or Netlify): Hosts the frontend with continuous deployment on commits to the main branch.
*   Supabase Cloud: Provides managed PostgreSQL database, auth service, and file storage.
*   GitHub & Bolt: Version control and CI/CD scaffolding, with automated linting and test runs on pull requests.
*   Environment Variables: Securely store API keys and endpoints in the deployment platform settings.

### Third-Party Integrations

*   Google OAuth (via Supabase): Simplifies social login and improves sign-up conversion.
*   Fal.ai: Central to the core feature of AI image generation.
*   OpenAI: Powers prompt optimization for better visual output.
*   (Future) FluxKontext: Placeholder for alternate image editing service if added.

### Security and Performance Considerations

*   All API calls over HTTPS/TLS.
*   JWT-based sessions managed by Supabase with secure cookie settings.
*   Input validation and sanitization on both client and server sides.
*   Rate limiting and retry logic for AI service calls.
*   Code splitting and lazy loading of heavy components (image gallery, modals).
*   Tailwind’s purge mode to strip unused CSS and reduce bundle size.

### Conclusion and Overall Tech Stack Summary

This stack combines modern frontend tools (React, TypeScript, Vite, Tailwind) with powerful AI services (Fal.ai and OpenAI) and a managed backend (Supabase) to deliver a fast, secure, and scalable design automation app. Each choice aligns with our goals of rapid development, high-quality output, and a seamless user experience.

## Frontend Guidelines Document

### Frontend Architecture

We use a single-page application (SPA) built with React and TypeScript. Components are organized into logical folders—`atoms`, `molecules`, `organisms`, and `pages`—following an atomic design approach. This structure makes it easy to find, reuse, and maintain UI pieces. Vite handles bundling and provides hot module replacement for quick iterations.

### Design Principles

Usability drives every decision: form labels are clear, buttons are descriptive, and feedback appears instantly on actions. We follow WCAG guidelines for accessibility, ensuring keyboard navigation and screen-reader support. The layout is fully responsive, adapting from desktop to mobile without sacrificing clarity.

### Styling and Theming

We employ Tailwind CSS with a custom configuration. Utility classes make styling predictable and consistent. We define a theme with CSS variables for primary, secondary, and neutral colors, plus spacing and typography scales. The style leans toward a clean, flat look with subtle shadows for depth. We use the Inter font family for readability.

### Component Structure

Components live in a `src/components` folder, grouped by feature. Atoms are basic UI elements (buttons, inputs), molecules combine atoms (form fields), and organisms form larger sections (headers, sidebars). Pages tie everything together. This hierarchy ensures each component has a single responsibility and can be tested or updated in isolation.

### State Management

Local state is handled with React’s `useState` and `useReducer` hooks. Shared data, such as the current project or user session, uses React Context or a lightweight library like Zustand. Data fetching and caching for projects and AI calls use React Query for built-in loading states and retries.

### Routing and Navigation

React Router manages client-side routes: `/login`, `/dashboard`, `/project/new`, `/project/:id`. Links and `<Navigate>` components redirect users based on auth status. A persistent sidebar (collapsed on mobile) provides quick links to main sections.

### Performance Optimization

We split code by route, loading heavy modules (like the image gallery) only when needed. Images from Fal.ai are displayed in optimized formats (WebP if supported) and lazy-loaded as the user scrolls. Tailwind’s jit mode and PurgeCSS remove unused styles.

### Testing and Quality Assurance

Unit tests use Jest and React Testing Library to verify component logic and rendering. Integration tests cover form submission and prompt generation. End-to-end tests with Cypress simulate a user creating a project, generating images, and saving. Linting with ESLint and style checks with Prettier run on every commit.

### Conclusion and Overall Frontend Summary

Our frontend setup balances developer productivity with a polished user experience. The component-based architecture, consistent styling, and solid testing strategy ensure we can iterate quickly while keeping the app stable, accessible, and performant.

## Implementation Plan

1.  Initialize the repository with Vite, React, TypeScript, Tailwind CSS, ESLint, and Prettier.
2.  Set up Supabase project, configure authentication, and define the database schema for projects.
3.  Build the auth flow: login, signup (email/password and Google OAuth), password reset, and session management.
4.  Create the Dashboard page with “New Project” and a list of existing projects (thumbnails and basic actions).
5.  Develop the design form component (`StandRequestForm.tsx`) with all required fields and validation.
6.  Implement the prompt generator utility (`promptGenerator.ts`) and prompt preview component.
7.  Integrate OpenAI GPT-4o-mini for optional prompt enhancement (`openaiService.ts`).
8.  Integrate Fal.ai Imagen 4 for image generation (`falService.ts`) and handle loading and error states.
9.  Build the image gallery and modal components (`ImageGeneration.tsx`, `ImageModal.tsx`, `ImageEditModal.tsx`) with download and edit features.
10. Add project persistence: save, load, duplicate, and delete via Supabase (`projectService.ts`).
11. Set up React Router for navigation between login, dashboard, and project editor.
12. Implement global state management for user session and current project using Context or Zustand and React Query for data fetching.
13. Apply responsive styling, complete UI polish, and add Lucide React icons for visual consistency.
14. Write unit tests, integration tests, and end-to-end Cypress tests covering key flows.
15. Configure CI/CD pipeline with GitHub Actions (or Bolt) for linting, testing, and automated deployment to Vercel or Netlify.
16. Perform user acceptance testing, gather feedback, and iterate on UI/UX and performance.
17. Prepare production environment variables, finalize documentation, and launch the app.
