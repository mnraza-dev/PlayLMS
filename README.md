# PlayLMS - YouTube Playlist to LMS Converter

A full-stack web application that converts YouTube playlists into structured learning courses with progress tracking, gamification, and a modern learning management system.

## 🚀 Features

### Core Features
- **Auto Course Generation**: Parse YouTube playlists and extract video titles, durations, and thumbnails
- **Video Player**: Embedded YouTube video player with progress tracking
- **Progress Tracking**: Mark videos as completed and show percentage completion
- **Streak System**: Track daily learning streaks with badges and rewards
- **Gamification**: XP points, achievements, and leaderboards
- **User Profiles**: View course history, progress, streaks, and earned XP
- **Authentication**: Sign up/login with email and password

### Advanced Features
- **Notes & Bookmarks**: Add timestamped notes and bookmarks to videos
- **Comments & Discussions**: Comment system for each module
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Real-time Progress**: Live progress updates and analytics
- **Course Categories**: Organize courses by subject and difficulty
- **Social Features**: Follow other learners and share courses

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **YouTube Data API v3** for playlist extraction
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **React Query** for data fetching
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hook Form** for forms
- **React Hot Toast** for notifications
- **Framer Motion** for animations

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- YouTube Data API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PlayLMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp backend/env.example backend/.env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/playlms
   JWT_SECRET=your-super-secret-jwt-key
   YOUTUBE_API_KEY=your-youtube-api-key
   ```

4. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### YouTube API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `playlms`
3. Update the `MONGODB_URI` in your `.env` file

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Course Endpoints
- `POST /api/courses/convert` - Convert YouTube playlist to course
- `GET /api/courses` - Get all courses with filtering
- `GET /api/courses/:slug` - Get course details
- `POST /api/courses/:courseId/enroll` - Enroll in course
- `POST /api/courses/:courseId/modules/:moduleOrder/complete` - Complete module

### Progress Endpoints
- `GET /api/progress/:courseId` - Get user progress
- `POST /api/progress/:courseId/modules/:moduleOrder/watch` - Update watch progress
- `POST /api/progress/:courseId/modules/:moduleOrder/notes` - Add note
- `POST /api/progress/:courseId/modules/:moduleOrder/bookmarks` - Add bookmark

### Gamification Endpoints
- `GET /api/gamification/dashboard` - Get gamification dashboard
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/achievements` - Get achievements
- `POST /api/gamification/challenges/:challengeId/claim` - Claim challenge reward

## 🎯 Usage

### Creating a Course
1. Sign up or log in to your account
2. Navigate to "Create Course"
3. Paste a YouTube playlist URL
4. Add course details (title, description, category)
5. Click "Create Course"

### Learning Experience
1. Browse available courses
2. Enroll in a course
3. Watch videos with progress tracking
4. Add notes and bookmarks
5. Complete modules to earn XP
6. Track your progress and achievements

## 🏗️ Project Structure

```
PlayLMS/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
└── README.md
```

## 🚀 Deployment

### Backend Deployment (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy the backend directory
4. Update frontend API URL

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube Data API for playlist extraction
- MongoDB for database
- React and Vite for frontend framework
- Tailwind CSS for styling
- Lucide for beautiful icons

## 📞 Support

For support, email __mnraza94@gmail.com__ or create an issue in the repository.

---

**PlayLMS** - Transform your YouTube playlists into structured learning experiences! 🎓 