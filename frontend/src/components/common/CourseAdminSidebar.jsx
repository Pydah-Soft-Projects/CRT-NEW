import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, GraduationCap, Users, 
  FilePlus, BarChart, Activity, LogOut, BookOpen
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useFeatures } from '../../contexts/FeatureContext'
import { motion } from 'framer-motion'
import api from '../../services/api'

const CourseAdminSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { generateNavLinks, loading: featuresLoading } = useFeatures()
  const [userPermissions, setUserPermissions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserPermissions()
  }, [user])

  const fetchUserPermissions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get user's full permissions from the backend
      const userResponse = await api.get(`/user-management/${user.id || user._id}`)
      const permissions = userResponse.data.data?.permissions || {}
      
      setUserPermissions(permissions)
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
      // Use default permissions for course admin
      setUserPermissions({
        modules: ['dashboard', 'batch_management', 'student_management', 'test_management', 'results_management', 'progress_tracking', 'reports'],
        can_create_campus: false,
        can_create_course: false,
        can_create_batch: true,
        can_manage_users: false,
        can_manage_tests: true,
        can_view_all_data: false
      })
    } finally {
      setLoading(false)
    }
  }

  // Define navigation based on course admin permissions
  const getNavigation = () => {
    if (loading || !userPermissions || featuresLoading) {
      return []
    }

    // Get feature-based navigation
    const featureNavLinks = generateNavLinks('course_admin')
    
    // Map icon names to actual components
    const iconMap = {
      LayoutDashboard,
      GraduationCap,
      Users,
      FilePlus,
      BarChart,
      Activity,
      BookOpen
    }
    
    const navigation = featureNavLinks.map(link => ({
      ...link,
      icon: iconMap[link.icon] || LayoutDashboard
    }))

    // Filter by permissions as well
    return navigation.filter(link => {
      const moduleMap = {
        'dashboard': 'dashboard',
        'batch_management': 'batch_management',
        'student_management': 'student_management',
        'test_management': 'test_management',
        'progress_tracking': 'progress_tracking',
        'reports': 'reports'
      }
      
      const requiredModule = moduleMap[link.feature]
      return !requiredModule || userPermissions.modules?.includes(requiredModule)
    })
  }

  const navigation = getNavigation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  if (loading) {
    return (
      <div className="flex">
        <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
          </div>
        </div>
        <div className="ml-64 flex-1 bg-gray-50 w-full">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200"
      >
        {/* Logo/Brand */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className="px-3.5 py-3 border-b border-white/10 bg-[#071C46]"
        >
          <img
            src="/campo-logos/campo_logo_transparent_hq.png"
            alt="Campo"
            className="h-7 w-auto object-contain object-left"
          />
          <p className="text-[11px] text-white/75 font-medium mt-0.5">Course Admin Portal</p>
        </motion.div>

        <nav className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col space-y-0.5 px-3 mt-2">
            {navigation.map((link, idx) => (
              <motion.div
                key={link.name}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 * idx, type: 'spring', stiffness: 80, damping: 18 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={link.path}
                  style={isActive(link.path) ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}
                  className={`group flex items-center px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden
                    ${isActive(link.path)
                      ? 'text-white shadow-md'
                      : 'text-[var(--sidebar-text,#183040)] hover:bg-[var(--primary-light,#F4FAFD)] hover:text-[var(--primary)] hover:shadow-sm'}
                  `}
                >
                  {/* Active indicator */}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <link.icon className={`mr-3 h-5 w-5 transition-all duration-300 relative z-10
                    ${isActive(link.path) 
                      ? 'text-white' 
                      : 'text-[var(--text-muted,#7D96A4)] group-hover:text-[var(--primary)] group-hover:scale-110'
                    }`} 
                  />
                  <span className="relative z-10 transition-all duration-300 group-hover:translate-x-1 font-semibold">
                    {link.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="px-4 pb-6 mt-auto"
        >
          <div className="flex items-center mb-4 p-3 bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-xl shadow-xs">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-[var(--text-primary,#183040)]">{user?.name}</p>
              <p className="text-xs text-[var(--text-muted,#7D96A4)]">Course Admin</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white font-semibold px-4 py-3 rounded-xl hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <LogOut className="h-5 w-5" />
            </motion.div>
            Logout
          </button>
        </motion.div>
      </motion.div>
      <div className="ml-64 flex-1 bg-gray-50 w-full flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CourseAdminSidebar 