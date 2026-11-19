import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Award, Target, Brain, Zap } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

const SuperAdminAttemptDetailsModal = ({ isOpen, onClose, attempt, test, basePath = '/superadmin' }) => {
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const { error } = useNotification();

  useEffect(() => {
    if (isOpen && attempt) {
      fetchAttemptDetails();
    }
  }, [isOpen, attempt]);

  // Debug: Log question data when it changes
  useEffect(() => {
    if (attemptDetails && attemptDetails.detailed_results) {
      console.log('Question data:', attemptDetails.detailed_results[0]);
    }
  }, [attemptDetails]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      const targetId = attempt.attempt_id || attempt._id;
      const response = await api.get(`${basePath || '/superadmin'}/practice-attempt-details/${targetId}`);
      if (response.data.success) {
        setAttemptDetails(response.data.data);
      } else {
        error(response.data.message || 'Failed to fetch attempt details');
      }
    } catch (err) {
      console.error('Error fetching attempt details:', err);
      error('Failed to fetch attempt details');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (questionType) => {
    switch (questionType) {
      case 'mcq': return <Target className="w-4 h-4" />;
      case 'fill_blank': return <Brain className="w-4 h-4" />;
      case 'audio': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getQuestionTypeColor = (questionType) => {
    switch (questionType) {
      case 'mcq': return 'text-blue-600 bg-blue-100';
      case 'fill_blank': return 'text-green-600 bg-green-100';
      case 'audio': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[var(--surface,#FFFFFF)] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-[var(--border,#DCEBF2)]"
      >
        {/* Header */}
        <div 
          className="p-6 text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Attempt Details</h3>
                <p className="text-white/80 mt-1">
                  {test?.test_name} • {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Unknown Date'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  attempt?.score >= 80 ? 'text-green-200' :
                  attempt?.score >= 60 ? 'text-yellow-200' :
                  'text-red-200'
                }`}>
                  {attempt?.score?.toFixed(1)}%
                </div>
                <div className="text-white/80 text-sm">
                  {attempt?.correct_answers}/{attempt?.total_questions} correct
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[80vh] bg-[var(--background,#F4FAFD)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !attemptDetails ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No details found</h3>
              <p className="text-gray-600">No detailed results available for this attempt.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div 
                  className="rounded-xl p-3 text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <div>
                      <div className="text-lg font-bold">{attemptDetails.attempt?.total_questions || 0}</div>
                      <div className="text-white/80 text-xs">Total Questions</div>
                    </div>
                  </div>
                </div>
                <div 
                  className="rounded-xl p-3 text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--success), #1b634c)' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <div className="text-lg font-bold">{attemptDetails.attempt?.correct_answers || 0}</div>
                      <div className="text-white/80 text-xs">Correct</div>
                    </div>
                  </div>
                </div>
                <div 
                  className="rounded-xl p-3 text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--warning), #9b6314)' }}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <div>
                      <div className="text-lg font-bold">{attemptDetails.attempt?.time_taken || 'N/A'}</div>
                      <div className="text-white/80 text-xs">Time</div>
                    </div>
                  </div>
                </div>
                <div 
                  className="rounded-xl p-3 text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <div>
                      <div className="text-lg font-bold">{attemptDetails.attempt?.score?.toFixed(1) || 0}%</div>
                      <div className="text-white/80 text-xs">Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="bg-[var(--surface,#FFFFFF)] rounded-2xl border border-[var(--border,#DCEBF2)] shadow-xl overflow-hidden">
                <div className="bg-[var(--background,#F4FAFD)] p-4 border-b border-[var(--border,#DCEBF2)]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded-lg shadow-xs"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                    >
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary,#183040)]">Question Details</h4>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                  {attemptDetails.detailed_results?.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 hover:shadow-md transition-all duration-300"
                    >
                      {/* Question Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          question.is_correct 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}>
                          {question.question_number}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.is_correct 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.is_correct ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <h6 className="text-xs font-semibold text-gray-600 mb-2">Question:</h6>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-gray-900 font-medium leading-relaxed">
                            {question.question_text || 'Question text not available'}
                          </p>
                        </div>
                      </div>

                      {/* Answers Grid - 2 columns in single row, responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Student Answer */}
                        <div>
                          <h6 className="text-xs font-semibold text-gray-600 mb-1">Student's Answer:</h6>
                          <div className={`p-2 rounded-lg border min-h-[40px] ${
                            question.is_correct 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <p className="text-sm text-gray-800 break-words leading-relaxed">{question.student_answer || 'No answer provided'}</p>
                          </div>
                        </div>

                        {/* Correct Answer */}
                        <div>
                          <h6 className="text-xs font-semibold text-gray-600 mb-1">Correct Answer:</h6>
                          <div className="bg-green-50 border border-green-200 p-2 rounded-lg min-h-[40px]">
                            <p className="text-sm text-gray-800 break-words leading-relaxed">{question.correct_answer || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      {(question.explanation || question.similarity_score) && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                          {question.explanation && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 mb-1">Explanation:</h6>
                              <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                          {question.similarity_score > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 mb-1">Similarity:</h6>
                              <p className="text-xs text-gray-600">
                                {(question.similarity_score * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminAttemptDetailsModal;
