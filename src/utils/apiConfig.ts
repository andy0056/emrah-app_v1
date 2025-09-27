/**
 * API Configuration Utility
 * Automatically detects the correct backend URL for any environment
 */

/**
 * Get the appropriate backend API URL based on environment
 */
export function getApiBaseUrl(): string {
  // 1. Check if environment variable is set (production override)
  if (import.meta.env.VITE_API_PROXY_URL) {
    console.log('🔗 Using configured API URL:', import.meta.env.VITE_API_PROXY_URL);
    return import.meta.env.VITE_API_PROXY_URL;
  }

  // 2. Development: Use localhost
  if (import.meta.env.DEV) {
    console.log('🔗 Development mode: Using localhost:3001');
    return 'http://localhost:3001';
  }

  // 3. Production: Auto-detect based on current domain
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  // Common production patterns
  let backendUrl: string;

  if (currentHost.includes('netlify.app')) {
    // Netlify: Try common backend patterns
    backendUrl = `${currentProtocol}//api-${currentHost}`;
  } else if (currentHost.includes('vercel.app')) {
    // Vercel: Try common backend patterns
    backendUrl = `${currentProtocol}//api-${currentHost}`;
  } else if (currentHost.includes('herokuapp.com')) {
    // Heroku: Try backend on same or different app
    const appName = currentHost.split('.')[0];
    backendUrl = `${currentProtocol}//${appName}-api.herokuapp.com`;
  } else {
    // Generic: Assume backend on same domain with /api path
    backendUrl = `${currentProtocol}//${currentHost}`;
  }

  console.log('🔗 Auto-detected backend URL:', backendUrl);
  return backendUrl;
}

/**
 * Test if a backend URL is working
 */
export async function testBackendConnection(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Find and return the first working backend URL
 */
export async function findWorkingBackendUrl(): Promise<string> {
  const primaryUrl = getApiBaseUrl();

  // Test primary URL first
  console.log('🔍 Testing primary backend URL:', primaryUrl);
  if (await testBackendConnection(primaryUrl)) {
    console.log('✅ Primary backend URL is working');
    return primaryUrl;
  }

  // Fallback URLs to try
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  const fallbackUrls = [
    `${currentProtocol}//${currentHost}:3001`, // Same domain with port
    `${currentProtocol}//api.${currentHost}`, // API subdomain
    `${currentProtocol}//${currentHost}/api`, // API path
    'http://localhost:3001' // Last resort for development
  ];

  for (const url of fallbackUrls) {
    console.log('🔍 Testing fallback URL:', url);
    if (await testBackendConnection(url)) {
      console.log('✅ Found working backend URL:', url);
      return url;
    }
  }

  console.warn('⚠️ No working backend found, using primary URL as fallback');
  return primaryUrl;
}