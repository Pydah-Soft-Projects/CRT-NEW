import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { FilePlus, BarChart, LayoutDashboard, GraduationCap, Users, Activity, Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissionContext } from '../../contexts/PermissionContext'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

const SuperAdminSidebar = () => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissionContext()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle window resize to close mobile menu on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileMenuOpen])

  // Handle swipe gestures for mobile
  useEffect(() => {
    let startX = 0
    let currentX = 0

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX
    }

    const handleTouchMove = (e) => {
      currentX = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
      const diffX = startX - currentX
      
      // If swiped left more than 50px and menu is open, close it
      if (diffX > 50 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('touchstart', handleTouchStart)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobileMenuOpen])

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector('[data-sidebar]')
      const toggleButton = document.querySelector('[data-toggle-button]')
      
      if (isMobileMenuOpen && sidebar && !sidebar.contains(e.target) && !toggleButton?.contains(e.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const handleLogout = () => {
    try {
      logout()
      navigate('/login')
    } catch (error) {
      console.error('SuperAdminSidebar logout error:', error)
      navigate('/login')
    }
  }

  // All available portal pages
  const allNavLinks = [
    { name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Student Management', path: '/superadmin/students', icon: GraduationCap, module: 'students' },
    { name: 'Test Management', path: '/superadmin/tests', icon: FilePlus, module: 'tests' },
    { name: 'CRT & Versant', path: '/superadmin/crt-upload', icon: FilePlus, module: 'crt_upload' },
    { name: 'Results Management', path: '/superadmin/results', icon: BarChart, module: 'results' },
    { name: 'Progress Tracking', path: '/superadmin/progress-tracking', icon: Activity, module: 'progress_tracking' },
    { name: 'User Management', path: '/superadmin/user-management', icon: Users, module: 'user_management' },
  ]

  // Filter links dynamically based on read permission
  const navLinks = isSuperAdmin
    ? allNavLinks
    : allNavLinks.filter(link => link.module === 'dashboard' || hasPermission(link.module, 'read'))

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="flex h-screen">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          data-toggle-button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar - Always visible on large screens */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-white to-gray-50 shadow-2xl border-r border-gray-200">
          {/* Logo/Brand */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0"
          >
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Study Edge
            </h1>
            <p className="text-xs text-gray-600 font-medium capitalize">
              {user?.role_name || (user?.role === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal')}
            </p>

          </motion.div>

          <nav className="flex-1 flex flex-col justify-between min-h-0">
            <div className="flex flex-col space-y-1 px-4 mt-4 overflow-y-auto flex-1 pb-4">
              <div className="space-y-1">
                {navLinks.map((link, idx) => (
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden
                        ${isActive(link.path)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-50 hover:text-gray-900 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive(link.path) && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}

                      <link.icon className={`mr-3 h-4 w-4 transition-all duration-300 relative z-10
                        ${isActive(link.path)
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                        }`}
                      />
                      <span className="relative z-10 transition-all duration-300 group-hover:translate-x-1 font-semibold text-sm">
                        {link.name}
                      </span>

                      {/* Hover effect */}
                      {!isActive(link.path) && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </nav>
          
          {/* User Profile & Logout */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="px-4 pb-4 mt-auto flex-shrink-0"
          >
            {/* User Profile Card */}
            <Link
              to="/superadmin/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center mb-3 p-2.5 bg-gradient-to-r from-gray-50 to-blue-50/80 hover:from-blue-50 hover:to-indigo-50 border border-gray-200/80 rounded-2xl transition-all duration-200 group shadow-sm"
              title="View Profile"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0 text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {user?.name || 'Super Admin'}
                </p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {user?.role_name || user?.role?.replace('_', ' ') || 'Admin'}
                  </p>
                  {user?.emp_no && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold shrink-0">
                      <span>HRMS ID:</span>
                      <span>{user.emp_no}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => {
                handleLogout()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold px-3 py-2.5 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        data-sidebar
        initial={false}
        animate={{ 
          x: isMobileMenuOpen ? 0 : '-100%'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0"
        >
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Study Edge
          </h1>
          <p className="text-xs text-gray-600 font-medium capitalize">
            {user?.role_name || (user?.role === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal')}
          </p>

        </motion.div>

        <nav className="flex-1 flex flex-col justify-between min-h-0">
          <div className="flex flex-col space-y-1 px-4 mt-4 overflow-y-auto flex-1 pb-4">
            <div className="space-y-1">
              {navLinks.map((link, idx) => (
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden
                      ${isActive(link.path)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-50 hover:text-gray-900 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive(link.path) && (
                      <motion.div
                        layoutId="activeTabMobile"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <link.icon className={`mr-3 h-4 w-4 transition-all duration-300 relative z-10
                      ${isActive(link.path)
                        ? 'text-white'
                        : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                      }`}
                    />
                    <span className="relative z-10 transition-all duration-300 group-hover:translate-x-1 font-semibold text-sm">
                      {link.name}
                    </span>

                    {/* Hover effect */}
                    {!isActive(link.path) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Logout Button */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="px-4 pb-4 mt-auto flex-shrink-0"
        >
          <button
            onClick={() => {
              handleLogout()
              setIsMobileMenuOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold px-3 py-2.5 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </motion.div>
            Logout
          </button>
        </motion.div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 bg-gray-50 w-full lg:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Mobile menu header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">{user?.name}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SuperAdminSidebar
