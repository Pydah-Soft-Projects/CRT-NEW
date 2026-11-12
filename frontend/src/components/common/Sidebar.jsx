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
 * Matches the reference layout, styling, dimensions, colors, typography, animations,
 * and interactions while preserving 100% of existing project branding, navigation, and functionality.
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

  // Group items by section and ensure sections with no permitted items are excluded
  const groupedSections = rawItems.reduce((acc, item) => {
    if (item.hidden === true) return acc;
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

  // Active state checking with alias and subroute support
  const isActive = (itemPath, itemAliases = []) => {
    const target = itemPath || '';
    const current = location.pathname;
    if (target === '/student' || target === '/superadmin') {
      if (current === target || current === `${target}/`) return true;
    } else if (target && (current === target || current.startsWith(`${target}/`))) {
      return true;
    }
    if (itemAliases && itemAliases.length > 0) {
      return itemAliases.some(alias => {
        const a = alias.toLowerCase();
        if (a.startsWith('/')) {
          return current === a || current.startsWith(`${a}/`);
        }
        return current.endsWith(`/${a}`) || current.includes(`/${a}/`);
      });
    }
    return false;
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

  const userName = user?.name || 'Account';
  const userRole = user?.role_name || user?.role?.replace('_', ' ') || 'User';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Standardized Campo Enterprise Sidebar Container */}
      <aside
        data-sidebar
        className={`fixed top-0 left-0 bottom-0 z-40 border-r flex flex-col justify-between transition-all duration-200 ease-in-out font-['Plus_Jakarta_Sans',system-ui,-apple-system,sans-serif] ${
          isCollapsed ? 'w-[80px]' : 'w-[256px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
        style={{
          backgroundColor: 'var(--sidebar, #1E3150)',
          color: 'var(--sidebar-text, #FFFFFF)',
          borderColor: 'var(--border, rgba(255, 255, 255, 0.12))',
          boxShadow: '4px 0 24px -2px rgba(10, 20, 35, 0.45)'
        }}
      >
        {/* Floating Circular Collapse Button (Desktop Only) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute top-[106px] -right-[12px] z-50 w-[24px] h-[24px] rounded-full border items-center justify-center cursor-pointer transition-transform hover:scale-110 focus:outline-none"
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderColor: 'var(--border, rgba(255, 255, 255, 0.12))',
            color: 'var(--sidebar, #1E3150)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={14} strokeWidth={2.5} className="stroke-[2.5]" />
          ) : (
            <ChevronLeft size={14} strokeWidth={2.5} className="stroke-[2.5]" />
          )}
        </button>

        {/* Top Header - Centered Logo & Subtitle */}
        <div 
          className={`flex flex-col items-center justify-center text-center border-b relative flex-shrink-0 pt-[24px] pb-[16px] transition-all duration-200 ${
            isCollapsed ? 'px-[8px]' : 'px-[24px]'
          }`}
          style={{ borderColor: 'var(--border, rgba(255, 255, 255, 0.12))' }}
        >
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute top-4 right-3 p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--sidebar-text, #FFFFFF)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {isCollapsed ? (
            /* Collapsed state: 36px square favicon/logo with rounded corners */
            <img
              src="/campo-logos/favicon.svg"
              alt="Campo Logo"
              className="w-[36px] h-[36px] rounded-lg object-contain transition-all duration-200"
              onError={(e) => {
                e.currentTarget.src = '/campo-logos/favicon-32x32.png';
              }}
            />
          ) : (
            /* Expanded state: logo height 28px, max width 120px; subtitle has 8px top spacing */
            <>
              <img
                src="/campo-logos/campo_logo_transparent_hq.png"
                alt="Campo Logo"
                className="h-[28px] max-w-[120px] w-auto object-contain transition-all duration-200"
              />
              <span 
                className="text-[12px] font-medium leading-normal mt-[8px] truncate max-w-[200px] select-none"
                style={{ color: 'var(--sidebar-muted, #AABBD4)' }}
              >
                {getPortalSubtitle()}
              </span>
            </>
          )}
        </div>

        {/* Middle Navigation Section with Grouped Sections */}
        <nav 
          className="flex-1 overflow-y-auto space-y-[24px] overflow-x-hidden no-scrollbar"
          style={{ padding: '12px 14px 16px 14px' }}
        >
          {Object.entries(groupedSections).map(([sectionName, items]) => {
            if (!items || items.length === 0) return null;

            return (
              <div key={sectionName} className="space-y-[4px]">
                {/* Section Header Heading */}
                {!isCollapsed && (
                  <div 
                    className="px-[14px] pt-[4px] pb-[8px] text-[11px] font-bold uppercase tracking-[0.06em] select-none truncate"
                    style={{ color: 'var(--sidebar-muted, #AABBD4)' }}
                  >
                    {sectionName}
                  </div>
                )}

                {/* Items in Section */}
                <div className="space-y-[4px]">
                  {items.map((item) => {
                    const Icon = resolveIcon(item.icon);
                    const itemPath = item.path || item.href || '#';
                    const active = isActive(itemPath, item.aliases);
                    const iconSize = isCollapsed ? 20 : 18;

                    return (
                      <div key={item.name} className="relative group">
                        <Link
                          to={itemPath}
                          onClick={handleNavClick}
                          title={isCollapsed ? item.name : undefined}
                          className={`w-full flex items-center rounded-[12px] transition-all duration-200 cursor-pointer ${
                            isCollapsed 
                              ? 'justify-center px-0 py-[10px]' 
                              : 'px-[14px] py-[10px] gap-[14px]'
                          }`}
                          style={
                            active
                              ? {
                                  backgroundColor: 'var(--primary, #1677A8)',
                                  color: 'var(--sidebar-text, #FFFFFF)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  color: 'var(--sidebar-text, #FFFFFF)'
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <Icon 
                            size={iconSize} 
                            strokeWidth={2}
                            className={`shrink-0 transition-transform ${isCollapsed ? '' : 'stroke-[2]'}`}
                            style={{
                              color: active ? 'var(--sidebar-text, #FFFFFF)' : 'inherit'
                            }}
                          />
                          
                          {!isCollapsed && (
                            <span className={`truncate tracking-tight select-none text-[13px] ${
                              active ? 'font-semibold' : 'font-medium'
                            }`}>
                              {item.name}
                            </span>
                          )}
                        </Link>

                        {/* Tooltip on Hover in Collapsed Mode */}
                        {isCollapsed && (
                          <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                            <div 
                              className="px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap shadow-lg border"
                              style={{
                                backgroundColor: 'var(--sidebar, #1E3150)',
                                color: 'var(--sidebar-text, #FFFFFF)',
                                borderColor: 'var(--border, rgba(255, 255, 255, 0.12))'
                              }}
                            >
                              {item.name}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {children}
        </nav>

        {/* Bottom User Profile & Logout Floating Card */}
        {showUserProfile && user && (
          <div className="p-[14px] flex-shrink-0">
            <div 
              className={`flex items-center rounded-[16px] transition-all duration-200 ${
                isCollapsed 
                  ? 'justify-center h-[64px] px-2' 
                  : 'h-[64px] px-[14px] gap-[12px]'
              }`}
              title={isCollapsed ? `${userName} (${userRole})` : undefined}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.22)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {/* 40x40px Circular Avatar */}
              <div 
                className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: '#EBF5FB',
                  color: 'var(--sidebar, #1E3150)'
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span className="text-[14px] font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p 
                      className="text-[13px] font-bold truncate leading-tight"
                      style={{ color: 'var(--sidebar-text, #FFFFFF)' }}
                    >
                      {userName}
                    </p>
                    <p 
                      className="text-[11px] font-normal truncate leading-tight mt-0.5 capitalize"
                      style={{ color: 'var(--sidebar-muted, #AABBD4)' }}
                    >
                      {userRole}
                    </p>
                  </div>

                  {showLogout && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign out"
                      aria-label="Logout"
                      className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 opacity-80 hover:opacity-100"
                      style={{ color: 'var(--sidebar-muted, #AABBD4)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--sidebar-muted, #AABBD4)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <LogOut size={16} strokeWidth={2} className="stroke-[2]" />
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
