import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const PublicTest: React.FC = () => {
  const [testResult, setTestResult] = useState<{ endpoint: string; status: string; message: string; data?: unknown } | null>(null);

  const testEndpoint = async (endpoint: string, url: string, requiresAuth: boolean) => {
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          endpoint,
          status: 'SUCCESS',
          message: requiresAuth ? 'Unexpected success - this should require authentication!' : 'Access granted - No authentication required',
          data
        });
      } else if (response.status === 401) {
        setTestResult({
          endpoint,
          status: 'UNAUTHORIZED',
          message: 'Access denied - Authentication required (Expected behavior)',
        });
      } else if (response.status === 403) {
        setTestResult({ endpoint, status: 'FORBIDDEN', message: 'Access denied - Insufficient permissions' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestResult({ endpoint, status: 'ERROR', message: (errorData as { message?: string }).message || 'Request failed' });
      }
    } catch (error: unknown) {
      setTestResult({ endpoint, status: 'ERROR', message: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  const clearResults = () => {
    setTestResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">API Access Testing</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Test API Endpoints (Unauthenticated)</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Test different endpoints to see how authentication works. You are currently not logged in.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">About This Demo</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li><strong>Public Endpoint:</strong> Accessible to everyone (no authentication required)</li>
                    <li><strong>Protected Endpoint:</strong> Requires authentication (you'll get 401 Unauthorized)</li>
                    <li><strong>Admin Endpoint:</strong> Requires Admin role (you'll get 401 Unauthorized)</li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => testEndpoint('Public Endpoint', '/api/user/public', false)}
                    className="px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Test Public Endpoint ✓
                  </button>
                  <button
                    onClick={() => testEndpoint('Protected Endpoint', '/api/user/data', true)}
                    className="px-4 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Test Protected Endpoint 🔒
                  </button>
                  <button
                    onClick={() => testEndpoint('Admin Endpoint', '/api/user/admin', true)}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Test Admin Endpoint 🔒👑
                  </button>
                  {testResult && (
                    <button
                      onClick={clearResults}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Clear Result
                    </button>
                  )}
                </div>

                {testResult && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Test Result:</h4>
                    <div
                      className={`p-3 rounded-md border ${
                        testResult.status === 'SUCCESS'
                          ? 'bg-green-50 border-green-200'
                          : testResult.status === 'UNAUTHORIZED'
                          ? 'bg-yellow-50 border-yellow-200'
                          : testResult.status === 'FORBIDDEN'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {testResult.status === 'SUCCESS' && (
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {(testResult.status === 'UNAUTHORIZED' || testResult.status === 'FORBIDDEN') && (
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{testResult.endpoint}</p>
                          <p className={`text-sm mt-1 ${
                            testResult.status === 'SUCCESS' ? 'text-green-700' : testResult.status === 'UNAUTHORIZED' ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {testResult.message}
                          </p>
                          {testResult.data !== undefined && (
                            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-indigo-800 mb-2">Want to see more?</h4>
            <p className="text-sm text-indigo-700 mb-3">
              Sign up or log in to test role-based authorization with User and Admin roles.
            </p>
            <div className="flex space-x-2">
              <Link
                to="/signup"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
