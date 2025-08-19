import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const AuthDebugPanel: React.FC = () => {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setDebugInfo({
        currentUrl: window.location.href,
        currentOrigin: window.location.origin,
        hasCode: !!urlParams.get('code'),
        hasError: !!urlParams.get('error'),
        code: urlParams.get('code'),
        error: urlParams.get('error'),
        errorDescription: urlParams.get('error_description'),
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    updateDebugInfo();
    window.addEventListener('popstate', updateDebugInfo);
    return () => window.removeEventListener('popstate', updateDebugInfo);
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Supabase connection test:', { data, error });
      alert(`Supabase connection: ${error ? 'Failed - ' + error.message : 'Success'}`);
    } catch (err) {
      console.error('Supabase connection error:', err);
      alert(`Supabase connection error: ${err}`);
    }
  };

  const clearAuthData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin;
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
      >
        🐛 Debug Auth
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 w-96 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Auth Debug Panel</h3>
          
          <div className="space-y-2 text-xs">
            <div>
              <strong>Auth Status:</strong>
              <div className="ml-2">
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                <div>User: {user ? '✅ Logged in' : '❌ Not logged in'}</div>
                <div>Session: {session ? '✅ Active' : '❌ None'}</div>
              </div>
            </div>
            
            <div>
              <strong>URL Debug:</strong>
              <div className="ml-2">
                <div>Origin: {debugInfo.currentOrigin}</div>
                <div>Has Code: {debugInfo.hasCode ? '✅' : '❌'}</div>
                <div>Has Error: {debugInfo.hasError ? '⚠️' : '✅'}</div>
                {debugInfo.code && <div>Code: {debugInfo.code.substring(0, 20)}...</div>}
                {debugInfo.error && <div>Error: {debugInfo.error}</div>}
                {debugInfo.errorDescription && <div>Error Desc: {debugInfo.errorDescription}</div>}
              </div>
            </div>
            
            <div>
              <strong>Config:</strong>
              <div className="ml-2">
                <div>Supabase URL: {debugInfo.supabaseUrl?.substring(0, 30)}...</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={testSupabaseConnection}
              className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
            >
              Test Supabase Connection
            </button>
            <button
              onClick={clearAuthData}
              className="w-full bg-yellow-500 text-white px-2 py-1 rounded text-xs"
            >
              Clear Auth Data & Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel;