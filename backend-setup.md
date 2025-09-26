# 🔐 Backend API Proxy Setup Guide

## Critical Security Notice
**API keys are currently exposed in the browser. This is a CRITICAL security issue that must be fixed immediately.**

## Quick Setup (Express.js Backend)

### 1. Install Dependencies
```bash
npm install express cors dotenv helmet express-rate-limit
```

### 2. Create Backend Server (backend/server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 requests per minute
});
app.use('/api/', limiter);

// Fal.ai proxy endpoint
app.post('/api/proxy/fal', async (req, res) => {
  try {
    const { endpoint, payload } = req.body;
    
    const response = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fal.ai proxy error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request' 
    });
  }
});

// OpenAI proxy endpoint
app.post('/api/proxy/openai', async (req, res) => {
  try {
    const { endpoint, payload } = req.body;
    
    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 Secure API proxy running on port ${PORT}`);
});
```

### 3. Environment Variables (.env)
```env
# Backend Server (NEVER commit this file)
FAL_API_KEY=your-fal-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001

# Frontend (.env.local)
VITE_API_PROXY_URL=http://localhost:3001/api
# Remove all API keys from frontend!
```

### 4. Update Package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run backend\" \"npm run frontend\"",
    "backend": "node backend/server.js",
    "frontend": "vite"
  }
}
```

## Deployment (Production)

### Vercel Functions
Create `api/proxy/fal.js`:
```javascript
export default async function handler(req, res) {
  // Implement proxy logic with proper authentication
}
```

### Netlify Functions
Create `netlify/functions/proxy-fal.js`:
```javascript
exports.handler = async (event, context) => {
  // Implement proxy logic
}
```

## Security Checklist
- [ ] Remove ALL API keys from frontend code
- [ ] Set up backend proxy server
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Use HTTPS in production
- [ ] Implement request signing
- [ ] Add monitoring/logging
- [ ] Set up error handling

## Testing
1. Start backend: `npm run backend`
2. Start frontend: `npm run frontend`
3. Verify no API keys in browser DevTools
4. Test image generation through proxy
