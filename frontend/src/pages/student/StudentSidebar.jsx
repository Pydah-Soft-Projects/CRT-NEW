import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import { formatPhotoUrl } from '../../utils/photoUtils';
import Sidebar from '../../components/common/Sidebar';

const DEFAULT_STUDENT_NAV = [
  { section: 'MAIN', name: 'Dashboard', path: '/student', icon: 'LayoutDashboard' },
  { section: 'PRACTICE & CRT', name: 'Practice Tests', path: '/student/practice', icon: 'BookOpen' },
  { section: 'PRACTICE & CRT', name: 'CRT Modules', path: '/student/crt', icon: 'BrainCircuit' },
  { section: 'PRACTICE & CRT', name: 'Online Exams', path: '/student/exams', icon: 'Calendar' },
  { section: 'ANALYTICS', name: 'Progress', path: '/student/progress', icon: 'Award' },
  { section: 'ANALYTICS', name: 'Test History', path: '/student/history', icon: 'BarChart2' },
  { section: 'ACCOUNT', name: 'Profile', path: '/student/profile', icon: 'User' }
];

const StudentSidebar = () => {
  const { user } = useAuth();
  const { generateNavLinks, loading: featuresLoading } = useFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const photoUrl = !photoError ? formatPhotoUrl(user?.photo || user?.student_photo) : null;

  // Generate navigation based on user features with guaranteed fallback
  const generatedItems = generateNavLinks(user?.role || 'student');
  const navigationItems = (generatedItems && generatedItems.length > 1) 
    ? generatedItems 
    : DEFAULT_STUDENT_NAV;

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
    <div className="flex w-full max-w-full h-screen overflow-hidden touch-pan-y overscroll-x-none font-['Plus_Jakarta_Sans',system-ui,-apple-system,sans-serif]">
      {/* Standardized Campo Enterprise Sidebar */}
      <Sidebar
        navigationItems={navigationItems}
        portalTitle="Student Portal"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        showUserProfile={true}
        showLogout={true}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 min-w-0 w-full max-w-full bg-[#fefefe] transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden touch-pan-y overscroll-x-none ${
          isDesktop ? (isCollapsed ? 'ml-20' : 'ml-64') : 'ml-0'
        }`}
      >
        {/* Top Header Bar */}
        <header 
          className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm flex items-center h-14 lg:h-16 px-3 sm:px-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Hamburger Button (Mobile Only) */}
              <button
                type="button"
                className="lg:hidden p-1.5 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-2">
                <img
                  src="/campo-logos/campo_logo_transparent_hq.png"
                  alt="Campo Logo"
                  className="h-6 w-auto object-contain flex-shrink-0 lg:hidden"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                type="button"
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all duration-200 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs flex-shrink-0 border"
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    borderColor: 'var(--border)' 
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={user?.name || 'Student'}
                      className="w-full h-full object-cover"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-700 max-w-[140px] truncate">
                  {user?.name || 'Student'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content Area */}
        <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 xl:p-8 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar touch-pan-y overscroll-x-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentSidebar;
