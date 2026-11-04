async function ensureCorrectAttemptIndexes(mongooseConn) {
  try {
    const collection = mongooseConn.connection.collection('exam_attempts');
    if (!collection) return;
    const indexes = await collection.indexes().catch(() => []);
    
    for (const idx of indexes) {
      if (idx.unique && idx.name !== '_id_') {
        const isUserIndex = idx.key?.user_id && idx.key?.test_id && Object.keys(idx.key).length === 2;
        const isSdmsIndex = idx.key?.sdms_student_id && idx.key?.test_id && Object.keys(idx.key).length === 2;
        const hasPartial = idx.partialFilterExpression && (
          idx.partialFilterExpression.user_id || idx.partialFilterExpression.sdms_student_id
        );
        if ((isUserIndex || isSdmsIndex) && !hasPartial) {
          console.log(`Dropping legacy non-partial unique index: ${idx.name}`);
          await collection.dropIndex(idx.name).catch(() => {});
        }
      }
    }

    await collection.createIndex(
      { user_id: 1, test_id: 1 },
      {
        name: 'user_id_1_test_id_1',
        unique: true,
        partialFilterExpression: { user_id: { $type: 'objectId' } }
      }
    ).catch(() => {});

    await collection.createIndex(
      { sdms_student_id: 1, test_id: 1 },
      {
        name: 'sdms_student_id_1_test_id_1',
        unique: true,
        partialFilterExpression: { sdms_student_id: { $type: 'number' } }
      }
    ).catch(() => {});
  } catch (err) {
    console.warn('Attempt indexes sync notice:', err.message);
  }
}

const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    await ensureCorrectAttemptIndexes(conn);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In dev mode, don't crash process immediately if DB is unreachable
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
module.exports.ensureCorrectAttemptIndexes = ensureCorrectAttemptIndexes;
