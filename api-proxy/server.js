/**
 * Secure API Proxy Server
 * Handles sensitive API keys on backend to prevent client exposure
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://fal.run", "https://queue.fal.run"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Specific rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 AI requests per minute
  message: 'AI API rate limit exceeded, please wait.',
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// OpenAI Proxy
app.use('/api/openai', aiLimiter, (req, res, next) => {
  // Add OpenAI API key to headers
  req.headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
  req.headers['Content-Type'] = 'application/json';
  delete req.headers['host']; // Remove host header to avoid conflicts
  next();
}, createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/openai': '',
  },
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('OpenAI Proxy Error:', err.message);
    res.status(500).json({ error: 'OpenAI API request failed' });
  }
}));

// FAL.AI Proxy
app.use('/api/fal', aiLimiter, (req, res, next) => {
  // Add FAL API key to headers
  req.headers['Authorization'] = `Key ${process.env.FAL_API_KEY}`;
  req.headers['Content-Type'] = 'application/json';
  delete req.headers['host'];
  next();
}, createProxyMiddleware({
  target: 'https://fal.run',
  changeOrigin: true,
  pathRewrite: {
    '^/api/fal': '',
  },
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('FAL Proxy Error:', err.message);
    res.status(500).json({ error: 'FAL API request failed' });
  }
}));

// FAL Queue Proxy (for subscriptions)
app.use('/api/fal-queue', aiLimiter, (req, res, next) => {
  req.headers['Authorization'] = `Key ${process.env.FAL_API_KEY}`;
  req.headers['Content-Type'] = 'application/json';
  delete req.headers['host'];
  next();
}, createProxyMiddleware({
  target: 'https://queue.fal.run',
  changeOrigin: true,
  pathRewrite: {
    '^/api/fal-queue': '',
  },
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('FAL Queue Proxy Error:', err.message);
    res.status(500).json({ error: 'FAL Queue API request failed' });
  }
}));

// Custom endpoints for specific integrations
app.post('/api/compress-prompt', async (req, res) => {
  try {
    const { prompt, maxLength } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use OpenAI for intelligent prompt compression
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: `You are an expert prompt compressor. Compress the given prompt while preserving all critical information, especially numerical values and brand names. Target length: ${maxLength || 2000} characters.`
        }, {
          role: 'user',
          content: `Compress this prompt while preserving all critical details:\n\n${prompt}`
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const compressedPrompt = data.choices[0]?.message?.content || prompt;

    res.json({
      originalPrompt: prompt,
      compressedPrompt,
      originalLength: prompt.length,
      compressedLength: compressedPrompt.length,
      compressionRatio: compressedPrompt.length / prompt.length
    });

  } catch (error) {
    console.error('Prompt compression error:', error);
    res.status(500).json({ error: 'Failed to compress prompt' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Proxy server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔒 Secure API Proxy running on port ${PORT}`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('🛡️  Security headers enabled');
  console.log('⚡ Rate limiting active');

  // Verify required environment variables
  const requiredVars = ['OPENAI_API_KEY', 'FAL_API_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.log('📋 Create a .env file with:');
    missing.forEach(v => console.log(`   ${v}=your_key_here`));
  } else {
    console.log('✅ All API keys configured');
  }
});

module.exports = app;