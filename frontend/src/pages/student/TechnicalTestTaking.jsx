import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

import LoadingSpinner from '../../components/common/LoadingSpinner';

const TechnicalTestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [codeOutput, setCodeOutput] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const response = await api.get(`/test-management/tests/${testId}`);
      if (response.data.success) {
        setTest(response.data.data);
        // Initialize answers object
        const initialAnswers = {};
        response.data.data.questions.forEach((_, index) => {
          initialAnswers[index] = {
            code: '',
            language: 'python',
            testResults: {}
          };
        });
        setAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (questionIndex, code) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        code
      }
    }));
  };

  const handleLanguageChange = (questionIndex, language) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        language
      }
    }));
  };

  const runCode = async (questionIndex) => {
    const currentAnswer = answers[questionIndex];
    if (!currentAnswer.code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    const question = test.questions[questionIndex];
    const testCases = question.testCases.split('\n').filter(tc => tc.trim());
    const expectedOutputs = question.expectedOutput.split('\n').filter(eo => eo.trim());

    setCodeOutput(prev => ({
      ...prev,
      [questionIndex]: { status: 'running', results: [] }
    }));

    try {
      const results = [];
      let allPassed = true;

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const expectedOutput = expectedOutputs[i];

        const response = await api.post('/test-management/run-code', {
          code: currentAnswer.code,
          language: currentAnswer.language,
          stdin: testCase
        });

        if (response.data.success) {
          const actualOutput = response.data.data.stdout.trim();
          const passed = actualOutput === expectedOutput;
          allPassed = allPassed && passed;

          results.push({
            testCase,
            expectedOutput,
            actualOutput,
            passed,
            error: response.data.data.stderr || null
          });
        } else {
          results.push({
            testCase,
            expectedOutput,
            actualOutput: '',
            passed: false,
            error: response.data.message || 'Compilation error'
          });
          allPassed = false;
        }
      }

      setCodeOutput(prev => ({
        ...prev,
        [questionIndex]: { 
          status: 'completed', 
          results,
          allPassed
        }
      }));

      // Update test results
      setTestResults(prev => ({
        ...prev,
        [questionIndex]: {
          passed: allPassed,
          score: allPassed ? 100 : 0,
          results
        }
      }));

      if (allPassed) {
        toast.success('All test cases passed!');
      } else {
        toast.error('Some test cases failed. Check the results below.');
      }

    } catch (error) {
      console.error('Error running code:', error);
      setCodeOutput(prev => ({
        ...prev,
        [questionIndex]: { 
          status: 'error', 
          results: [],
          error: 'Failed to run code'
        }
      }));
      toast.error('Failed to run code');
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(testResults).length === 0) {
      toast.error('Please run at least one question before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/test-management/submit-technical-test', {
        test_id: testId,
        answers: answers,
        results: testResults
      });

      if (response.data.success) {
        toast.success('Test submitted successfully!');
        navigate(`/student/test-result/${response.data.data.result_id}`);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!test) {
    return <div>Test not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-3 sm:py-6">
          <div className="w-full px-2.5 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-3 sm:mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">{test.name}</h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Technical Test • {test.questions.length} questions</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-3">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-600">Q {currentQuestionIndex + 1} of {test.questions.length}</p>
                    <p className="text-[11px] text-gray-500">
                      {Object.keys(testResults).length} completed
                    </p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 text-white px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Question Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-3 sm:mb-6"
            >
              <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1.5">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium whitespace-nowrap ${
                      currentQuestionIndex === index
                        ? 'bg-blue-600 text-white'
                        : testResults[index]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Q{index + 1}
                    {testResults[index] && (
                      <span className="ml-1">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Question Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-8"
            >
              {/* Question Statement */}
              <div className="bg-white rounded-xl shadow-sm p-3.5 sm:p-6 border border-gray-100">
                <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 sm:mb-4">
                  Question {currentQuestionIndex + 1}
                </h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-2.5 sm:p-4 rounded-lg text-xs sm:text-sm font-mono">
                    {currentQuestion.question}
                  </pre>
                </div>
              </div>

              {/* Code Editor */}
              <div className="bg-white rounded-xl shadow-sm p-3.5 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2.5 sm:mb-4 gap-2">
                  <h3 className="text-xs sm:text-base font-bold text-gray-900">Your Solution</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={answers[currentQuestionIndex]?.language || 'python'}
                      onChange={(e) => handleLanguageChange(currentQuestionIndex, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                    <button
                      onClick={() => runCode(currentQuestionIndex)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-semibold hover:bg-blue-700"
                    >
                      Run Code
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={answers[currentQuestionIndex]?.code || ''}
                  onChange={(e) => handleCodeChange(currentQuestionIndex, e.target.value)}
                  className="w-full h-48 sm:h-64 p-2.5 sm:p-4 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`# Write your ${answers[currentQuestionIndex]?.language || 'python'} code here\n\n`}
                />
              </div>
            </motion.div>

            {/* Test Results */}
            {codeOutput[currentQuestionIndex] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-3.5 sm:mt-8 bg-white rounded-xl shadow-sm p-3.5 sm:p-6 border border-gray-100"
              >
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2.5 sm:mb-4">Test Results</h3>
                
                {codeOutput[currentQuestionIndex].status === 'running' && (
                  <div className="text-center py-4">
                    <LoadingSpinner size="md" />
                    <p className="text-gray-600 mt-2 text-xs sm:text-sm">Running test cases...</p>
                  </div>
                )}

                {codeOutput[currentQuestionIndex].status === 'completed' && (
                  <div className="space-y-2.5 sm:space-y-4">
                    {codeOutput[currentQuestionIndex].results.map((result, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-2.5 sm:p-4 ${
                          result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-xs sm:text-sm">Test Case {index + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                              result.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Input:</span>
                            <pre className="mt-1 bg-gray-100 p-2 rounded">{result.testCase}</pre>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Expected:</span>
                            <pre className="mt-1 bg-gray-100 p-2 rounded">{result.expectedOutput}</pre>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Actual:</span>
                            <pre className="mt-1 bg-gray-100 p-2 rounded">{result.actualOutput || 'No output'}</pre>
                          </div>
                        </div>

                        {result.error && (
                          <div className="mt-2">
                            <span className="font-medium text-red-700">Error:</span>
                            <pre className="mt-1 bg-red-100 p-2 rounded text-red-800 text-xs">{result.error}</pre>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className={`text-center py-4 rounded-lg ${
                      codeOutput[currentQuestionIndex].allPassed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <p className="font-semibold">
                        {codeOutput[currentQuestionIndex].allPassed
                          ? '🎉 All test cases passed!'
                          : '⚠️ Some test cases failed. Please check your solution.'}
                      </p>
                    </div>
                  </div>
                )}

                {codeOutput[currentQuestionIndex].status === 'error' && (
                  <div className="text-center py-4 text-red-600">
                    <p>Error: {codeOutput[currentQuestionIndex].error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
      </main>
    </div>
  );
};

export default TechnicalTestTaking; 