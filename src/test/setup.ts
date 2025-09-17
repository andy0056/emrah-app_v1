// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock global objects for node environment
global.window = {
  location: {
    href: 'http://localhost:3000',
    reload: vi.fn(),
  },
  navigator: {
    userAgent: 'test',
  },
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

// Mock fetch
global.fetch = vi.fn();

// Mock crypto for security utils
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
  },
  writable: true,
});

global.sessionStorage = sessionStorageMock as any;
global.localStorage = localStorageMock as any;

// Mock document for DOM operations
global.document = {
  createElement: vi.fn(() => ({
    rel: '',
    href: '',
    as: '',
    crossOrigin: ''
  })),
  head: {
    appendChild: vi.fn()
  },
  querySelectorAll: vi.fn(() => [])
} as any;