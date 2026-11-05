import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNotification } from '../../contexts/NotificationContext'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import PracticeTestAttemptsModal from '../../components/student/PracticeTestAttemptsModal'
import PracticeAttemptDetailsModal from '../../components/student/PracticeAttemptDetailsModal'
import api from '../../services/api'
import { BookOpen, BrainCircuit, TrendingUp, Award, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Eye, Play } from 'lucide-react'

const ProgressTracker = () => {
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState(null)
  const [grammarResults, setGrammarResults] = useState([])
  const [vocabularyResults, setVocabularyResults] = useState([])
  const [practiceTests, setPracticeTests] = useState({})
  const [expandedSections, setExpandedSections] = useState({})
  const [selectedTest, setSelectedTest] = useState(null)
  const [showAttemptsModal, setShowAttemptsModal] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [showAttemptDetailsModal, setShowAttemptDetailsModal] = useState(false)
  const { error } = useNotification()

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(decimals)
    }
    const num = parseFloat(value || 0)
    return isNaN(num) ? '0.0' : num.toFixed(decimals)
  }

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      const [summaryRes, grammarRes, vocabularyRes, practiceRes] = await Promise.all([
        api.get('/student/progress-summary'),
        api.get('/student/grammar-detailed-results'),
        api.get('/student/vocabulary-detailed-results'),
        api.get('/student/practice-tests-summary')
      ])
      
      setProgressData(summaryRes.data.data)
      setGrammarResults(grammarRes.data.data)
      setVocabularyResults(vocabularyRes.data.data)
      setPracticeTests(practiceRes.data.data)
      
      // Debug logging
      console.log('Practice tests data received:', practiceRes.data.data)
      if (practiceRes.data.data && Object.keys(practiceRes.data.data).length > 0) {
        Object.keys(practiceRes.data.data).forEach(moduleId => {
          console.log(`Module ${moduleId}:`, practiceRes.data.data[moduleId])
          if (practiceRes.data.data[moduleId] && practiceRes.data.data[moduleId].length > 0) {
            practiceRes.data.data[moduleId].forEach(test => {
              console.log(`Test ${test.test_name} attempts:`, test.attempts)
            })
          }
        })
      }
      
    } catch (err) {
      error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getStatusColor = (status) => {
    return status === 'completed' ? 'text-green-600' : 'text-yellow-600'
  }

  const getStatusIcon = (status) => {
    return status === 'completed' ? <CheckCircle size={16} /> : <XCircle size={16} />
  }

  const handleTestClick = (test) => {
    setSelectedTest(test)
    setShowAttemptsModal(true)
  }

  const handleViewAttemptDetails = (attempt) => {
    setSelectedAttempt(attempt)
    setShowAttemptDetailsModal(true)
  }

  const handleCloseAttemptsModal = () => {
    setShowAttemptsModal(false)
    setSelectedTest(null)
  }

  const handleCloseAttemptDetailsModal = () => {
    setShowAttemptDetailsModal(false)
    setSelectedAttempt(null)
  }

  const handleBackToAttempts = () => {
    setShowAttemptDetailsModal(false)
    setSelectedAttempt(null)
    // Keep the attempts modal open
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getModuleDisplayName = (moduleId) => {
    const moduleNames = {
      'GRAMMAR': 'Grammar',
      'VOCABULARY': 'Vocabulary',
      'LISTENING': 'Listening',
      'SPEAKING': 'Speaking',
      'WRITING': 'Writing',
      'TECHNICAL': 'Technical',
      'CRT': 'CRT',
      'VERSANT': 'Versant'
    }
    return moduleNames[moduleId] || moduleId
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!progressData) {
    return (
      <div className="w-full">
        <p className="text-gray-600">No progress data found.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-3 sm:mb-6"
      >
        <h1 className="text-base sm:text-xl font-bold text-gray-900">
          Progress Tracker
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
          Track your progress across all practice modules
        </p>
      </motion.div>

      {/* Overall Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6"
      >
        <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-2.5 sm:p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Total Tests</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">
                {progressData.total_practice_tests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-2.5 sm:p-4">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-1.5 sm:p-2 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Modules</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">
                {progressData.modules?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-2.5 sm:p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-1.5 sm:p-2 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Best Score</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">
                {Math.max(...(progressData.modules?.map(m => m.highest_score) || [0]))}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-2.5 sm:p-4">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-1.5 sm:p-2 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">Last Activity</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {progressData.recent_activity?.[0]?.submitted_at ? 
                  new Date(progressData.recent_activity[0].submitted_at).toLocaleDateString() : 
                  'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module Progress Overview */}
      {progressData.modules && progressData.modules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-2.5 sm:mb-4">Module Progress</h2>
          <div className="space-y-2 sm:space-y-3">
            {progressData.modules.map((module, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900">{module.module_display_name}</h3>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                    {module.total_attempts} attempts
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-1.5 sm:mb-2">
                  <div
                    className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${module.progress_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
                  <span>Progress: {safeToFixed(module.progress_percentage)}%</span>
                  <span>Best: {safeToFixed(module.highest_score)}%</span>
                  <span>Avg: {safeToFixed(module.average_score)}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grammar Results */}
      {grammarResults.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('grammar')}
          >
            <div className="flex items-center">
              <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mr-2" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Grammar</h2>
            </div>
            {expandedSections.grammar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {expandedSections.grammar && (
            <div className="mt-3 space-y-2.5 sm:space-y-3">
              {grammarResults.map((category, index) => (
                <div key={index} className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                      {category.subcategory_display_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                        category.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {category.status === 'completed' ? 'Completed' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-2">
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-blue-600">{category.total_attempts}</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Attempts</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-green-600">{safeToFixed(category.highest_score)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Best</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-purple-600">{safeToFixed(category.average_score)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Avg</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-orange-600">{safeToFixed(category.accuracy)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Accuracy</p>
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <h4 className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5">Recent Tests</h4>
                    <div className="space-y-1">
                      {category.attempts.slice(0, 3).map((attempt, attemptIndex) => (
                        <div key={attemptIndex} className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="text-gray-600 truncate max-w-[60%]">{attempt.test_name}</span>
                          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                            <span className="font-semibold text-slate-800">{safeToFixed(attempt?.score)}%</span>
                            <span className="text-gray-400">
                              {new Date(attempt.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : practiceTests.GRAMMAR && practiceTests.GRAMMAR.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('grammar-practice')}
          >
            <div className="flex items-center">
              <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mr-2" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Grammar Practice Tests</h2>
            </div>
            {expandedSections['grammar-practice'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {expandedSections['grammar-practice'] && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {practiceTests.GRAMMAR.map((test, testIndex) => (
                <motion.div
                  key={test.test_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: testIndex * 0.05 }}
                  className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTestClick(test)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                      {test.test_name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestClick(test)
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 mb-2">
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Attempts:</span>
                      <span className="font-medium">{test.total_attempts}</span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Best:</span>
                      <span className={`font-semibold ${getScoreColor(test.highest_score)}`}>
                        {safeToFixed(test.highest_score)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Avg:</span>
                      <span className="font-medium">{safeToFixed(test.average_score)}%</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] sm:text-xs text-indigo-500 font-medium">
                      Click to view attempts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Vocabulary Results */}
      {vocabularyResults.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('vocabulary')}
          >
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Vocabulary</h2>
            </div>
            {expandedSections.vocabulary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {expandedSections.vocabulary && (
            <div className="mt-3 space-y-2.5 sm:space-y-3">
              {vocabularyResults.map((level, index) => (
                <div key={index} className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                      {level.level_display_name} Level
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                        level.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {level.status === 'completed' ? 'Completed' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-2">
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-blue-600">{level.total_attempts}</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Attempts</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-green-600">{safeToFixed(level.highest_score)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Best</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-purple-600">{safeToFixed(level.average_score)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Avg</p>
                    </div>
                    <div className="text-center p-1 sm:p-0 bg-slate-50 sm:bg-transparent rounded">
                      <p className="text-xs sm:text-lg font-bold text-orange-600">{safeToFixed(level.accuracy)}%</p>
                      <p className="text-[9px] sm:text-xs text-gray-500">Accuracy</p>
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <h4 className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5">Recent Tests</h4>
                    <div className="space-y-1">
                      {level.attempts.slice(0, 3).map((attempt, attemptIndex) => (
                        <div key={attemptIndex} className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="text-gray-600 truncate max-w-[60%]">{attempt.test_name}</span>
                          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                            <span className="font-semibold text-slate-800">{safeToFixed(attempt.score)}%</span>
                            <span className="text-gray-400">
                              {new Date(attempt.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : practiceTests.VOCABULARY && practiceTests.VOCABULARY.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('vocabulary-practice')}
          >
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Vocabulary Practice Tests</h2>
            </div>
            {expandedSections['vocabulary-practice'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {expandedSections['vocabulary-practice'] && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {practiceTests.VOCABULARY.map((test, testIndex) => (
                <motion.div
                  key={test.test_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: testIndex * 0.05 }}
                  className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTestClick(test)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                      {test.test_name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestClick(test)
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 mb-2">
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Attempts:</span>
                      <span className="font-medium">{test.total_attempts}</span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Best:</span>
                      <span className={`font-semibold ${getScoreColor(test.highest_score)}`}>
                        {safeToFixed(test.highest_score)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Avg:</span>
                      <span className="font-medium">{safeToFixed(test.average_score)}%</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] sm:text-xs text-indigo-500 font-medium">
                      Click to view attempts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Practice Test Modules - Show all modules with data */}
      {Object.keys(practiceTests)
        .filter(moduleId => practiceTests[moduleId] && practiceTests[moduleId].length > 0)
        .map((moduleId, moduleIndex) => (
        <motion.div
          key={moduleId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + moduleIndex * 0.1 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5 mb-3 sm:mb-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(`practice-${moduleId}`)}
          >
            <div className="flex items-center">
              <Play className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-2" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                {getModuleDisplayName(moduleId)}
              </h2>
            </div>
            {expandedSections[`practice-${moduleId}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {expandedSections[`practice-${moduleId}`] && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {practiceTests[moduleId].map((test, testIndex) => (
                <motion.div
                  key={test.test_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: testIndex * 0.05 }}
                  className="border border-gray-100 rounded-lg p-2.5 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTestClick(test)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                      {test.test_name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestClick(test)
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 mb-2">
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Attempts:</span>
                      <span className="font-medium">{test.total_attempts}</span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Best:</span>
                      <span className={`font-semibold ${getScoreColor(test.highest_score)}`}>
                        {safeToFixed(test.highest_score)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs text-gray-600">
                      <span>Avg:</span>
                      <span className="font-medium">{safeToFixed(test.average_score)}%</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] sm:text-xs text-indigo-500 font-medium">
                      Click to view attempts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Recent Activity */}
      {progressData.recent_activity && progressData.recent_activity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl sm:rounded-lg shadow-sm border border-slate-100 p-3 sm:p-5"
        >
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-4">Recent Activity</h2>
          <div className="space-y-1.5 sm:space-y-2">
            {progressData.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 sm:mr-3 shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-800">Completed practice test</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-700">
                    {safeToFixed(activity.average_score)}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {new Date(activity.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <PracticeTestAttemptsModal
        isOpen={showAttemptsModal}
        onClose={handleCloseAttemptsModal}
        test={selectedTest}
        onViewAttemptDetails={handleViewAttemptDetails}
      />

      <PracticeAttemptDetailsModal
        isOpen={showAttemptDetailsModal}
        onClose={handleCloseAttemptDetailsModal}
        attempt={selectedAttempt}
        onBack={handleBackToAttempts}
      />
    </div>
  )
}

export default ProgressTracker 
