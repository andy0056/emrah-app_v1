const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const Replicate = require('replicate');
require('dotenv').config();

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend proxy running' });
});

// Fal.ai Storage Upload Proxy
app.post('/api/proxy/fal/storage/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Proxying storage upload to Fal.ai');
    
    // Get filename from upload
    const fileName = req.file ? req.file.originalname : 'upload';

    // Initialize upload
    const initResponse = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: fileName
      })
    });

    if (!initResponse.ok) {
      console.error('Failed to initiate upload:', initResponse.status);
      return res.status(initResponse.status).json({ 
        error: 'Failed to initiate upload',
        details: await initResponse.text()
      });
    }

    const initData = await initResponse.json();
    console.log('✅ Upload initiated:', initData.upload_url);

    // Upload the file
    const formData = new FormData();
    if (req.file) {
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    } else if (req.body.file) {
      // Handle base64 or URL
      formData.append('file', req.body.file);
    }

    const uploadResponse = await fetch(initData.upload_url, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      console.error('Failed to upload file:', uploadResponse.status);
      return res.status(uploadResponse.status).json({ 
        error: 'Failed to upload file' 
      });
    }

    // Finalize upload
    const finalizeResponse = await fetch(`https://rest.alpha.fal.ai/storage/upload/${initData.upload_id}/finalize`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!finalizeResponse.ok) {
      console.error('Failed to finalize upload:', finalizeResponse.status);
      return res.status(finalizeResponse.status).json({ 
        error: 'Failed to finalize upload' 
      });
    }

    const result = await finalizeResponse.json();
    console.log('✅ File uploaded successfully:', result.url);
    
    res.json({ success: true, url: result.url });
  } catch (error) {
    console.error('Storage upload error:', error);
    res.status(500).json({ 
      error: 'Storage upload failed',
      details: error.message 
    });
  }
});

// Fal.ai Image Generation Proxy
app.post('/api/proxy/fal/generate', async (req, res) => {
  try {
    const { model, payload } = req.body;
    console.log(`🎨 Generating with ${model}`);

    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fal.ai error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: `Fal.ai error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Generation successful');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Generation failed',
      details: error.message 
    });
  }
});

// Replicate Health Check
app.get('/api/proxy/replicate/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'replicate',
    configured: !!process.env.REPLICATE_API_TOKEN
  });
});

// Replicate Image Generation Proxy
app.post('/api/proxy/replicate/generate', async (req, res) => {
  try {
    const { model, input } = req.body;
    console.log(`🔄 Generating with Replicate ${model}`);
    console.log('📝 Input prompt:', input.prompt?.substring(0, 100) + '...');
    console.log('🖼️ Image inputs:', input.image_input?.length || 0);

    // Generate with Replicate - this returns a prediction that we need to await
    const prediction = await replicate.run(model, { input });

    console.log('✅ Replicate generation successful');
    console.log('📦 Raw prediction structure:', Object.keys(prediction));
    console.log('📦 Raw output:', JSON.stringify(prediction, null, 2));

    // Handle different response formats from Replicate
    let processedOutput = prediction;

    // Helper function to convert FileOutput objects to URLs
    const extractUrl = async (item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object' && typeof item.url === 'function') {
        return await item.url();
      }
      if (item && typeof item === 'object' && item.url) {
        return item.url;
      }
      return null;
    };

    // Process different response formats
    if (typeof prediction === 'string') {
      processedOutput = [prediction];
    }
    // If prediction is array, process each item
    else if (Array.isArray(prediction)) {
      processedOutput = [];
      for (const item of prediction) {
        const url = await extractUrl(item);
        if (url) processedOutput.push(url);
      }
    }
    // If prediction has FileOutput methods
    else if (prediction && typeof prediction === 'object') {
      if (typeof prediction.url === 'function') {
        const url = await prediction.url();
        processedOutput = [url];
      } else if (prediction.url) {
        processedOutput = [prediction.url];
      } else if (prediction.output) {
        if (Array.isArray(prediction.output)) {
          processedOutput = [];
          for (const item of prediction.output) {
            const url = await extractUrl(item);
            if (url) processedOutput.push(url);
          }
        } else {
          const url = await extractUrl(prediction.output);
          processedOutput = url ? [url] : [];
        }
      } else if (prediction.urls) {
        processedOutput = prediction.urls;
      } else if (prediction.images) {
        processedOutput = prediction.images;
      }
    }

    console.log('🔍 Processed output:', JSON.stringify(processedOutput, null, 2));

    res.json({
      success: true,
      output: processedOutput,
      metadata: {
        model,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Replicate generation error:', error);
    res.status(500).json({
      error: 'Replicate generation failed',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// OpenAI Proxy
app.post('/api/proxy/openai', async (req, res) => {
  try {
    const { endpoint, payload } = req.body;
    console.log(`🤖 Calling OpenAI ${endpoint}`);

    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: `OpenAI error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ OpenAI call successful');
    res.json({ success: true, data });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ 
      error: 'OpenAI call failed',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`
🔐 Secure Backend Proxy Running
================================
Port: ${PORT}
Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
Environment: ${process.env.NODE_ENV || 'development'}

API Status:
- Fal.ai: ${process.env.FAL_API_KEY ? '✅ Configured' : '❌ Missing API Key'}
- Replicate: ${process.env.REPLICATE_API_TOKEN ? '✅ Configured' : '❌ Missing API Token'}
- OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing API Key'}

Endpoints:
- GET  /health
- POST /api/proxy/fal/storage/upload
- POST /api/proxy/fal/generate
- GET  /api/proxy/replicate/health
- POST /api/proxy/replicate/generate
- POST /api/proxy/openai
================================
  `);
});
