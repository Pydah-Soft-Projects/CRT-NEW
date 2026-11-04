import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function ActiveExamAutoOpener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckingRef = useRef(false);

  const isStudent = user && (user.role === 'student' || user.auth_source === 'sdms');

  const checkAndLaunchActiveExam = async (isRealtimeAlert = false) => {
    // If the student is already taking an exam or viewing test results, never interrupt them
    if (
      location.pathname.startsWith('/student/exam') ||
      location.pathname.startsWith('/student/test-result')
    ) {
      return;
    }

    if (!isStudent || isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;
      const res = await api.get('/student/active-exam');

      if (res.data?.success && res.data?.has_active_exam && res.data?.test?._id) {
        const test = res.data.test;
        const testId = String(test._id);

        const sessionKey = `auto_launched_exam_${testId}`;
        const alreadyLaunched = sessionStorage.getItem(sessionKey);

        if (!alreadyLaunched || isRealtimeAlert) {
          sessionStorage.setItem(sessionKey, 'true');

          toast.success(
            `🚀 Active Exam: "${test.title || 'Online Assessment'}" has started! Opening test page directly...`,
            { duration: 4000, id: `active-exam-${testId}` }
          );

          // Direct automatic navigation to the online exam taking screen
          setTimeout(() => {
            navigate(`/student/exam/${testId}`, { replace: true });
          }, 400);
        }
      }
    } catch (err) {
      console.warn('Active exam auto-launch check:', err?.message);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isStudent) return;

    // 1. Check immediately when active student lands on the portal
    checkAndLaunchActiveExam(false);

    // 2. Setup real-time Socket.IO listener for instant exam creation broadcasts
    let socket;
    try {
      socket = getSocket();
      if (socket) {
        socket.emit('join', {
          room: 'students',
          user_id: user._id || user.id,
          student_id: user.student_id || user.sdms_student_id
        });

        const handleNewExam = (data) => {
          console.log('📢 Real-time online exam published event received:', data);
          checkAndLaunchActiveExam(true);
        };

        socket.on('online_exam_published', handleNewExam);
        socket.on('new_online_exam', handleNewExam);

        return () => {
          socket.off('online_exam_published', handleNewExam);
          socket.off('new_online_exam', handleNewExam);
        };
      }
    } catch (e) {
      console.warn('Socket initialization error in ActiveExamAutoOpener:', e);
    }

    // 3. Fallback background check every 12 seconds
    const interval = setInterval(() => {
      checkAndLaunchActiveExam(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [user, location.pathname]);

  return null;
}

