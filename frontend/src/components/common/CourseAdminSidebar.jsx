import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import Sidebar from './Sidebar';

const DEFAULT_COURSE_NAV = [
  { section: 'MAIN', name: 'Dashboard', path: '/course-admin/dashboard', icon: 'LayoutDashboard' },
  { section: 'MANAGEMENT', name: 'Students', path: '/course-admin/students', icon: 'GraduationCap' },
  { section: 'MANAGEMENT', name: 'Tests', path: '/course-admin/tests', icon: 'FilePlus' },
  { section: 'REPORTS', name: 'Progress Tracking', path: '/course-admin/progress-tracking', icon: 'Activity' },
  { section: 'REPORTS', name: 'Reports', path: '/course-admin/reports', icon: 'BarChart' }
];

const CourseAdminSidebar = () => {
  const { user } = useAuth();
  const { generateNavLinks } = useFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const generatedItems = generateNavLinks(user?.role || 'course_admin');
  const navigationItems = (generatedItems && generatedItems.length > 0)
    ? generatedItems
    : DEFAULT_COURSE_NAV;

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
        navigationItems={navigationItems}
        portalTitle="Course Admin"
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
        {/* Header */}
        <header 
          className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm flex items-center h-16 px-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <img
                src="/campo-logos/campo_logo_transparent_hq.png"
                alt="Campo Logo"
                className="h-6 w-auto object-contain flex-shrink-0 lg:hidden"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button 
                type="button"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all duration-200 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[150px] truncate">
                  {user?.name || 'Course Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 w-full overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CourseAdminSidebar;
