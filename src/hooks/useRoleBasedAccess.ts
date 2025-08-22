import { useAuth } from '../contexts/AuthContext';

export const useRoleBasedAccess = () => {
  const { user } = useAuth();

  const canViewAllQuotes = () => {
    return user?.role === 'Finance' || user?.role === 'Admin' || user?.role === 'SuperUser';
  };

  const canExportQuotes = () => {
    return user?.role === 'Finance' || user?.role === 'Admin' || user?.role === 'SuperUser';
  };

  const canViewDepartmentQuotes = () => {
    return user?.role === 'HOD' || user?.role === 'Finance' || user?.role === 'Admin' || user?.role === 'SuperUser';
  };

  const canManageUsers = () => {
    return user?.role === 'Admin' || user?.role === 'SuperUser';
  };

  const canSendEmails = () => {
    return user?.role === 'Admin' || user?.role === 'SuperUser' ||
           (user?.permissions && user.permissions.includes('send_emails'));
  };

  const canManageSystem = () => {
    return user?.role === 'SuperUser';
  };

  const getAccessLevel = () => {
    switch (user?.role) {
      case 'Employee':
        return 'own';
      case 'HOD':
        return 'department';
      case 'Finance':
        return 'full';
      case 'Admin':
        return 'admin';
      case 'SuperUser':
        return 'super';
      default:
        return 'none';
    }
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'Employee':
        return 'Employee Dashboard';
      case 'HOD':
        return 'HOD Dashboard';
      case 'Finance':
        return 'Finance Dashboard';
      case 'Admin':
        return 'Admin Dashboard';
      case 'SuperUser':
        return 'Super Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return {
    canViewAllQuotes,
    canExportQuotes,
    canViewDepartmentQuotes,
    canManageUsers,
    canSendEmails,
    canManageSystem,
    getAccessLevel,
    getPageTitle,
    userRole: user?.role,
    userId: user?.id,
    userDepartment: user?.department || 'General',
    userPermissions: user?.permissions || []
  };
};
