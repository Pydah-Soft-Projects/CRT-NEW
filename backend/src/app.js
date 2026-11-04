const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const errorHandler = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const campusAdminRoutes = require('./routes/campusAdmin.routes');
const courseAdminRoutes = require('./routes/courseAdmin.routes');
const batchRoutes = require('./routes/batch.routes');
const testRoutes = require('./routes/test.routes');
const studentRoutes = require('./routes/student.routes');
const hrmsRoutes = require('./routes/hrms.routes');
const userManagementRoutes = require('./routes/userManagement.routes');
const crtRoutes = require('./routes/crt.routes');
const superadminController = require('./controllers/superadmin.controller');

const app = express();

// Global Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, etc) or in CORS_ORIGINS
    if (!origin || env.CORS_ORIGINS.includes(origin) || env.CORS_ORIGINS.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploads directory statically for audio files and assets
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VERSANT Node.js Backend',
    timestamp: new Date().toISOString()
  });
});

// Direct legacy / alias endpoint mappings for frontend compatibility
app.get('/global-settings/user/features', superadminController.getGlobalFeatures);

// Mount API Routers
app.use('/auth', authRoutes);
app.use('/superadmin', superadminRoutes);
app.use('/campus-admin', campusAdminRoutes);
app.use('/course-admin', courseAdminRoutes);
app.use('/campus-management', superadminRoutes);
app.use('/course-management', superadminRoutes);
app.use('/batch-management', batchRoutes);
app.use('/test-management', testRoutes);
app.use('/student', studentRoutes);
app.use('/hrms', hrmsRoutes);
app.use('/user-management', userManagementRoutes);
app.use('/crt', crtRoutes);
app.use('/test-management/crt', crtRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
