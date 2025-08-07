import React from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

/**
 * @param {boolean} isLoggedIn - Status login user
 * @param {string[]} userPermissions - Array permission milik user
 * @param {string} permission - Nama permission yang dibutuhkan page
 * @param {React.ReactNode} children - Komponen yang akan dirender jika lolos
 */
const ProtectedRoute = ({ isLoggedIn, userPermissions = [], permission, children }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !userPermissions.includes(permission)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 ">
        <div className="max-w-md w-full relative">
          {/* Animated shield icon */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-200 rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-orange-500 p-6 rounded-full shadow-2xl">
                <Shield className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Main content card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-100 p-8 text-center">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-red-500 mr-2" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Akses Ditolak
                </h2>
              </div>
              
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mb-6"></div>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-2">
                Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
              </p>
              
              <p className="text-gray-500 text-sm">
                Silakan hubungi administrator untuk mendapatkan akses yang diperlukan.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => window.history.back()}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali ke Halaman Sebelumnya
              </button>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-gray-200"
              >
                Ke Dashboard
              </button>
            </div>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-orange-200 rounded-full opacity-20 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 -right-5 w-12 h-12 bg-yellow-200 rounded-full opacity-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '2s'}}></div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;