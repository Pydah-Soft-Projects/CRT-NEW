import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { BookText, FileText, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const OnlineExams = () => {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const { error: showError } = useNotification()
  const [now, setNow] = useState(Date.now())
  const navigate = useNavigate()
  const [completedExamIds, setCompletedExamIds] = useState([])

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        const response = await api.get('/student/online-exams')
        setExams(response.data.data || [])
      } catch (err) {
        showError('Failed to load online exams. Please try again later.')
        setExams([])
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [showError])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch completed exams for the student
    const fetchCompleted = async () => {
      try {
        const res = await api.get('/student/completed-exams')
        setCompletedExamIds(res.data.data || [])
      } catch {
        setCompletedExamIds([])
      }
    }
    fetchCompleted()
  }, [])

  // Helper to format duration
  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Helper to get exam status and countdown
  const getExamStatus = (exam) => {
    const start = exam.startDateTime ? new Date(exam.startDateTime) : null
    const end = exam.endDateTime ? new Date(exam.endDateTime) : null
    if (!start || !end) return { status: 'invalid', message: 'Invalid exam timing' }
    if (now < start.getTime()) {
      // Not yet open
      const diff = start.getTime() - now
      return {
        status: 'upcoming',
        message: `Opens in ${formatDuration(diff)}`
      }
    } else if (now > end.getTime()) {
      // Already closed
      return { status: 'closed', message: 'Exam closed' }
    } else {
      // Open
      return { status: 'open', message: 'Exam is open' }
    }
  }

  // Sort exams: open first, then upcoming, then closed
  const sortedExams = exams.slice().sort((a, b) => {
    const aStatus = getExamStatus(a).status
    const bStatus = getExamStatus(b).status
    const order = { open: 0, upcoming: 1, closed: 2, invalid: 3 }
    return order[aStatus] - order[bStatus]
  })

  const handleExamClick = (exam) => {
    if (completedExamIds.includes(exam._id)) {
      showError('You have already submitted this test.');
      return;
    }
    const { status } = getExamStatus(exam);
    if (status === 'open') {
      navigate(`/student/exam/${exam._id}`);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-full space-y-3 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-base sm:text-2xl font-bold text-gray-900">Online Exams</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
          View and start your scheduled online exams.
        </p>
          
        <div className="mt-3 sm:mt-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : sortedExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {sortedExams.map((exam) => {
                const { status, message } = getExamStatus(exam)
                return (
                  <motion.div
                    key={exam._id}
                    className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full">
                          {exam.module_name}
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500">{exam.level_name}</span>
                      </div>
                      <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 leading-snug">{exam.name}</h2>
                      <div className="text-xs text-gray-600 mb-2 space-y-0.5">
                        {exam.startDateTime && exam.endDateTime ? (
                          <>
                            <div className="truncate"><span className="text-gray-400">From:</span> {formatDateTime(exam.startDateTime)}</div>
                            <div className="truncate"><span className="text-gray-400">To:</span> {formatDateTime(exam.endDateTime)}</div>
                          </>
                        ) : (
                          <span>Timing not set</span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold mb-1">
                        <span className={
                          status === 'open' ? 'text-green-600' :
                          status === 'upcoming' ? 'text-amber-600' :
                          'text-red-600'
                        }>
                          {message}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-600 font-medium">
                        {exam.question_count} Questions
                      </p>
                      <button
                        className={
                          `px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ` +
                          (completedExamIds.includes(exam._id)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : status === 'open'
                              ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm'
                              : 'bg-gray-300 cursor-not-allowed')
                        }
                        onClick={() => handleExamClick(exam)}
                        disabled={completedExamIds.includes(exam._id) || status !== 'open'}
                      >
                        {completedExamIds.includes(exam._id)
                          ? 'Submitted'
                          : status === 'open'
                            ? 'Start Exam'
                            : status === 'upcoming'
                              ? 'Upcoming'
                              : 'Closed'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 sm:py-16 px-4 sm:px-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200"
            >
              <div className="mx-auto bg-gray-100 h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h2 className="mt-3 sm:mt-4 text-base sm:text-xl font-semibold text-gray-800">No Online Exams Available</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                There are currently no online exams scheduled for you. Please check back later.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default OnlineExams 