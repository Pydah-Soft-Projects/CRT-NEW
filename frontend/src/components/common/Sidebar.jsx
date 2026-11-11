import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  Book,
  BookCopy,
  FileText, 
  BarChart,
  BarChart2,
  BarChart3, 
  PieChart,
  Settings,
  GraduationCap,
  Calendar,
  Award,
  Activity,
  FilePlus,
  Building2,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  X,
  LayoutDashboard,
  Clock,
  HelpCircle,
  PlusCircle,
  ArrowLeftRight,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { formatPhotoUrl } from '../../utils/photoUtils';

const iconMap = {
  Home,
  Book,
  BookOpen,
  BookCopy,
  Calendar,
  BarChart,
  BarChart2,
  BarChart3,
  PieChart,
  User,
  LayoutDashboard,
  LayoutGrid,
  FilePlus,
  GraduationCap,
  FileText,
  Clock,
  Settings,
  HelpCircle,
  Activity,
  Award,
  Users,
  Building2,
  BrainCircuit,
  PlusCircle,
  ArrowLeftRight,
  Layers
};

const resolveIcon = (icon) => {
  if (!icon) return LayoutDashboard;
  if (typeof icon === 'function' || typeof icon === 'object') return icon;
  if (typeof icon === 'string' && iconMap[icon]) return iconMap[icon];
  return LayoutDashboard;
};

/**
 * Standardized Enterprise Campo Design System Sidebar
 * Matched 1:1 with Campo Design System Visual Specifications
 */
const Sidebar = ({
  navigationItems: propNavItems,
  portalTitle,
  isCollapsed: controlledCollapsed,
  setIsCollapsed: setControlledCollapsed,
  isMobileOpen: controlledMobileOpen,
  setIsMobileOpen: setControlledMobileOpen,
  showUserProfile = true,
  showLogout = true,
  className = '',
  children
}) => {
  const { user, logout } = useAuth();
  const dashboardContext = useDashboard ? useDashboard() : {};
  const location = useLocation();
  const navigate = useNavigate();

  // Internal collapse state if not controlled externally
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setIsCollapsed = setControlledCollapsed || setInternalCollapsed;

  // Internal mobile menu state if not controlled externally
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = controlledMobileOpen !== undefined 
    ? controlledMobileOpen 
    : (dashboardContext.sidebarOpen !== undefined ? dashboardContext.sidebarOpen : internalMobileOpen);
  const setIsMobileOpen = setControlledMobileOpen 
    ? setControlledMobileOpen 
    : (dashboardContext.setSidebarOpen || setInternalMobileOpen);

  const [photoError, setPhotoError] = useState(false);
  const photoUrl = !photoError ? formatPhotoUrl(user?.photo || user?.student_photo) : null;

  // Role-based default navigation items if not supplied via props
  const getDefaultNavigationItems = () => {
    switch (user?.role) {
      case 'superadmin':
        return [
          { section: 'MAIN', name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
          { section: 'MANAGEMENT', name: 'Students', path: '/superadmin/students', icon: GraduationCap },
          { section: 'MANAGEMENT', name: 'Tests', path: '/superadmin/tests', icon: FilePlus },
          { section: 'MANAGEMENT', name: 'CRT & Versant', path: '/superadmin/crt-upload', icon: FilePlus },
          { section: 'ANALYTICS', name: 'Results', path: '/superadmin/results', icon: BarChart },
          { section: 'ANALYTICS', name: 'Progress', path: '/superadmin/progress-tracking', icon: Activity },
          { section: 'ADMINISTRATION', name: 'User Management', path: '/superadmin/user-management', icon: Users }
        ];

      case 'campus_admin':
        return [
          { section: 'MAIN', name: 'Dashboard', path: '/campus-admin/dashboard', icon: LayoutDashboard },
          { section: 'MANAGEMENT', name: 'Students', path: '/campus-admin/students', icon: GraduationCap },
          { section: 'MANAGEMENT', name: 'Tests', path: '/campus-admin/tests', icon: FilePlus },
          { section: 'REPORTS', name: 'Progress Tracking', path: '/campus-admin/progress-tracking', icon: Activity },
          { section: 'REPORTS', name: 'Reports', path: '/campus-admin/reports', icon: BarChart }
        ];

      case 'course_admin':
        return [
          { section: 'MAIN', name: 'Dashboard', path: '/course-admin/dashboard', icon: LayoutDashboard },
          { section: 'MANAGEMENT', name: 'Students', path: '/course-admin/students', icon: GraduationCap },
          { section: 'MANAGEMENT', name: 'Tests', path: '/course-admin/tests', icon: FilePlus },
          { section: 'REPORTS', name: 'Progress Tracking', path: '/course-admin/progress-tracking', icon: Activity },
          { section: 'REPORTS', name: 'Reports', path: '/course-admin/reports', icon: BarChart }
        ];

      case 'student':
        return [
          { section: 'MAIN', name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { section: 'PRACTICE & CRT', name: 'Practice Tests', path: '/student/practice', icon: BookOpen },
          { section: 'PRACTICE & CRT', name: 'CRT Modules', path: '/student/crt', icon: BrainCircuit },
          { section: 'PRACTICE & CRT', name: 'Online Exams', path: '/student/exams', icon: Calendar },
          { section: 'PERFORMANCE', name: 'Progress', path: '/student/progress', icon: Award },
          { section: 'PERFORMANCE', name: 'Test History', path: '/student/history', icon: Activity },
          { section: 'ACCOUNT', name: 'Profile', path: '/student/profile', icon: User }
        ];

      default:
        return [
          { section: 'MAIN', name: 'Dashboard', path: '/student', icon: LayoutDashboard }
        ];
    }
  };

  const rawItems = propNavItems && propNavItems.length > 0 
    ? propNavItems 
    : getDefaultNavigationItems();

  // Automatic section mapper fallback if items don't have explicit sections
  const getSectionForItem = (item) => {
    if (item.section) return item.section;
    const p = (item.path || '').toLowerCase();
    if (p.endsWith('/dashboard') || p === '/student') return 'MAIN';
    if (p.includes('/practice') || p.includes('/crt') || p.includes('/exams') || p.includes('/tests')) return 'PRACTICE & CRT';
    if (p.includes('/progress') || p.includes('/history') || p.includes('/results')) return 'ANALYTICS';
    if (p.includes('/profile') || p.includes('/settings')) return 'ACCOUNT';
    if (p.includes('/students') || p.includes('/book')) return 'MANAGEMENT';
    if (p.includes('/user-management') || p.includes('/users')) return 'ADMINISTRATION';
    if (p.includes('/reports')) return 'REPORTS';
    return 'MAIN';
  };

  // Group items by section
  const groupedSections = rawItems.reduce((acc, item) => {
    const sec = getSectionForItem(item);
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const getPortalSubtitle = () => {
    if (portalTitle) return portalTitle;
    switch (user?.role) {
      case 'superadmin':
        return 'Super Admin Portal';
      case 'campus_admin':
        return 'Campus Admin';
      case 'course_admin':
        return 'Course Admin';
      case 'student':
        return 'Student Portal';
      default:
        return user?.role_name || 'Enterprise Portal';
    }
  };

  const isActive = (itemPath) => {
    const target = itemPath || '';
    if (target === '/student' || target === '/superadmin') {
      return location.pathname === target || location.pathname === `${target}/`;
    }
    return location.pathname.startsWith(target);
  };

  const handleLogout = () => {
    try {
      if (logout) logout();
      if (setIsMobileOpen) setIsMobileOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Sidebar logout error:', err);
      navigate('/login');
    }
  };

  const handleNavClick = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Standardized Campo Enterprise Sidebar Container */}
      <aside
        data-sidebar
        className={`fixed top-0 left-0 bottom-0 z-40 border-r flex flex-col justify-between transition-all duration-300 ease-in-out font-['Plus_Jakarta_Sans',system-ui,-apple-system,sans-serif] ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
        style={{
          backgroundColor: 'var(--sidebar)',
          color: 'var(--sidebar-text)',
          borderColor: 'rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Floating Circular Collapse Button (Desktop Only) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-[92px] z-50 w-6 h-6 rounded-full shadow-md border items-center justify-center cursor-pointer transition-transform hover:scale-110 focus:outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--sidebar)'
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={14} className="stroke-[2.5]" />
          ) : (
            <ChevronLeft size={14} className="stroke-[2.5]" />
          )}
        </button>

        {/* Top Header - Centered Logo & Subtitle */}
        <div 
          className="flex flex-col items-center justify-center text-center pt-6 pb-4 border-b relative flex-shrink-0 px-3"
          style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
        >
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute top-4 right-3 p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--sidebar-text)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          <img
            src="/campo-logos/campo_logo_transparent_hq.png"
            alt="Campo Logo"
            className="h-7 w-auto object-contain mx-auto transition-all duration-300"
            style={{ maxWidth: isCollapsed ? '48px' : '120px' }}
          />

          {!isCollapsed && (
            <span 
              className="text-[12px] font-normal leading-normal mt-1 opacity-90 truncate max-w-[200px]"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              {getPortalSubtitle()}
            </span>
          )}
        </div>

        {/* Middle Navigation Section with Grouped Sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 overflow-x-hidden no-scrollbar">
          {Object.entries(groupedSections).map(([sectionName, items]) => (
            <div key={sectionName} className="space-y-1">
              {/* Section Header Heading */}
              {!isCollapsed && (
                <div 
                  className="text-[10px] font-bold tracking-wider uppercase px-3.5 pt-1.5 pb-1 select-none"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  {sectionName}
                </div>
              )}

              {/* Items in Section */}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  const itemPath = item.path || item.href || '#';
                  const active = isActive(itemPath);

                  return (
                    <Link
                      key={item.name}
                      to={itemPath}
                      onClick={handleNavClick}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex items-center rounded-xl transition-all duration-200 text-sm font-medium ${
                        isCollapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3.5 py-2.5 mx-1'
                      }`}
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--primary)',
                              color: 'var(--sidebar-text)'
                            }
                          : {
                              color: 'rgba(255, 255, 255, 0.88)'
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.88)';
                        }
                      }}
                    >
                      <Icon 
                        size={18} 
                        className={`shrink-0 transition-transform group-hover:scale-105 ${
                          isCollapsed ? '' : 'mr-3'
                        }`}
                        style={{
                          color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'
                        }}
                      />
                      
                      {!isCollapsed && (
                        <span className="truncate tracking-tight select-none text-[13.5px] font-semibold">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {children}
        </nav>

        {/* Bottom User Profile & Logout Floating Card */}
        {showUserProfile && user && (
          <div className="px-3 pb-4 pt-2 flex-shrink-0">
            <div 
              className={`flex items-center rounded-2xl transition-all ${
                isCollapsed ? 'justify-center p-2' : 'p-2.5'
              }`}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.22)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              {/* Circular Avatar */}
              <div 
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: '#EBF5FB',
                  color: 'var(--sidebar)'
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span className="text-sm font-black">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="ml-2.5 min-w-0 flex-1">
                    <p 
                      className="text-[12px] font-black uppercase tracking-tight truncate leading-tight"
                      style={{ color: 'var(--sidebar-text)' }}
                    >
                      {user?.name || 'Account'}
                    </p>
                    <p 
                      className="text-[11px] font-medium truncate leading-tight mt-0.5 capitalize"
                      style={{ color: 'var(--sidebar-muted)' }}
                    >
                      {user?.role_name || user?.role?.replace('_', ' ') || 'User'}
                    </p>
                  </div>

                  {showLogout && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign out"
                      className="ml-1 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                      style={{ color: 'var(--sidebar-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--sidebar-muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      aria-label="Logout"
                    >
                      <LogOut size={18} className="stroke-[2]" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
