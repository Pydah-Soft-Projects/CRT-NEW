import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboard } from '../../contexts/DashboardContext'
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings,
  GraduationCap,
  Building,
  UserCheck,
  Calendar,
  Award,
  Activity,
  Plus,
  FilePlus,
  Building2,
  BarChart,
  BrainCircuit
} from 'lucide-react'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { sidebarOpen, closeSidebar } = useDashboard()
  const location = useLocation()
  const navigate = useNavigate()

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/superadmin', icon: Home }
    ]

    switch (user?.role) {
      case 'superadmin':
        return [
          { name: 'Dashboard', href: '/superadmin', icon: Home },
          { name: 'Modules', href: '/superadmin/tests', icon: FileText },
          { name: 'Settings', href: '/superadmin/settings', icon: Settings }
        ]
      
      case 'campus_admin':
        return [
          { name: 'Dashboard', href: '/campus-admin', icon: Home },
          { name: 'Students', href: '/campus-admin/students', icon: GraduationCap },
          { name: 'Results', href: '/campus-admin/results', icon: Award },
        ]
      
      case 'course_admin':
        return [
          ...baseItems,
          { name: 'Students', href: '/course-admin/students', icon: GraduationCap },
          { name: 'Progress', href: '/course-admin/progress', icon: Award },
          { name: 'Reports', href: '/course-admin/reports', icon: BarChart3 }
        ]
      
      case 'student':
        return [
          ...baseItems,
          { name: 'Practice Modules', href: '/student/practice', icon: FileText },
          { name: 'CRT Modules', href: '/student/crt', icon: BrainCircuit },
          { name: 'Online Exams', href: '/student/exams', icon: Calendar },
          { name: 'Test History', href: '/student/history', icon: Activity },
          { name: 'Progress', href: '/student/progress', icon: Award }
        ]
      
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  const quickActions = [

    {
      name: 'Create Module',
      href: '/superadmin/tests/create',
      icon: FilePlus,
      color: 'bg-green-600',
    },
    {
      name: 'Manage Campuses',
      href: '/superadmin/campuses',
      icon: Building2,
      color: 'bg-purple-600',
    },
  ]

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === href || location.pathname === '/superadmin' || location.pathname === '/campus-admin' || location.pathname === '/course-admin' || location.pathname === '/student'
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeSidebar}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={
          `fixed top-16 sm:top-20 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-4/5 max-w-xs bg-[var(--sidebar,#FFFFFF)] shadow-xl z-40 flex flex-col rounded-tr-3xl rounded-br-3xl border-r border-[var(--border,#DCEBF2)] text-[var(--sidebar-text,#183040)] transition-colors duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:w-64 lg:translate-x-0`
        }
        style={{ willChange: 'transform' }}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between h-14 px-3.5 bg-[#071C46] border-b border-white/10 rounded-tr-3xl">
          <img
            src="/campo-logos/campo_logo_transparent_hq.png"
            alt="Campo Logo"
            className="h-7 w-auto object-contain object-left"
          />
          <button
            className="lg:hidden ml-2 p-2 rounded-full text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ minWidth: 44, minHeight: 44 }}
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col space-y-0.5 px-3 mt-2">
            {navigationItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`group flex items-center px-3 py-1.5 text-base font-medium rounded-lg transition-all duration-300 animate-fade-in
                    ${isActive(item.href)
                      ? 'text-white shadow-md'
                      : 'text-[var(--sidebar-text,#183040)] hover:bg-[var(--primary-light,#F4FAFD)] hover:text-[var(--primary)] hover:shadow-xs'}
                  `}
                  style={isActive(item.href) ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${isActive(item.href) ? 'text-white' : 'text-[var(--text-muted,#7D96A4)] group-hover:text-[var(--primary)]'}`} />
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
        {/* User info at bottom */}
        <div className="px-4 pb-6 mt-auto">
          <div className="flex items-center bg-[var(--surface,#FFFFFF)] rounded-xl p-3 shadow-xs border border-[var(--border,#DCEBF2)] mb-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--text-primary,#183040)]">{user?.name}</p>
              <p className="text-xs text-[var(--text-muted,#7D96A4)] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-all duration-300 shadow-sm border border-[var(--border,#DCEBF2)] hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar 

export const SuperAdminSidebar = () => {
  const location = useLocation()
  const isActive = (href) => location.pathname.startsWith(href)

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-30 flex flex-col">
      <div className="flex items-center justify-center h-14 px-4 bg-[#071C46] border-b border-white/10">
        <img
          src="/campo-logos/campo_logo_transparent_hq.png"
          alt="Campo Logo"
          className="h-7 w-auto object-contain"
        />
      </div>
      <nav className="mt-2 px-3 flex-1">
        <div className="flex flex-col space-y-0.5 mb-4">
          <Link
            to="/superadmin"
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/superadmin') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Home className={`mr-3 h-5 w-5 ${isActive('/superadmin') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
            Dashboard
          </Link>

          <Link to="/superadmin/tests/create" className="flex items-center px-3 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 font-medium transition">
            <FilePlus className="h-5 w-5 mr-2" /> Module Creation
          </Link>
          <Link to="/superadmin/campuses" className="flex items-center px-3 py-2 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition">
            <Building2 className="h-5 w-5 mr-2" /> Administration
          </Link>
          <Link to="/superadmin/batch-creation" className="flex items-center px-3 py-2 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium transition">
            <BarChart className="h-5 w-5 mr-2" /> Batch Creation
          </Link>
        </div>
        {/* Any additional navigation for superadmin can go here */}
      </nav>
    </div>
  )
} 