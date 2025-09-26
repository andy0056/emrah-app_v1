/**
 * GlobalErrorBoundary Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { useState } from 'react';

const meta: Meta<typeof GlobalErrorBoundary> = {
  title: 'Components/Error Handling/GlobalErrorBoundary',
  component: GlobalErrorBoundary,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
GlobalErrorBoundary catches and handles all unhandled React errors in the application.
It provides a user-friendly error screen with retry functionality and error reporting.

## Features
- **Automatic Error Detection**: Catches any JavaScript errors in the component tree
- **User-Friendly Error Display**: Shows clear error messages instead of blank screens
- **Retry Mechanism**: Allows users to retry failed operations up to 3 times
- **Error Reporting**: Provides options to report bugs to the development team
- **Development Mode**: Shows detailed error information in development environment

## Usage
Wrap your entire app or specific sections that need error protection.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onError: {
      action: 'error caught',
      description: 'Callback function called when an error is caught',
    },
    fallback: {
      control: false,
      description: 'Custom fallback UI to display when error occurs',
    },
    children: {
      control: false,
      description: 'Child components to protect from errors',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Component that throws an error on command
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a test error for Storybook demo');
  }
  return (
    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-green-800 font-semibold mb-2">✅ Component Working</h3>
      <p className="text-green-700">This component is working normally without any errors.</p>
    </div>
  );
};

// Interactive demo component
const InteractiveErrorDemo = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Error Boundary Demo</h3>
        <p className="text-blue-700 mb-4">
          Click the button below to simulate an error and see how the GlobalErrorBoundary handles it.
        </p>

        <button
          onClick={() => setShouldThrow(!shouldThrow)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
        >
          {shouldThrow ? 'Reset Component' : 'Trigger Error'}
        </button>

        {shouldThrow && (
          <button
            onClick={() => setShouldThrow(false)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Fix Error
          </button>
        )}
      </div>

      <GlobalErrorBoundary>
        <ErrorThrowingComponent shouldThrow={shouldThrow} />
      </GlobalErrorBoundary>
    </div>
  );
};

export const Default: Story = {
  args: {},
  render: () => (
    <GlobalErrorBoundary>
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-green-800 font-semibold mb-2">Protected Component</h3>
        <p className="text-green-700">
          This component is protected by the GlobalErrorBoundary. Any errors thrown by child
          components will be caught and handled gracefully.
        </p>
      </div>
    </GlobalErrorBoundary>
  ),
};

export const WithError: Story = {
  args: {},
  render: () => (
    <GlobalErrorBoundary onError={(error) => console.log('Error caught:', error)}>
      <ErrorThrowingComponent shouldThrow={true} />
    </GlobalErrorBoundary>
  ),
};

export const InteractiveDemo: Story = {
  args: {},
  render: () => <InteractiveErrorDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo that lets you trigger errors to see how the GlobalErrorBoundary responds.
You can simulate errors and see the retry mechanism in action.
        `,
      },
    },
  },
};

export const CustomFallback: Story = {
  args: {},
  render: () => (
    <GlobalErrorBoundary
      fallback={
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-purple-800 font-semibold mb-2">Custom Error Fallback</h3>
          <p className="text-purple-700">
            This is a custom fallback UI instead of the default error boundary display.
          </p>
        </div>
      }
    >
      <ErrorThrowingComponent shouldThrow={true} />
    </GlobalErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Example of using a custom fallback UI instead of the default error boundary display.
This is useful when you want more control over the error presentation.
        `,
      },
    },
  },
};

export const NestedErrorBoundaries: Story = {
  args: {},
  render: () => (
    <GlobalErrorBoundary>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-blue-800 font-semibold">Outer Protected Area</h3>
          <p className="text-blue-700">This area is protected by the outer error boundary.</p>
        </div>

        <GlobalErrorBoundary
          fallback={
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-700">Inner error boundary caught an error!</p>
            </div>
          }
        >
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-gray-800 font-semibold">Inner Protected Area</h3>
            <ErrorThrowingComponent shouldThrow={true} />
          </div>
        </GlobalErrorBoundary>
      </div>
    </GlobalErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Example of nested error boundaries where inner boundaries can catch errors
before they bubble up to outer boundaries. This provides granular error handling.
        `,
      },
    },
  },
};