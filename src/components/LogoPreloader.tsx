import React from 'react';

const LogoPreloader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Preloader Content */}
      <div className="relative z-10 text-center">
        {/* Logo Container with Pulse Animation */}
        <div className="mb-8 inline-block">
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse scale-100"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse scale-125 delay-300"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse scale-150 delay-500"></div>

            {/* Logo Image */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F75cb47fbaca646419953eca36b07cbc8%2Fefed5ff2c1664f0eb97bcf83de29ac4b?format=webp&width=800"
              alt="Oversight Logo"
              className="h-24 w-auto animate-pulse-slow drop-shadow-lg"
              style={{ animation: 'pulse-logo 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Loading</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Preparing your workspace...</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-logo {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }

        .delay-2000 {
          animation-delay: 2000ms;
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LogoPreloader;
