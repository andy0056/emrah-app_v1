# 🚨 CRITICAL HOTFIX INSTRUCTIONS

## Issues Detected in Production
1. **CRITICAL**: API keys exposed in browser (Security Breach)
2. **CRITICAL**: Fal.ai API returning 403 Forbidden
3. **HIGH**: Dimensional Intelligence excessive recalculations
4. **MEDIUM**: Resource preloading failures

## Immediate Actions Required

### 1. Security Fix (DO THIS FIRST!)
```bash
# Step 1: Remove API keys from frontend
rm .env.local  # Remove if it contains API keys
cp env.example .env.local  # Use safe example

# Step 2: Set up backend proxy
mkdir backend
npm install express cors dotenv helmet express-rate-limit
# Copy backend/server.js from backend-setup.md

# Step 3: Create backend .env (NEVER commit this!)
echo "FAL_API_KEY=your-key-here" > backend/.env
echo "OPENAI_API_KEY=your-key-here" >> backend/.env

# Step 4: Start backend proxy
node backend/server.js
```

### 2. Fix Fal.ai 403 Error
1. Check your Fal.ai dashboard for:
   - API key validity
   - Rate limit status
   - Account balance
2. Regenerate API key if needed
3. Update backend/.env with new key

### 3. Performance Fixes

#### Update StandRequestForm.tsx to use memoization:
```typescript
import { PerformanceOptimizer } from '../utils/performanceOptimizer';

// In component, wrap dimensional intelligence calls:
const dimensionalResult = await PerformanceOptimizer.memoize(
  `dimensional-${JSON.stringify(formData)}`,
  () => DimensionalIntelligence.analyze(formData),
  30000 // Cache for 30 seconds
);
```

#### Update ImageGeneration.tsx:
```typescript
// Use debouncing for form changes
const debouncedGenerate = useMemo(
  () => PerformanceOptimizer.debounce(generateImages, 500),
  []
);
```

### 4. Fix Resource Preloading
Remove or lazy-load unused preloaded resources in index.html:
```html
<!-- Remove these if not used immediately -->
<link rel="preload" as="image" href="...">
```

## Verification Steps

### Check Security:
1. Open DevTools → Network → Check no API keys in requests
2. Open DevTools → Application → Local Storage → No API keys
3. Open DevTools → Console → No credential warnings

### Check Performance:
1. Console should show cache hits: "📊 Cache hit for: dimensional-..."
2. Dimensional Intelligence should run once per unique input
3. No 403 errors in network tab

### Test Generation:
```javascript
// In browser console, test proxy:
fetch('http://localhost:3001/api/proxy/fal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: 'fal-ai/flux/dev',
    payload: { prompt: 'test' }
  })
}).then(r => r.json()).then(console.log)
```

## Production Deployment Checklist

- [ ] Backend proxy deployed (Vercel/Netlify functions)
- [ ] Environment variables set in hosting platform
- [ ] Frontend has NO API keys
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring active

## Contact for Help
If issues persist after these fixes:
1. Check backend logs for errors
2. Verify API key permissions
3. Contact Fal.ai support if 403 continues
4. Review security logs for suspicious activity
