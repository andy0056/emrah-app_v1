import React from 'react';
import StandRequestForm from './components/StandRequestForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Brand2Stand</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered POP (Point of Purchase) display design automation platform. 
            Create innovative, stylized, and unique stand designs with Google Imagen 4 rendering via Fal.ai.
          </p>
        </div>
        <StandRequestForm />
      </div>
    </div>
  );
}

export default App;