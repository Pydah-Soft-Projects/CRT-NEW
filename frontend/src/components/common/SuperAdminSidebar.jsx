import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Menu, 
  LayoutDashboard, 
  GraduationCap, 
  FilePlus, 
  BarChart, 
  Activity, 
  Users 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissionContext } from '../../contexts/PermissionContext';
import Sidebar from './Sidebar';

const SuperAdminSidebar = () => {
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissionContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allNavLinks = [
    { section: 'MAIN', name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { section: 'MANAGEMENT', name: 'Student Management', path: '/superadmin/students', icon: GraduationCap, module: 'students' },
    { section: 'MANAGEMENT', name: 'Test Management', path: '/superadmin/tests', icon: FilePlus, module: 'tests' },
    { section: 'MANAGEMENT', name: 'CRT & Versant', path: '/superadmin/crt-upload', icon: FilePlus, module: 'crt_upload' },
    { section: 'ANALYTICS', name: 'Results Management', path: '/superadmin/results', icon: BarChart, module: 'results' },
    { section: 'ANALYTICS', name: 'Progress Tracking', path: '/superadmin/progress-tracking', icon: Activity, module: 'progress_tracking' },
    { section: 'ADMINISTRATION', name: 'User Management', path: '/superadmin/user-management', icon: Users, module: 'user_management' },
  ];

  const navLinks = isSuperAdmin
    ? allNavLinks
    : allNavLinks.filter(link => link.module === 'dashboard' || hasPermission(link.module, 'read'));

  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(newIsDesktop);
      if (newIsDesktop && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex w-full max-w-full h-screen overflow-hidden font-['Plus_Jakarta_Sans',system-ui,-apple-system,sans-serif]">
      {/* Standardized Campo Enterprise Sidebar */}
      <Sidebar
        navigationItems={navLinks}
        portalTitle={user?.role === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal'}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        showUserProfile={true}
        showLogout={true}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 min-w-0 w-full max-w-full bg-[#fefefe] transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden ${
          isDesktop ? (isCollapsed ? 'ml-20' : 'ml-64') : 'ml-0'
        }`}
      >
        {/* Mobile Header */}
        <div 
          className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
              {user?.name || 'Admin'}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
