# 🚨 URGENT: Backend Setup Required

## The Problem
Your app is failing with **401 Unauthorized** errors because:
1. API keys were exposed in the browser (SECURITY BREACH)
2. We removed them for security
3. Now the app needs a backend proxy to work

## ⚡ Quick Fix (5 minutes)

### Step 1: Run Setup Script

**On Mac/Linux:**
```bash
./START-BACKEND.sh
```

**On Windows:**
```cmd
START-BACKEND.bat
```

### Step 2: Add Your API Keys

1. Open `backend/.env` in a text editor
2. Replace the placeholder values:
   ```env
   FAL_API_KEY=your-actual-fal-key-here
   OPENAI_API_KEY=your-actual-openai-key-here
   ```

3. Get your keys from:
   - **Fal.ai**: https://fal.ai/dashboard/keys
   - **OpenAI**: https://platform.openai.com/api-keys

### Step 3: Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
🔐 Secure Backend Proxy Running
================================
Port: 3001
API Status:
- Fal.ai: ✅ Configured
- OpenAI: ✅ Configured
```

### Step 4: Start Frontend (in a new terminal)

```bash
npm run dev
```

## ✅ Verification

1. Open browser DevTools → Network tab
2. Try generating an image
3. You should see requests to `localhost:3001` NOT direct to fal.ai
4. Check Console - no more 401 errors

## 🔴 If Still Getting Errors

### Check API Keys
```bash
# Verify Fal.ai key is valid
curl -X POST https://queue.fal.run/fal-ai/flux/dev \
  -H "Authorization: Key YOUR_FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

### Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid API key | Check key in backend/.env |
| 403 Forbidden | Rate limit or payment issue | Check Fal.ai dashboard |
| CORS error | Backend not running | Start backend server first |
| Connection refused | Wrong port | Ensure backend is on 3001 |

## 📦 Manual Setup (if scripts fail)

```bash
# 1. Install backend dependencies
cd backend
npm install express cors dotenv helmet express-rate-limit multer form-data node-fetch

# 2. Create .env file
echo "FAL_API_KEY=your-key" > .env
echo "OPENAI_API_KEY=your-key" >> .env
echo "PORT=3001" >> .env

# 3. Start backend
node server.js

# 4. Start frontend (new terminal)
cd ..
npm run dev
```

## 🔒 Security Notes

- **NEVER** commit backend/.env to git
- **NEVER** put API keys in frontend code
- **ALWAYS** use the backend proxy
- Add `backend/.env` to .gitignore

## 📞 Need Help?

If you're still having issues after following these steps:

1. Check backend logs for detailed errors
2. Verify API key permissions on Fal.ai dashboard
3. Ensure you have credits/balance on Fal.ai
4. Try regenerating your API keys
5. Check if your IP is rate-limited

## 🎯 Expected Result

After successful setup:
- ✅ No more 401/403 errors
- ✅ Images generate successfully
- ✅ API keys secure in backend
- ✅ No exposed credentials in browser

---

**Time Required**: 5-10 minutes
**Difficulty**: Easy
**Critical**: YES - App won't work without this!
