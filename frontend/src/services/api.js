import axios from 'axios'
import toast from 'react-hot-toast'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshResponse = await api.post('/auth/refresh')
        const { token } = refreshResponse.data.data
        
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error('An unexpected error occurred')
    }
    return Promise.reject(error)
  }
)
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    password: '/auth/password',
  },

  courses: {
    list: '/courses',
    create: '/courses/convert',
    detail: (slug) => `/courses/${slug}`,
    enroll: (courseId) => `/courses/${courseId}/enroll`,
    rate: (courseId) => `/courses/${courseId}/rate`,
    completeModule: (courseId, moduleOrder) => `/courses/${courseId}/modules/${moduleOrder}/complete`,
    moduleDetail: (courseId, moduleOrder) => `/courses/${courseId}/modules/${moduleOrder}`,
    categories: '/courses/categories',
  },
  users: {
    profile: '/users/profile',
    publicProfile: (username) => `/users/${username}`,
    userCourses: (username) => `/users/${username}/courses`,
    achievements: (username) => `/users/${username}/achievements`,
    follow: (userId) => `/users/follow/${userId}`,
    unfollow: (userId) => `/users/follow/${userId}`,
    leaderboard: '/users/leaderboard',
    stats: '/users/stats',
  },
  progress: {
    detail: (courseId) => `/progress/${courseId}`,
    watch: (courseId, moduleOrder) => `/progress/${courseId}/modules/${moduleOrder}/watch`,
    addNote: (courseId, moduleOrder) => `/progress/${courseId}/modules/${moduleOrder}/notes`,
    addBookmark: (courseId, moduleOrder) => `/progress/${courseId}/modules/${moduleOrder}/bookmarks`,
    session: (courseId) => `/progress/${courseId}/session`,
    analytics: (courseId) => `/progress/${courseId}/analytics`,
    deleteNote: (courseId, moduleOrder, noteId) => `/progress/${courseId}/modules/${moduleOrder}/notes/${noteId}`,
    deleteBookmark: (courseId, moduleOrder, bookmarkId) => `/progress/${courseId}/modules/${moduleOrder}/bookmarks/${bookmarkId}`,
  },
  gamification: {
    dashboard: '/gamification/dashboard',
    leaderboard: '/gamification/leaderboard',
    challenges: '/gamification/challenges',
    claimChallenge: (challengeId) => `/gamification/challenges/${challengeId}/claim`,
    achievements: '/gamification/achievements',
    stats: '/gamification/stats',
  },
}
export const apiHelpers = {
  getCourses: async (params = {}) => {
    const response = await api.get(endpoints.courses.list, { params })
    return response.data
  },
  
  getCourse: async (slug) => {
    const response = await api.get(endpoints.courses.detail(slug))
    return response.data
  },
  
  createCourse: async (courseData) => {
    const response = await api.post(endpoints.courses.create, courseData)
    return response.data
  },
  
  enrollInCourse: async (courseId) => {
    const response = await api.post(endpoints.courses.enroll(courseId))
    return response.data
  },
  
  completeModule: async (courseId, moduleOrder) => {
    const response = await api.post(endpoints.courses.completeModule(courseId, moduleOrder))
    return response.data
  },
  
  rateCourse: async (courseId, rating, review) => {
    const response = await api.post(endpoints.courses.rate(courseId), { rating, review })
    return response.data
  },
  
  getUserProfile: async () => {
    const response = await api.get(endpoints.users.profile)
    return response.data
  },
  
  updateUserProfile: async (userData) => {
    const response = await api.put(endpoints.users.profile, userData)
    return response.data
  },
  
  getUserStats: async () => {
    const response = await api.get(endpoints.users.stats)
    return response.data
  },
  
  getProgress: async (courseId) => {
    const response = await api.get(endpoints.progress.detail(courseId))
    return response.data
  },
  
  updateWatchProgress: async (courseId, moduleOrder, watchTime, isCompleted) => {
    const response = await api.post(endpoints.progress.watch(courseId, moduleOrder), {
      watchTime,
      isCompleted,
    })
    return response.data
  },
  
  addNote: async (courseId, moduleOrder, content, timestamp) => {
    const response = await api.post(endpoints.progress.addNote(courseId, moduleOrder), {
      content,
      timestamp,
    })
    return response.data
  },
  
  addBookmark: async (courseId, moduleOrder, timestamp, title) => {
    const response = await api.post(endpoints.progress.addBookmark(courseId, moduleOrder), {
      timestamp,
      title,
    })
    return response.data
  },
  
  // Gamification helpers
  getGamificationDashboard: async () => {
    const response = await api.get(endpoints.gamification.dashboard)
    return response.data
  },
  
  getLeaderboard: async (type = 'xp', limit = 10) => {
    const response = await api.get(endpoints.gamification.leaderboard, {
      params: { type, limit },
    })
    return response.data
  },
  
  getChallenges: async () => {
    const response = await api.get(endpoints.gamification.challenges)
    return response.data
  },
  
  claimChallenge: async (challengeId) => {
    const response = await api.post(endpoints.gamification.claimChallenge(challengeId))
    return response.data
  },
  
  getAchievements: async () => {
    const response = await api.get(endpoints.gamification.achievements)
    return response.data
  },
  
  getGamificationStats: async () => {
    const response = await api.get(endpoints.gamification.stats)
    return response.data
  },
}
export default api 