import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home, Book, Calendar, BarChart2, PieChart, User, Menu, X, Bell, 
  ChevronLeft, ChevronRight, LogOut, Settings, HelpCircle, 
  FileText, BrainCircuit, Activity, Award, Clock, MessageSquare,
  FolderOpen, Grid3X3, Power, LayoutDashboard, FilePlus, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import { motion, AnimatePresence } from 'framer-motion';


const StudentSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { generateNavLinks, loading: featuresLoading } = useFeatures();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Default standard student navigation links
    const DEFAULT_STUDENT_NAV = [
        { name: 'Dashboard', path: '/student', icon: 'Home' },
        { name: 'Practice Tests', path: '/student/practice', icon: 'Book' },
        { name: 'CRT Modules', path: '/student/crt', icon: 'Book' },
        { name: 'Online Tests', path: '/student/exams', icon: 'Calendar' },
        { name: 'Progress', path: '/student/progress', icon: 'PieChart' },
        { name: 'Test History', path: '/student/history', icon: 'BarChart2' },
        { name: 'Profile', path: '/student/profile', icon: 'User' }
    ];

    // Generate navigation based on user features with guaranteed fallback
    const generatedItems = generateNavLinks(user?.role || 'student');
    const navigationItems = (generatedItems && generatedItems.length > 1) ? generatedItems : DEFAULT_STUDENT_NAV;
    
    // Debug logging
    console.log('🔍 User role:', user?.role);
    console.log('📋 Navigation items:', navigationItems);
    console.log('👤 User:', user);

    // Icon mapping for navigation items
    const iconMap = {
        'Home': Home,
        'Book': Book,
        'Calendar': Calendar,
        'BarChart2': BarChart2,
        'PieChart': PieChart,
        'User': User,
        'LayoutDashboard': LayoutDashboard,
        'FilePlus': FilePlus,
        'GraduationCap': GraduationCap,
        'FileText': FileText,
        'Clock': Clock,
        'Settings': Settings,
        'HelpCircle': HelpCircle
    };

    const handleLogout = () => {
        console.log('StudentSidebar logout initiated')
        try {
            logout();
            console.log('StudentSidebar logout successful')
            navigate('/login');
        } catch (error) {
            console.error('StudentSidebar logout error:', error)
            navigate('/login');
        }
    };


    const isActive = (path) => {
        if (path === '/student') {
            return location.pathname === '/student' || location.pathname === '/student/';
        }
        return location.pathname.startsWith(path);
    };

    const toggleSidebar = () => {
        if (isDesktop) {
            setIsCollapsed(!isCollapsed);
        } else {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            const newIsDesktop = window.innerWidth >= 1024;
            setIsDesktop(newIsDesktop);
            setWindowWidth(window.innerWidth);
            if (newIsDesktop && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobileMenuOpen]);


    return (
        <div className="flex w-full h-screen overflow-hidden">
            {/* Modern Collapsible Sidebar */}
            <motion.div
                initial={false}
                animate={{ 
                    width: isDesktop ? (isCollapsed ? 70 : 260) : (isMobileMenuOpen ? Math.min(260, windowWidth * 0.8) : 0),
                    x: isDesktop ? 0 : (isMobileMenuOpen ? 0 : -Math.min(260, windowWidth * 0.8))
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed top-0 left-0 h-screen z-50 flex flex-col min-h-0 ${
                    isDesktop ? 'translate-x-0' : (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full')
                }`}
                style={{ 
                    background: '#fefefe',
                    boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
            >
                {/* Header with User Profile */}
                <div className="p-2 sm:p-3 border-b border-gray-200/50 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"
                        >
                            <User className="w-5 h-5 text-white" />
                        </motion.div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{user?.name || 'Student'}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Student Portal</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!isDesktop && (
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-1 px-1 min-h-0 space-y-1">
                    {featuresLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-xs text-gray-500">Loading menu...</div>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {navigationItems && navigationItems.length > 0 ? (
                                navigationItems.map((item, index) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ 
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 100
                                        }}
                                    >
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`group flex items-center justify-center px-2 py-2 sm:py-3 mx-1 rounded-lg transition-all duration-300 relative ${
                                                isActive(item.path)
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                            }`}
                                        >
                                            {React.createElement(iconMap[item.icon] || Home, {
                                                className: `w-6 h-6 transition-all duration-300 ${
                                                    isActive(item.path) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                                                }`
                                            })}
                                            
                                            <AnimatePresence>
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex items-center justify-between flex-1 ml-3 overflow-hidden"
                                                    >
                                                        <span className="text-sm font-medium truncate">{item.name}</span>
                                                        {item.badge && (
                                                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-xs text-gray-500">No menu items available</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                    
                {/* Logout Button at Bottom */}
                <div className="p-2 sm:p-3 border-t border-gray-200/50 flex-shrink-0 space-y-2">
                                        {/* Sign Out */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 hover:shadow-lg transition-all duration-300 shadow-md"
                    >
                        <LogOut className="w-5 h-5" />
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-medium overflow-hidden"
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.div>

            {/* External Collapse/Expand Button (Desktop Only) */}
            {isDesktop && (
                <motion.button
                    initial={false}
                    animate={{ 
                        x: isCollapsed ? 0 : 0,
                        rotate: isCollapsed ? 0 : 180
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="fixed top-1/2 -translate-y-1/2 z-40 w-6 h-6 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:shadow-xl transition-all duration-300"
                    style={{ left: isCollapsed ? '66px' : '256px' }}
                >
                    <ChevronLeft className="w-3 h-3" />
                </motion.button>
            )}
            
            {/* Mobile Overlay */}
            <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            </AnimatePresence>
            
            {/* Main Content */}
            <div className={`flex-1 min-w-0 w-full bg-[#fefefe] transition-all duration-300 flex flex-col h-screen overflow-hidden ${
                isDesktop ? (isCollapsed ? 'ml-[70px]' : 'ml-[260px]') : 'ml-0'
            }`}>
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm flex items-center h-14 lg:h-16 px-3 sm:px-4 border-b border-gray-200/70 flex-shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <button
                                className="lg:hidden p-1.5 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition-all duration-200"
                                onClick={toggleSidebar}
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="flex items-center space-x-2 sm:space-x-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-xs sm:text-sm">
                                    SE
                                </div>
                                <span className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                                    Study Edge
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <button className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all duration-200">
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Content Area */}
                <div className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 xl:p-8 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default StudentSidebar;