# Frontend Flow Test Guide

## 🧪 Testing Steps

### 1. **Start Backend Server**
```bash
cd backend
npm start
```

### 2. **Start Frontend Server**
```bash
cd frontend
npm run dev
```

### 3. **Test Authentication**
- Go to `http://localhost:5173/login`
- Login with valid credentials
- Verify you can access `/dashboard`

### 4. **Test Create Course Flow**
- Navigate to `http://localhost:5173/create-course`
- Paste this working playlist URL:
  ```
  https://www.youtube.com/playlist?list=PLWKjhJtqVAbnZtkAI3BqcYxKnfWn_C704
  ```
- Click "Preview Playlist"
- Should show:
  - ✅ Title: "Design Patterns - Beau teaches JavaScript"
  - ✅ Channel: freeCodeCamp.org
  - ✅ Videos: 4 videos
  - ✅ Duration: ~17 minutes
  - ✅ XP: 40 XP
  - ✅ Sample videos preview

### 5. **Test Course Creation**
- Fill in course details:
  - Category: "programming"
  - Difficulty: "beginner"
  - Tags: "javascript, design patterns"
  - Make public: ✅
- Click "Create Course"
- Should redirect to course page

## 🔍 Debugging

### If Preview Fails:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify `YOUTUBE_API_KEY` is set in `.env`
4. Test API directly: `node test-youtube-service.js`

### If Authentication Fails:
1. Check if user is logged in
2. Verify token in localStorage
3. Check AuthContext state

### If Network Fails:
1. Verify backend is running on port 5000
2. Check CORS settings
3. Verify API base URL in frontend

## ✅ Expected Results

### Successful Flow:
1. ✅ User logs in
2. ✅ User navigates to create course
3. ✅ User pastes playlist URL
4. ✅ Preview loads with course details
5. ✅ User configures course settings
6. ✅ Course is created successfully
7. ✅ User is redirected to course page

### Error Handling:
- ❌ Invalid URL → Shows validation error
- ❌ Private playlist → Shows "access denied" error
- ❌ Network error → Shows "failed to preview" error
- ❌ Not logged in → Redirects to login page 