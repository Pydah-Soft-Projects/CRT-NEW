import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle, XCircle, Eye, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TestProgressChart from './TestProgressChart';

const PracticeTestAttemptsModal = ({ isOpen, onClose, test, onViewAttemptDetails }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { error } = useNotification();

  useEffect(() => {
    if (isOpen && test?.test_id) {
      fetchAttempts();
    }
  }, [isOpen, test]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/practice-test-attempts/${test.test_id}`);
      if (response.data.success) {
        setAttempts(response.data.data.attempts || []);
      } else {
        error('Failed to fetch test attempts');
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
      error('Failed to fetch test attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (attempt) => {
    onViewAttemptDetails(attempt);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-[var(--border,#DCEBF2)]">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-xl font-bold text-[var(--text-primary,#183040)] truncate">
                {test?.test_name} - Attempts
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted,#7D96A4)] mt-0.5 truncate">
                {test?.module_id} • {test?.subcategory || test?.level_id || 'Practice Test'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 hover:bg-[var(--background,#F4FAFD)] rounded-full transition-colors shrink-0 text-[var(--text-muted,#7D96A4)]"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No attempts found</h3>
              <p className="text-xs sm:text-sm text-gray-500">No attempts available for this test.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {/* Progress Chart Section */}
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-4">
                <h4 className="text-xs sm:text-base font-bold text-gray-900 mb-2 sm:mb-4">Progress Overview</h4>
                <div className="h-28 sm:h-32">
                  <TestProgressChart 
                    attempts={attempts} 
                    testName={test?.test_name}
                  />
                </div>
              </div>
              
              {/* Attempts List */}
              <div className="space-y-2 sm:space-y-4">
              {attempts.map((attempt, index) => (
                <motion.div
                  key={attempt.attempt_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-2.5 sm:p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-4 mb-1.5 sm:mb-2">
                        <h4 className="text-xs sm:text-base font-bold text-gray-900">
                          Attempt {index + 1}
                        </h4>
                        <div className={`px-2 sm:px-3 py-0.5 rounded-full text-xs sm:text-sm font-semibold ${getScoreColor(attempt.score)} bg-opacity-10`}>
                          {attempt.score.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6 text-[11px] sm:text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {attempt.time_taken || 'N/A'} min
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {attempt.correct_answers}/{attempt.total_questions} correct
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleViewDetails(attempt)}
                      className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PracticeTestAttemptsModal;
