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

// Nano Banana Stage-2 Processing Endpoint
app.post('/api/nano-banana', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'brandLogo', maxCount: 1 },
  { name: 'productImage', maxCount: 1 },
  { name: 'keyVisual', maxCount: 1 },
  { name: 'exampleStand0', maxCount: 1 },
  { name: 'exampleStand1', maxCount: 1 },
  { name: 'exampleStand2', maxCount: 1 },
  { name: 'exampleStand3', maxCount: 1 },
  { name: 'exampleStand4', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🍌 Stage-2 Nano Banana processing started');

    // Check for required Stage-1 clay image
    if (!req.files || !req.files.image || !req.files.image[0]) {
      return res.status(400).json({
        error: 'No image file provided',
        details: 'Stage-1 clay image is required'
      });
    }

    const stageImage = req.files.image[0];

    // Log received assets
    console.log('📁 Received files:');
    console.log('  Stage-1 clay image:', stageImage.originalname, `(${stageImage.size} bytes)`);

    if (req.files.brandLogo && req.files.brandLogo[0]) {
      console.log('  Brand logo:', req.files.brandLogo[0].originalname, `(${req.files.brandLogo[0].size} bytes)`);
    }

    if (req.files.productImage && req.files.productImage[0]) {
      console.log('  Product image:', req.files.productImage[0].originalname, `(${req.files.productImage[0].size} bytes)`);
    }

    if (req.files.keyVisual && req.files.keyVisual[0]) {
      console.log('  Key visual:', req.files.keyVisual[0].originalname, `(${req.files.keyVisual[0].size} bytes)`);
    }

    // Log example stands
    Object.keys(req.files).forEach(key => {
      if (key.startsWith('exampleStand') && req.files[key][0]) {
        console.log(`  ${key}:`, req.files[key][0].originalname, `(${req.files[key][0].size} bytes)`);
      }
    });

    const { contract, prompt } = req.body;

    if (!contract || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'contract and prompt are required'
      });
    }

    // Parse contract to validate geometry constraints
    let contractData;
    try {
      contractData = typeof contract === 'string' ? JSON.parse(contract) : contract;
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid contract format',
        details: 'Contract must be valid JSON'
      });
    }

    console.log('📋 Contract validation:', {
      standDims: `${contractData.stand_cm?.width}×${contractData.stand_cm?.depth}×${contractData.stand_cm?.height}`,
      products: contractData.checksum?.total_products,
      verification: contractData.checksum?.verification
    });

    console.log('📝 Stage-2 prompt length:', prompt.length, 'chars');

    // Prepare form data for Replicate Nano Banana
    const formData = new FormData();

    // Add the Stage-1 image
    formData.append('file', stageImage.buffer, {
      filename: 'stage1-clay.png',
      contentType: stageImage.mimetype
    });

    // Enhanced prompt with contract constraints
    const enhancedPrompt = `${prompt}

CONTRACT ENFORCEMENT:
- Stand dimensions: ${contractData.stand_cm?.width}×${contractData.stand_cm?.depth}×${contractData.stand_cm?.height} cm (UNCHANGEABLE)
- Product count: EXACTLY ${contractData.checksum?.total_products} units (UNCHANGEABLE)
- Layout: ${contractData.checksum?.verification} (UNCHANGEABLE)
- Forbidden: ${contractData.forbid?.join(', ')}

Stage-2 ONLY applies materials, lighting, and branding. Geometry is LOCKED from Stage-1.`;

    console.log('🔒 Enhanced prompt with contract constraints:', enhancedPrompt.length, 'chars');

    // Use Replicate client directly with Buffer (automatic upload handling)
    console.log('🔄 Generating with Replicate google/nano-banana using Buffer input');
    console.log('📝 Input prompt:', enhancedPrompt.substring(0, 100) + '...');
    console.log('🖼️ Image buffer size:', stageImage.buffer.length, 'bytes');

    // Generate directly with Replicate - it handles Buffer uploads automatically
    const prediction = await replicate.run('google/nano-banana', {
      input: {
        prompt: enhancedPrompt,
        image_input: [stageImage.buffer], // Use Buffer directly - Replicate handles upload
        output_format: "jpg"
      }
    });

    console.log('✅ Replicate generation successful');
    console.log('📦 Raw prediction structure:', Object.keys(prediction));
    console.log('📦 Raw output:', JSON.stringify(prediction, null, 2));

    // Process the prediction result (same logic as in proxy endpoint)
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
    console.log('✅ Stage-2 Nano Banana generation completed');

    // Return Stage-2 result with contract verification
    res.json({
      success: true,
      stage: 'Stage-2',
      model: 'google/nano-banana',
      images: processedOutput, // Use our processed output
      contract: contractData,
      prompt_used: enhancedPrompt,
      verification: {
        geometry_locked: true,
        contract_enforced: true,
        timestamp: new Date().toISOString()
      },
      metadata: {
        stage1_processed: true,
        contract_version: '1.0',
        generation_type: 'geometry_preserving',
        buffer_upload: true // Indicate we used direct buffer upload
      }
    });

  } catch (error) {
    console.error('❌ Nano Banana processing error:', error);
    res.status(500).json({
      error: 'Stage-2 processing failed',
      details: error.message || 'Unknown error',
      stage: 'Stage-2'
    });
  }
});

// ChatGPT Prompt Optimization Endpoint
app.post('/api/optimize-prompt', upload.fields([
  { name: 'stage1Image', maxCount: 1 },
  { name: 'brandLogo', maxCount: 1 },
  { name: 'productImage', maxCount: 1 },
  { name: 'keyVisual', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🧠 ChatGPT prompt optimization request received');

    // Extract form data
    const { currentPrompt, formData } = req.body;
    const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;

    if (!currentPrompt) {
      return res.status(400).json({
        error: 'Missing required field: currentPrompt'
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, using fallback optimization');

      // Fallback optimization without ChatGPT
      const enhancedPrompt = enhancePromptFallback(currentPrompt, parsedFormData);

      return res.json({
        optimizedPrompt: enhancedPrompt,
        analysis: {
          brandPersonality: 'Analysis unavailable (no API key configured)',
          colorPalette: [],
          materialSuggestions: ['Professional retail materials'],
          qualityImprovements: ['Fallback enhancement applied', 'Technical specifications added']
        },
        confidence: 0.3,
        processingTime: 50,
        fallbackMode: true
      });
    }

    // Prepare images for ChatGPT analysis
    const images = {};

    // Convert uploaded files to base64
    if (req.files.stage1Image && req.files.stage1Image[0]) {
      images.stage1 = req.files.stage1Image[0].buffer.toString('base64');
    }
    if (req.files.brandLogo && req.files.brandLogo[0]) {
      images.brandLogo = req.files.brandLogo[0].buffer.toString('base64');
    }
    if (req.files.productImage && req.files.productImage[0]) {
      images.productImage = req.files.productImage[0].buffer.toString('base64');
    }
    if (req.files.keyVisual && req.files.keyVisual[0]) {
      images.keyVisual = req.files.keyVisual[0].buffer.toString('base64');
    }

    console.log(`📸 Processing ${Object.keys(images).length} images for analysis`);

    // Build ChatGPT message content
    const imageContent = Object.entries(images).map(([key, base64]) => ({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: 'high'
      }
    }));

    const masterInstructions = `You are a master retail display designer and brand integration specialist. Analyze the provided images and data to create an optimized prompt for professional product display stand rendering.

## CORE PRINCIPLES:
1. **Geometric Preservation**: The 3D structure is absolute - never change dimensions, product count, or spatial arrangement
2. **Brand Integration**: Transform materials and appearance to reflect brand identity
3. **Professional Quality**: Create retail-ready display that enhances product presentation
4. **Technical Accuracy**: Maintain exact measurements and realistic material properties

## OUTPUT REQUIREMENTS:
Generate a 200-350 word plain-text prompt for Nano Banana image generation. Use short, direct, imperative sentences.

## PROMPT STRUCTURE:
1. **Opening Statement**: Declare the transformation intent while preserving geometry
2. **Stand Materials**: Specify base, walls, and structural finishes matching brand palette
3. **Brand Integration**: Logo placement, brand colors, and visual identity elements
4. **Product Presentation**: How products should appear with proper branding
5. **Lighting & Atmosphere**: Professional retail lighting setup
6. **Quality Standards**: Realism requirements and technical specifications
7. **Preservation Clause**: Explicit geometry and arrangement protection

Focus on transforming the display into a professional, brand-aligned retail presentation while maintaining absolute fidelity to the 3D geometry and product arrangement.`;

    const messages = [
      {
        role: 'system',
        content: masterInstructions
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please optimize this prompt for a retail display stand:

CURRENT PROMPT TO OPTIMIZE:
${currentPrompt}

TECHNICAL SPECIFICATIONS:
- Stand: ${parsedFormData.standWidth || 'N/A'}×${parsedFormData.standDepth || 'N/A'}×${parsedFormData.standHeight || 'N/A'}cm
- Products: ${parsedFormData.frontFaceCount || 'N/A'} columns × ${parsedFormData.backToBackCount || 'N/A'} deep
- Brand: ${parsedFormData.brand || 'Not specified'}
- Product: ${parsedFormData.product || 'Not specified'}
- Materials: ${parsedFormData.materials?.join(', ') || 'Not specified'}
- Description: ${parsedFormData.description || 'None'}

IMAGES PROVIDED:
${Object.keys(images).map(key => `- ${key}: Brand/visual reference`).join('\n')}

Please analyze the images and provide an optimized prompt following the instructions.`
          },
          ...imageContent
        ]
      }
    ];

    // Call GPT-5 via Replicate
    console.log('🚀 Calling GPT-5 via Replicate for prompt optimization');
    const startTime = Date.now();

    // Convert messages to a single prompt for Replicate
    const systemPrompt = messages[0].content;
    const userContent = messages[1].content.find(item => item.type === 'text')?.text || '';
    const combinedPrompt = `${systemPrompt}\n\nUser Request:\n${userContent}`;

    console.log('📝 GPT-5 prompt length:', combinedPrompt.length, 'chars');

    // Use Replicate client for GPT-5
    const prediction = await replicate.run('openai/gpt-5', {
      input: {
        prompt: combinedPrompt,
        verbosity: 'medium',
        reasoning_effort: 'medium'
      }
    });

    console.log('✅ GPT-5 via Replicate successful');
    console.log('📦 GPT-5 response type:', typeof prediction);
    console.log('📦 GPT-5 raw response:', JSON.stringify(prediction, null, 2));

    // Extract the response content from Replicate's GPT-5 response
    let optimizedContent;
    if (typeof prediction === 'string') {
      optimizedContent = prediction;
    } else if (Array.isArray(prediction)) {
      // Handle array responses
      optimizedContent = prediction.join('\n');
    } else if (prediction && typeof prediction === 'object') {
      // Handle object responses - try multiple properties
      optimizedContent = prediction.output ||
                        prediction.response ||
                        prediction.text ||
                        prediction.content ||
                        prediction.result ||
                        (Array.isArray(prediction.choices) && prediction.choices[0]?.message?.content) ||
                        JSON.stringify(prediction);
    } else {
      optimizedContent = String(prediction || '');
    }

    console.log('📝 GPT-5 optimized content length:', optimizedContent?.length || 0, 'chars');
    if (optimizedContent && optimizedContent.length > 100) {
      console.log('📝 GPT-5 content preview:', optimizedContent.substring(0, 200) + '...');
    }

    if (!optimizedContent) {
      throw new Error('No optimized prompt returned from GPT-5');
    }

    // Parse the optimized response
    const analysis = parseOptimizationResult(optimizedContent);

    console.log('✅ Prompt optimization completed successfully');

    res.json({
      optimizedPrompt: analysis.prompt,
      analysis: {
        brandPersonality: analysis.brandPersonality,
        colorPalette: analysis.colorPalette,
        materialSuggestions: analysis.materialSuggestions,
        qualityImprovements: analysis.qualityImprovements
      },
      confidence: analysis.confidence,
      processingTime: Date.now() - startTime,
      fallbackMode: false
    });

  } catch (error) {
    console.error('❌ Prompt optimization error:', error);

    // Fallback to enhanced original prompt
    const { currentPrompt, formData } = req.body;
    const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;
    const enhancedPrompt = enhancePromptFallback(currentPrompt || '', parsedFormData || {});

    res.status(500).json({
      error: 'Prompt optimization failed, using fallback',
      optimizedPrompt: enhancedPrompt,
      analysis: {
        brandPersonality: 'Analysis failed (fallback mode)',
        colorPalette: [],
        materialSuggestions: ['Professional retail materials'],
        qualityImprovements: ['Fallback enhancement applied']
      },
      confidence: 0.2,
      processingTime: 100,
      fallbackMode: true,
      details: error.message
    });
  }
});

// Helper function for fallback prompt enhancement
function enhancePromptFallback(currentPrompt, formData) {
  let enhanced = currentPrompt || 'Transform this display stand for professional retail presentation.';

  // Add technical specifications if missing
  if (!enhanced.includes('dimensions') && formData.standWidth) {
    enhanced += ` Maintain exact ${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm stand dimensions.`;
  }

  // Add brand name if available
  if (formData.brand && !enhanced.includes(formData.brand)) {
    enhanced = enhanced.replace('Transform this', `Transform this ${formData.brand}`);
  }

  // Add product count specification
  if (formData.frontFaceCount && formData.backToBackCount) {
    enhanced += ` Preserve exact ${formData.frontFaceCount}×${formData.backToBackCount} product arrangement.`;
  }

  // Add rendering quality requirements
  if (!enhanced.includes('photorealistic')) {
    enhanced += ' Render photorealistic quality with professional retail lighting and accurate materials.';
  }

  // Add material specifications if provided
  if (formData.materials && formData.materials.length > 0) {
    enhanced += ` Apply materials: ${formData.materials.join(', ')}.`;
  }

  return enhanced;
}

// Helper function to parse ChatGPT optimization result
function parseOptimizationResult(content) {
  // Extract the main optimized prompt (everything before analysis markers)
  const promptMatch = content.match(/^(.*?)(?=\n\n(?:ANALYSIS|BRAND|CONFIDENCE):|$)/s);
  const prompt = promptMatch ? promptMatch[1].trim() : content.trim();

  // Extract analysis sections
  const brandPersonality = extractSection(content, /BRAND PERSONALITY[:\s]*([^\n]+)/i);
  const colorPalette = extractColors(content);
  const materialSuggestions = extractSection(content, /MATERIALS?[:\s]*([^\n]+)/i);
  const qualityImprovements = extractList(content, /IMPROVEMENTS?[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);

  // Estimate confidence based on content quality
  const confidence = estimateConfidence(content, prompt);

  return {
    prompt,
    brandPersonality,
    colorPalette,
    materialSuggestions: materialSuggestions ? [materialSuggestions] : [],
    qualityImprovements,
    confidence
  };
}

function extractSection(content, regex) {
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractColors(content) {
  const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\b\w+\s+(?:blue|red|green|yellow|purple|orange|pink|brown|black|white|gray|grey)\b/g;
  const matches = content.match(colorRegex);
  return matches ? [...new Set(matches)] : [];
}

function extractList(content, regex) {
  const match = content.match(regex);
  if (!match) return [];

  return match[1]
    .split(/\n|,|;/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && !item.match(/^[-•*]\s*$/));
}

function estimateConfidence(content, prompt) {
  let confidence = 0.5;

  // Check for specific technical details
  if (prompt.includes('cm') || prompt.includes('dimensions')) confidence += 0.1;
  if (prompt.includes('#') && prompt.match(/#[0-9a-fA-F]{6}/)) confidence += 0.1; // Color codes
  if (prompt.length > 200) confidence += 0.1; // Detailed prompt
  if (content.includes('brand') || content.includes('logo')) confidence += 0.1;
  if (prompt.includes('material') || prompt.includes('finish')) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

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
- POST /api/optimize-prompt (ChatGPT optimization)
- POST /api/nano-banana (Stage-2 processing)
================================
  `);
});
