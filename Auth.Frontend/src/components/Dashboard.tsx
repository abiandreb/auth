import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<{ endpoint: string; status: string; message: string; data?: unknown } | null>(null);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const testEndpoint = async (endpoint: string, fetchFn: () => Promise<unknown>) => {
    try {
      const response = await fetchFn();
      setTestResult({ endpoint, status: 'SUCCESS', message: 'Access granted', data: response });
      toast.success(`${endpoint}: Access granted`);
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          setTestResult({ endpoint, status: 'UNAUTHORIZED', message: 'Access denied - Authentication required' });
          toast.error(`${endpoint}: Unauthorized`);
        } else if (axiosError.response?.status === 403) {
          setTestResult({ endpoint, status: 'FORBIDDEN', message: 'Access denied - Insufficient permissions (Role required: Admin)' });
          toast.error(`${endpoint}: Forbidden - Admin role required`);
        } else {
          const message = axiosError.response?.data?.message || 'Request failed';
          setTestResult({ endpoint, status: 'ERROR', message });
          toast.error(`${endpoint}: ${message}`);
        }
      } else {
        setTestResult({ endpoint, status: 'ERROR', message: 'An error occurred' });
        toast.error(`${endpoint}: An error occurred`);
      }
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
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Logged in as {user?.email}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.email}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">First Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.firstName}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.lastName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user?.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user?.role || 'User'}
                    </span>
                  </dd>
                </div>
                {user?.gitHubUsername && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">GitHub Username</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.gitHubUsername}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">API Access Testing</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Test different endpoints to see authorization in action
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => testEndpoint('Public Endpoint', authService.getPublicData)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Test Public Endpoint
                  </button>
                  <button
                    onClick={() => testEndpoint('Protected Endpoint', authService.getProtectedData)}
                    className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Test Protected Endpoint
                  </button>
                  <button
                    onClick={() => testEndpoint('Admin Endpoint', authService.getAdminData)}
                    className="px-4 py-2 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Test Admin Endpoint
                  </button>
                  {testResult && (
                    <button
                      onClick={clearResults}
                      className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{testResult.endpoint}</p>
                          <p className={`text-sm mt-1 ${
                            testResult.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'
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
        </div>
      </main>
    </div>
  );
};
