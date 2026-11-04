import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FeatureProvider } from './contexts/FeatureContext'
import { PermissionProvider } from './contexts/PermissionContext'

// Components
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import NotificationToast from './components/common/NotificationToast'
import ActiveExamAutoOpener from './components/student/ActiveExamAutoOpener'

const Login = lazy(() => import('./pages/auth/Login'))
const GetStarted = lazy(() => import('./pages/auth/GetStarted'))
const SSOLogin = lazy(() => import('./pages/auth/SSOLogin'))
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'))
const TestManagement = lazy(() => import('./pages/superadmin/TestManagement'))
const StudentManagement = lazy(() => import('./pages/superadmin/StudentManagement'))
const ResultsManagement = lazy(() => import('./pages/superadmin/ResultsManagement'))
const CRTUpload = lazy(() => import('./pages/superadmin/CRTUpload'))
const ProgressTracking = lazy(() => import('./pages/superadmin/ProgressTracking'))
const UserManagement = lazy(() => import('./pages/superadmin/UserManagement'))
const CampusAdminDashboard = lazy(() => import('./pages/campus-admin/CampusAdminDashboard'))
const CampusStudentManagement = lazy(() => import('./pages/campus-admin/CampusStudentManagement'))
const CampusReports = lazy(() => import('./pages/campus-admin/CampusReports'))
const CourseAdminDashboard = lazy(() => import('./pages/course-admin/CourseAdminDashboard'))
const CourseStudentManagement = lazy(() => import('./pages/course-admin/CourseStudentManagement'))
const StudentProgress = lazy(() => import('./pages/course-admin/StudentProgress'))
const CourseReports = lazy(() => import('./pages/course-admin/CourseReports'))
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const PracticeModules = lazy(() => import('./pages/student/PracticeModules'))
const CRTModules = lazy(() => import('./pages/student/CRTModules'))
const OnlineExams = lazy(() => import('./pages/student/OnlineExams'))
const TestHistory = lazy(() => import('./pages/student/TestHistory'))
const ProgressTracker = lazy(() => import('./pages/student/ProgressTracker'))
const StudentProfile = lazy(() => import('./pages/student/Profile'))
const SuperAdminProfile = lazy(() => import('./pages/superadmin/Profile'))
const OnlineExamTaking = lazy(() => import('./pages/student/OnlineExamTaking'))
const PracticeModuleTaking = lazy(() => import('./pages/student/PracticeModuleTaking'))
const TechnicalTestTaking = lazy(() => import('./pages/student/TechnicalTestTaking'))
const WritingTestTaking = lazy(() => import('./pages/student/WritingTestTaking'))
const TestResult = lazy(() => import('./pages/student/TestResult'))
const SuperAdminSidebar = lazy(() => import('./components/common/SuperAdminSidebar'))
const CampusAdminSidebar = lazy(() => import('./components/common/CampusAdminSidebar'))
const CourseAdminSidebar = lazy(() => import('./components/common/CourseAdminSidebar'))
const StudentSidebar = lazy(() => import('./pages/student/StudentSidebar'))

function AppContent() {
  const location = useLocation()
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login'
  
  return (
    <div className={isPublicRoute ? "min-h-screen bg-gray-50 overflow-y-auto" : "h-screen bg-gray-50 overflow-hidden"}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <NotificationToast />
      <ActiveExamAutoOpener />
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<GetStarted />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sso-login" element={<SSOLogin />} />

          {/* Admin Routes */}
          {/* Super Admin & Staff Portal Routes */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin', 'campus_admin', 'course_admin', 'staff']}><SuperAdminSidebar /></ProtectedRoute>}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="results" element={<ResultsManagement />} />
            <Route path="progress-tracking" element={<ProgressTracking />} />
            <Route path="tests" element={<TestManagement />} />
            <Route path="tests/create" element={<TestManagement />} />
            <Route path="question-bank-upload" element={<Navigate to="/superadmin/crt-upload" replace />} />
            <Route path="crt-upload" element={<CRTUpload />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="profile" element={<SuperAdminProfile />} />
          </Route>

          {/* Campus Admin Routes */}
          <Route path="/campus-admin" element={<ProtectedRoute allowedRoles={['campus_admin']}><CampusAdminSidebar /></ProtectedRoute>}>
            <Route index element={<CampusAdminDashboard />} />
            <Route path="dashboard" element={<CampusAdminDashboard />} />
            <Route path="students" element={<CampusStudentManagement />} />
            <Route path="tests" element={<TestManagement />} />
            <Route path="progress-tracking" element={<ProgressTracking />} />
            <Route path="results" element={<Navigate to="/campus-admin/reports" replace />} />
            <Route path="reports" element={<CampusReports />} />
            <Route path="profile" element={<SuperAdminProfile />} />
          </Route>

          {/* Course Admin Routes */}
          <Route path="/course-admin" element={<ProtectedRoute allowedRoles={['course_admin']}><CourseAdminSidebar /></ProtectedRoute>}>
            <Route index element={<CourseAdminDashboard />} />
            <Route path="dashboard" element={<CourseAdminDashboard />} />
            <Route path="students" element={<CourseStudentManagement />} />
            <Route path="tests" element={<TestManagement />} />
            <Route path="progress-tracking" element={<ProgressTracking />} />
            <Route path="results" element={<Navigate to="/course-admin/reports" replace />} />
            <Route path="reports" element={<CourseReports />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="profile" element={<SuperAdminProfile />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentSidebar /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="practice" element={<PracticeModules />} />
            <Route path="crt" element={<CRTModules />} />
            <Route path="exams" element={<OnlineExams />} />
            <Route path="history" element={<TestHistory />} />
            <Route path="progress" element={<ProgressTracker />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="test-result/:resultId" element={<TestResult />} />
            <Route path="practice-modules/:testId" element={<PracticeModuleTaking />} />
            <Route path="technical-test/:testId" element={<TechnicalTestTaking />} />
            <Route path="writing-test/:testId" element={<WritingTestTaking />} />
          </Route>

          {/* Exam Taking Routes - No Sidebar */}
          <Route path="/student/exam" element={<ProtectedRoute allowedRoles={['student']}><OnlineExamTaking /></ProtectedRoute>} />
          <Route path="/student/exam/:testId" element={<ProtectedRoute allowedRoles={['student']}><OnlineExamTaking /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PermissionProvider>
          <DashboardProvider>
            <NotificationProvider>
              <FeatureProvider>
                <AppContent />
              </FeatureProvider>
            </NotificationProvider>
          </DashboardProvider>
        </PermissionProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
