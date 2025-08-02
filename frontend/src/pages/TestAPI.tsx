import React, { useState } from 'react';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const TestAPI: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      setResult({ type: 'auth', data: response.data });
      toast.success('Authentication successful!');
    } catch (error: any) {
      console.error('Auth error:', error);
      setResult({ type: 'auth_error', error: error.response?.data || error.message });
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testPreview = async () => {
    setIsLoading(true);
    const testUrl = 'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMzZVbL9XE3GhU5cNd';
    try {
      const response = await api.post('/courses/preview', { playlistUrl: testUrl });
      setResult({ type: 'preview', data: response.data });
      toast.success('Preview successful!');
    } catch (error: any) {
      console.error('Preview error:', error);
      setResult({ type: 'preview_error', error: error.response?.data || error.message });
      toast.error('Preview failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkToken = () => {
    const token = localStorage.getItem('token');
    setResult({ type: 'token', data: { hasToken: !!token, token: token ? 'Present' : 'Missing' } });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={checkToken}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Check Token
        </button>
        
        <button 
          onClick={testAuth}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Authentication
        </button>
        
        <button 
          onClick={testPreview}
          disabled={isLoading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Preview (Sample URL)
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
