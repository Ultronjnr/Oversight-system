import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on user role
        switch (user.role) {
          case 'Employee':
            navigate('/employee/portal');
            break;
          case 'HOD':
            navigate('/hod/portal');
            break;
          case 'Finance':
            navigate('/finance/portal');
            break;
          default:
            navigate('/login');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Oversight...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
