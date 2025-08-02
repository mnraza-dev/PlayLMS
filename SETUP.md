# PlayLMS Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- YouTube Data API key

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/playlms
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   YOUTUBE_API_KEY=your-youtube-api-key-here
   FRONTEND_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your backend `.env` file

## MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `playlms`
3. Update the `MONGODB_URI` in your backend `.env` file

## Features Implemented

### Backend ✅
- User authentication (JWT)
- Course management with YouTube playlist integration
- Progress tracking
- Gamification (XP, streaks, badges)
- User profiles and statistics
- API endpoints for all features

### Frontend ✅
- Modern React + TypeScript + Tailwind CSS
- Authentication pages (Login/Register)
- Dashboard with gamification features
- Course browsing and enrollment
- Video player with progress tracking
- User profile management
- Leaderboard and achievements
- Responsive design with dark mode

## Available Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/courses` - Browse courses
- `/courses/:slug` - Course details
- `/leaderboard` - Leaderboard

### Protected Routes
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/achievements` - User achievements
- `/create-course` - Create new course
- `/courses/:courseId/:moduleOrder` - Video player

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses/convert` - Convert YouTube playlist
- `GET /api/courses/:slug` - Get course details
- `POST /api/courses/:courseId/enroll` - Enroll in course

### Progress
- `GET /api/progress/:courseId` - Get user progress
- `POST /api/progress/:courseId/modules/:moduleOrder/watch` - Update watch progress
- `POST /api/progress/:courseId/modules/:moduleOrder/notes` - Add note

### Gamification
- `GET /api/gamification/dashboard` - Get gamification data
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/achievements` - Get achievements

## Next Steps

1. **Deploy Backend**: Deploy to Railway, Render, or similar
2. **Deploy Frontend**: Deploy to Vercel, Netlify, or similar
3. **Add Features**: Comments, social features, admin dashboard
4. **Optimize**: Performance, SEO, analytics
5. **Scale**: Database optimization, caching, CDN

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Libraries**: React Query, React Hook Form, Lucide Icons
- **APIs**: YouTube Data API v3
- **Deployment**: Vercel (frontend), Railway (backend) 