import React from 'react';
import { User, Book, Award } from 'lucide-react';

const StudentCard = ({ student, onClick, showDetails = false }) => {
  if (!showDetails) {
    return (
      <div 
        onClick={onClick}
        className="bg-[var(--surface,#FFFFFF)] p-4 rounded-xl shadow-xs hover:shadow-md transition-shadow cursor-pointer border border-[var(--border,#DCEBF2)]"
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary,#183040)]">{student.name}</h3>
            <p className="text-sm text-[var(--text-muted,#7D96A4)]">{student.roll_number}</p>
          </div>
        </div>
      </div>
    );
  }

  const getLevelColor = (percentage) => {
    if (percentage >= 80) return 'text-[var(--success,#258265)]';
    if (percentage >= 60) return 'text-[var(--warning,#C18120)]';
    return 'text-[var(--danger,#C94C4C)]';
  };

  return (
    <div className="bg-[var(--surface,#FFFFFF)] p-6 rounded-2xl shadow-lg border border-[var(--border,#DCEBF2)]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary,#183040)]">{student.name}</h2>
          <p className="text-[var(--text-secondary,#486273)]">{student.roll_number}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-muted,#7D96A4)]">{student.email}</p>
          <p className="text-sm text-[var(--text-muted,#7D96A4)]">{student.mobile_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center">
            <Book className="w-5 h-5 mr-2" />
            Course Details
          </h3>
          <p className="text-gray-600">{student.course?.name}</p>
          <p className="text-sm text-gray-500">{student.campus?.name}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Level Progress
          </h3>
          <div className="space-y-2">
            {Object.entries(student.level_completion).map(([level, percentage]) => (
              <div key={level} className="flex justify-between items-center">
                <span className="capitalize">{level}</span>
                <span className={getLevelColor(percentage * 100)}>
                  {Math.round(percentage * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Test History</h3>
        <div className="space-y-3">
          {student.test_results.map(result => (
            <div key={result.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium">{result.test_name}</p>
                <p className="text-gray-500 capitalize">{result.level}</p>
              </div>
              <div className="text-right">
                <p className={getLevelColor(result.score)}>{result.score}%</p>
                <p className="text-gray-500">{new Date(result.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-2">Authorized Levels</h3>
        <div className="flex flex-wrap gap-2">
          {student.authorized_levels.map(level => (
            <span 
              key={level}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize"
            >
              {level}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentCard; 