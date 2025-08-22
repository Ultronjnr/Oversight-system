import { useEffect, useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';

interface ProfessionalLoaderProps {
  isVisible: boolean;
  message?: string;
  type?: 'login' | 'logout' | 'loading';
}

const ProfessionalLoader = ({ 
  isVisible, 
  message = "Loading...", 
  type = "loading" 
}: ProfessionalLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = {
    login: [
      "Authenticating user...",
      "Loading dashboard...",
      "Preparing workspace...",
      "Welcome to Oversight!"
    ],
    logout: [
      "Saving session...",
      "Securing data...",
      "Logging out...",
      "See you soon!"
    ],
    loading: [
      "Processing request...",
      "Loading data...",
      "Almost ready...",
      "Complete!"
    ]
  };

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const stepDuration = 800; // 800ms per step
    const progressInterval = 50; // Update progress every 50ms
    const progressStep = 100 / (steps[type].length * (stepDuration / progressInterval));

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressStep;
        
        // Update current step based on progress
        const newStep = Math.floor((newProgress / 100) * steps[type].length);
        if (newStep !== currentStep && newStep < steps[type].length) {
          setCurrentStep(newStep);
        }

        return newProgress >= 100 ? 100 : newProgress;
      });
    }, progressInterval);

    return () => clearInterval(interval);
  }, [isVisible, type, currentStep, steps]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Loader Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Company Logo/Icon */}
        <div className="mb-8 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-2xl border-4 border-blue-200 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 animate-pulse" />
        </div>

        {/* Company Name */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Oversight
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Procurement Management System
        </p>

        {/* Progress Container */}
        <div className="w-80 mb-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {Math.round(progress)}%
            </span>
            <span className="text-sm text-gray-600">
              {currentStep + 1} / {steps[type].length}
            </span>
          </div>
        </div>

        {/* Current Step Message */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-800 mb-2">
            {steps[type][currentStep] || message}
          </p>
          
          {/* Loading Dots */}
          <div className="flex items-center justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center space-x-4">
          {steps[type].map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep 
                  ? 'bg-green-500 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <span className={`text-xs mt-2 max-w-16 text-center transition-colors duration-300 ${
                index <= currentStep ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {step.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Powered By */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            Powered by Oversight Procurement System
          </p>
        </div>
      </div>

      {/* Background Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-50/50 to-transparent" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60" />
      <div className="absolute top-40 right-32 w-3 h-3 bg-indigo-400 rounded-full animate-float-delayed opacity-60" />
      <div className="absolute bottom-40 left-32 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-60" />
    </div>
  );
};

// Add the required CSS animations
const styles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: float-delayed 3s ease-in-out infinite 1.5s;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ProfessionalLoader;
