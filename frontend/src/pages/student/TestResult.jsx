import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNotification } from '../../contexts/NotificationContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api, { getTestResultById } from '../../services/api'
import { getPlayableAudioUrl } from '../../utils/audioPlayback'
import { 
  Volume2,
  Mic, 
  AudioLines, 
  CheckCircle, 
  XCircle,
  Award,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react'

const TestResult = () => {
  const { resultId } = useParams()
  const { error, success } = useNotification()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [audioPlayer, setAudioPlayer] = useState(null)
  const [playingIndex, setPlayingIndex] = useState(null)
  const [showAutoSubmitWarning, setShowAutoSubmitWarning] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)

  useEffect(() => {
    fetchResult()
    return () => {
      if (audioPlayer) {
        audioPlayer.pause()
      }
    }
    // eslint-disable-next-line
  }, [resultId])

  useEffect(() => {
    if (result && (result.auto_submitted || result.cheat_detected)) {
      setShowAutoSubmitWarning(true)
    }
  }, [result])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const response = await getTestResultById(resultId)
      setResult(response.data.data)
    } catch (err) {
      error('Failed to load test result')
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (audioUrl, index) => {
    if (audioPlayer) {
      audioPlayer.pause()
    }
    const resolvedUrl = getPlayableAudioUrl(audioUrl);
    if (!resolvedUrl) return;
    const player = new Audio(resolvedUrl);
    setAudioPlayer(player)
    setPlayingIndex(index)
    player.onended = () => setPlayingIndex(null)
    player.onerror = () => setPlayingIndex(null)
    player.play().catch(e => console.error('Audio play error:', e))
  }

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowQuestionModal(true)
  }

  const handleShareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Test Result',
        text: `I scored ${result.score_percentage || result.average_score || 0}% on ${result.test_name}`,
        url: window.location.href
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      success('Result link copied to clipboard!')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-100 border-blue-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    return 'text-red-600 bg-red-100 border-red-200'
  }

  const getScoreIcon = (score) => {
    if (score >= 90) return <Award className="w-5 h-5" />
    if (score >= 70) return <TrendingUp className="w-5 h-5" />
    if (score >= 50) return <Target className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Excellent! Outstanding performance!'
    if (score >= 70) return 'Good job! You did well!'
    if (score >= 50) return 'Keep practicing! You can improve!'
    return 'Don\'t give up! Practice makes perfect!'
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-6">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-600">Result not found.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-6">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Test Result
                  </h1>
                  <p className="text-gray-600">
                    {result.test_name} • {new Date(result.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareResult}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={fetchResult}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Auto Submit Warning */}
              {showAutoSubmitWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {result.auto_submitted ? 'Test Auto-Submitted' : 'Cheat Detection'}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {result.auto_submitted 
                          ? 'This test was automatically submitted due to time expiration.'
                          : 'Suspicious activity was detected during this test.'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Your Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(result.score_percentage || result.average_score || 0)}`}>
                        {result.score_percentage || result.average_score || 0}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${getScoreColor(result.score_percentage || result.average_score || 0)}`}>
                      {getScoreIcon(result.score_percentage || result.average_score || 0)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getPerformanceMessage(result.score_percentage || result.average_score || 0)}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Test Duration</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.duration || 'N/A'} min
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Time taken to complete the test
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Questions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.total_questions || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Total questions attempted
                  </p>
                </motion.div>
              </div>

              {/* AI Speaking & Pronunciation Performance Card */}
              {result.ai_evaluation && (
                <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-purple-50/70 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                        AI Speech Model Evaluation (Whisper AI)
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-1">Speaking & Pronunciation Breakdown</h3>
                    </div>
                    <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      Overall Score: <strong className="text-indigo-600 text-base">{result.ai_evaluation.overall_score || result.score}%</strong>
                    </span>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Pronunciation Accuracy</span>
                        <span className="font-bold text-indigo-600">{result.ai_evaluation.accuracy_score || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${result.ai_evaluation.accuracy_score || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Speaking Fluency</span>
                        <span className="font-bold text-blue-600">{result.ai_evaluation.fluency_score || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${result.ai_evaluation.fluency_score || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Sentence Completeness</span>
                        <span className="font-bold text-emerald-600">
                          {result.ai_evaluation.pronunciation_breakdown?.completeness_score || result.ai_evaluation.accuracy_score || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${result.ai_evaluation.pronunciation_breakdown?.completeness_score || result.ai_evaluation.accuracy_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Sentence-by-Sentence Breakdown if available in answers */}
                  {Array.isArray(result.answers) && result.answers.length > 0 && result.answers[0]?.sentence && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Per-Sentence Spoken Analysis
                      </h4>
                      <div className="space-y-2.5">
                        {result.answers.map((ans, aIdx) => (
                          <div key={aIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-500">Sentence {aIdx + 1}</span>
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                Score: {ans.overall_score || ans.accuracy_score}%
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Sentence:</span>
                              <p className="text-xs font-bold text-slate-900">{ans.sentence || ans.reference_text}</p>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">What AI Transcribed:</span>
                              <p className="text-xs font-medium text-slate-700 italic">
                                "{ans.transcription || 'No speech detected'}"
                              </p>
                              {Array.isArray(ans.word_feedback) && ans.word_feedback.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {ans.word_feedback.map((wf, wIdx) => (
                                    <span
                                      key={wIdx}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        wf.matched
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800 line-through'
                                      }`}
                                    >
                                      {wf.word}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Results */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    Detailed Results
                  </h2>
                </div>

                <div className="p-6">
                  {result.detailed_results && result.detailed_results.length > 0 ? (
                    <div className="space-y-4">
                      {result.detailed_results.map((question, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-2">
                                Question {index + 1}
                              </h3>
                              <p className="text-gray-700 text-sm">
                                {question.question || question.question_text || question.prompt || question.sentence || question.original_text || 'Speaking Prompt'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewQuestion(question)}
                              className="ml-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            {question.question_type === 'mcq' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Your Answer:</span>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  question.is_correct 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {question.student_answer || 'N/A'}
                                </span>
                                {question.is_correct ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Score / Accuracy:</span>
                                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    (question.accuracy_score ?? question.similarity_score ?? question.overall_score ?? 0) >= 70 
                                      ? 'bg-green-100 text-green-800' 
                                      : (question.accuracy_score ?? question.similarity_score ?? question.overall_score ?? 0) >= 50
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {((question.accuracy_score ?? question.similarity_score ?? question.overall_score ?? 0)).toFixed(0)}%
                                  </span>
                                </div>
                                {question.student_answer && (
                                  <div className="text-xs text-slate-500">
                                    <span className="font-semibold text-slate-600">You said:</span> "{question.student_answer}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Audio playback for speaking/listening question */}
                          {(question.student_audio_url || question.audio_url || question.speaking_audio_url || (index === 0 && result.speaking_audio_url)) && (
                            <div className="mt-3 flex items-center gap-3">
                              <button
                                onClick={() => playAudio(question.student_audio_url || question.audio_url || question.speaking_audio_url || result.speaking_audio_url, index)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                {playingIndex === index ? (
                                  <AudioLines className="w-4 h-4 animate-pulse" />
                                ) : (
                                  <Volume2 className="w-4 h-4" />
                                )}
                                {playingIndex === index ? 'Playing Audio...' : 'Play Recorded Audio'}
                              </button>
                              <a
                                href={getPlayableAudioUrl(question.student_audio_url || question.audio_url || question.speaking_audio_url || result.speaking_audio_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-400 hover:text-slate-600 underline"
                              >
                                Download Audio
                              </a>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No detailed results available</h3>
                      <p className="text-gray-500">Detailed question analysis is not available for this test.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Question Detail Modal */}
        {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question</h4>
                  <p className="text-gray-700">{selectedQuestion.question || selectedQuestion.original_text}</p>
                </div>

                {selectedQuestion.question_type === 'mcq' ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Options</h4>
                    <div className="space-y-2">
                      {selectedQuestion.options && Object.entries(selectedQuestion.options).map(([key, value]) => {
                        const isCorrect = key === selectedQuestion.correct_answer
                        const isStudent = key === selectedQuestion.student_answer
                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrect 
                                ? 'border-green-500 bg-green-50 text-green-800' 
                                : isStudent 
                                ? 'border-red-500 bg-red-50 text-red-800'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            <span className="font-bold mr-2">{key}.</span>
                            <span>{value}</span>
                            {isCorrect && <span className="ml-2 text-green-600 font-bold">(Correct)</span>}
                            {isStudent && !isCorrect && <span className="ml-2 text-red-600 font-bold">(Your Answer)</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Response</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 font-mono">{selectedQuestion.student_text}</p>
                    </div>
                    
                    {selectedQuestion.missing_words && selectedQuestion.missing_words.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-1">Missing Words</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedQuestion.missing_words.map((word, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedQuestion.extra_words && selectedQuestion.extra_words.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-1">Extra Words</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedQuestion.extra_words.map((word, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  )
}

export default TestResult 