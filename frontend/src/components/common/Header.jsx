import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboard } from '../../contexts/DashboardContext'
import { Bell, Menu, Search, User } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useDashboard()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    console.log('Header logout initiated')
    try {
      await logout()
      console.log('Header logout successful')
    } catch (error) {
      console.error('Header logout error:', error)
    } finally {
      setUserMenuOpen(false)
    }
  }

  return (
    <header className="z-40 bg-[var(--navbar,#FFFFFF)] shadow-sm flex items-center h-16 sm:h-20 px-2 sm:px-4 border-b border-[var(--navbar-border,var(--border,#DCEBF2))] flex-shrink-0">
      {/* Left: Hamburger menu */}
      <div className="flex items-center flex-shrink-0 mr-2">
        <button
          className="md:hidden p-3 rounded-md text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)] hover:bg-[var(--background,#F4FAFD)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
          onClick={toggleSidebar}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>
      {/* Center spacer */}
      <div className="flex-1 min-w-0"></div>
      {/* Right: Profile icon and menu */}
      {(user?.role === 'superadmin' || user?.role === 'campus_admin' || user?.role === 'course_admin' || user?.role === 'student') && (
        <div className="flex items-center space-x-6 flex-shrink-0">
          {/* Notifications - Only for superadmin */}
          {user?.role === 'superadmin' && (
            <button className="p-3 rounded-md text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)] hover:bg-[var(--background,#F4FAFD)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]">
              <Bell className="h-7 w-7" />
            </button>
          )}
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-4 p-3 rounded-md text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)] hover:bg-[var(--background,#F4FAFD)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
              >
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="hidden md:block text-lg font-medium text-[var(--text-primary,#183040)]">
                {user?.name}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--surface,#FFFFFF)] rounded-xl shadow-lg border border-[var(--border,#DCEBF2)] py-1 z-50">
                <div className="px-4 py-2 text-base text-[var(--text-primary,#183040)] border-b border-[var(--border,#DCEBF2)]">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-[var(--text-muted,#7D96A4)] capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Link
                  to={
                    user?.role === 'student' ? '/student/profile' : 
                    user?.role === 'superadmin' ? '/superadmin/profile' : 
                    user?.role === 'campus_admin' ? '/campus-admin/profile' : 
                    user?.role === 'course_admin' ? '/course-admin/profile' : 
                    '/profile'
                  }
                  className="block px-4 py-2 text-base text-[var(--text-primary,#183040)] hover:bg-[var(--primary-light,#F4FAFD)] transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base text-[var(--text-primary,#183040)] hover:bg-[var(--primary-light,#F4FAFD)] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header 