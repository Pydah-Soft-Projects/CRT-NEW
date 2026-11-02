const toStudentQuestion = (question, index = 0) => {
  const safeQuestion = typeof question?.toObject === 'function'
    ? question.toObject()
    : { ...question };
  delete safeQuestion.correct_answer;
  delete safeQuestion.correctAnswer;
  delete safeQuestion.answer_key;
  delete safeQuestion.answerKey;
  delete safeQuestion.reference_text;
  delete safeQuestion.explanation;

  const text = safeQuestion.question || safeQuestion.text || safeQuestion.question_text || safeQuestion.prompt || safeQuestion.title || '';
  safeQuestion.question = text;
  safeQuestion.text = text;
  safeQuestion.question_id = safeQuestion.question_id || (safeQuestion._id ? String(safeQuestion._id) : (safeQuestion.id ? String(safeQuestion.id) : String(index)));
  return safeQuestion;
};

const toStudentTest = (test) => {
  const data = typeof test.toObject === 'function' ? test.toObject() : { ...test };
  data.name = data.name || data.title;
  data.module_name = data.module_name || data.module_id;
  data.question_count = Array.isArray(data.questions) ? data.questions.length : 0;
  data.questions = (data.questions || []).map((q, idx) => toStudentQuestion(q, idx));
  return data;
};

module.exports = { toStudentQuestion, toStudentTest };
