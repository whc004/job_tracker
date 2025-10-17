const ENABLE_SERVER_LOGGING = process.env.ENABLE_SERVER_LOGGING === 'true' ||process.env.NODE_ENV !== 'production';
const debugLog = (...args) => { if (ENABLE_SERVER_LOGGING) console.log(...args); };
const debugError = (...args) => { if (ENABLE_SERVER_LOGGING) console.error(...args); };
// ==================== IMPORTS & CONSTANTS ====================
const { 
  STATUS_OPTIONS, 
  PRIORITY_OPTIONS,
  JOB_STATUS,
  PRIORITY_LEVELS,
  JOB_TYPE_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS
} = require('../shared-constants');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_URL = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${PORT}`;

const VALID_USER_IDS = new Set([
  'job-tracker_vincent',
  'job-tracker-don',
  'job-tracker-alex',
  'job-tracker-leo',
  'job-tracker-duan'
]);

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

function validateUserId(req, res, next) {
  const userId = req.body.userId || req.query.userId || 
                 req.headers['x-user-id'] || req.body._extractedData?.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }
  
  if (!VALID_USER_IDS.has(userId)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid User ID' 
    });
  }
  
  req.userId = userId;
  next();
}

function validateJobData(req, res, next) {
  const { status, priority, jobType, workArrangement, experienceLevel } = req.body;
  
  if (status && !STATUS_OPTIONS.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      received: status,
      validOptions: STATUS_OPTIONS
    });
  }
  
  if (priority && !PRIORITY_OPTIONS.includes(priority)) {
    return res.status(400).json({
      error: 'Invalid priority',
      received: priority,
      validOptions: PRIORITY_OPTIONS
    });
  }
  
  if (jobType && !JOB_TYPE_OPTIONS.includes(jobType)) {
    return res.status(400).json({
      error: 'Invalid job type',
      received: jobType,
      validOptions: JOB_TYPE_OPTIONS
    });
  }
  
  if (workArrangement && !WORK_ARRANGEMENT_OPTIONS.includes(workArrangement)) {
    return res.status(400).json({
      error: 'Invalid work arrangement',
      received: workArrangement,
      validOptions: WORK_ARRANGEMENT_OPTIONS
    });
  }
  
  if (experienceLevel && !EXPERIENCE_LEVEL_OPTIONS.includes(experienceLevel)) {
    return res.status(400).json({
      error: 'Invalid experience level',
      received: experienceLevel,
      validOptions: EXPERIENCE_LEVEL_OPTIONS
    });
  }
  
  next();
}

// ==================== HELPER FUNCTIONS ====================
async function findDuplicateJob(userId, { jobUrl, linkedinJobId }) {
  let existingJob = null;

  if (jobUrl && jobUrl.trim()) {
    existingJob = await JobApplication.findOne({
      userId: userId,
      jobUrl: jobUrl.trim()
    });
    if (existingJob) return existingJob;
  }

  if (linkedinJobId) {
    existingJob = await JobApplication.findOne({
      userId: userId,
      linkedinJobId: linkedinJobId
    });
    if (existingJob) return existingJob;
  }
  
  return null;
}

function handleDuplicateByStatus(existingJob) {
  const jobInfo = {
    id: existingJob._id,
    position: existingJob.position,
    company: existingJob.company,
    status: existingJob.status,
    dateApplied: existingJob.dateApplied
  };

  // Block if already has offer
  if (existingJob.status === JOB_STATUS.OFFER) {
    return {
      shouldBlock: true,
      response: {
        success: false,
        isDuplicate: true,
        message: `You already have an offer for "${existingJob.position}" at ${existingJob.company}!`,
        existing: jobInfo
      }
    };
  }
  
  // Block if in any interview round
  const interviewStatuses = [
    JOB_STATUS.INTERVIEW_ROUND_1,
    JOB_STATUS.INTERVIEW_ROUND_2,
    JOB_STATUS.INTERVIEW_ROUND_3,
    JOB_STATUS.INTERVIEW_ROUND_4,
    JOB_STATUS.INTERVIEW_ROUND_5_TO_10
  ];
  
  if (interviewStatuses.includes(existingJob.status)) {
    return {
      shouldBlock: true,
      response: {
        success: false,
        isDuplicate: true,
        message: `Interview in progress for "${existingJob.position}" at ${existingJob.company}`,
        existing: jobInfo
      }
    };
  }
  
  // Allow re-application for rejected or no response
  return { shouldBlock: false, response: null };
}

async function updateExistingJob(existingJob, applicationData) {
  existingJob.company = applicationData.company || existingJob.company;
  existingJob.position = applicationData.position || existingJob.position;
  existingJob.location = applicationData.location || existingJob.location;
  existingJob.salary = applicationData.salary || existingJob.salary;
  existingJob.jobUrl = applicationData.jobUrl || existingJob.jobUrl;
  existingJob.linkedinJobId = applicationData.linkedinJobId || existingJob.linkedinJobId;
  existingJob.jobType = applicationData.jobType || existingJob.jobType;
  existingJob.experienceLevel = applicationData.experienceLevel || existingJob.experienceLevel;
  existingJob.workArrangement = applicationData.workArrangement || existingJob.workArrangement;
  
  if (applicationData.technicalDetails && applicationData.technicalDetails.length > 0) {
    const existingDetails = new Set(existingJob.technicalDetails || []);
    applicationData.technicalDetails.forEach(detail => existingDetails.add(detail));
    existingJob.technicalDetails = Array.from(existingDetails);
  }
  
  if (applicationData.notes) existingJob.notes = applicationData.notes;
  existingJob.lastStatusUpdate = new Date();
  
  await existingJob.save();
  return existingJob;
}

// ==================== DATABASE SCHEMA ====================
const jobApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true, trim: true },
  linkedinJobId: { type: String, required: false, index: true, trim: true },
  company: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  salary: { type: String, trim: true },
  jobUrl: { type: String, trim: true },
  status: { 
    type: String, 
    enum: STATUS_OPTIONS,
    default: JOB_STATUS.APPLIED
  },
  jobType: { type: String, trim: true },
  experienceLevel: { type: String, trim: true },
  workArrangement: { type: String, trim: true },
  technicalDetails: { type: [String], default: [] },
  dateApplied: { type: Date, default: Date.now },
  followUpDate: { type: Date },
  lastStatusUpdate: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 1000 },
  contactPerson: { type: String, trim: true },
  priority: { 
    type: String, 
    enum: PRIORITY_OPTIONS,
    default: PRIORITY_LEVELS.NORMAL
  }
}, { timestamps: true });

jobApplicationSchema.index({ userId: 1, dateApplied: -1 });
jobApplicationSchema.index({ userId: 1, jobUrl: 1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { jobUrl: { $exists: true, $ne: null, $ne: '' } }
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
const upload = multer({ dest: '../uploads/' });

// ==================== ROUTES ====================

// Health Check
app.get('/', (req, res) => res.json({
  message: 'Job Tracker API v1.2.0',
  status: 'running'
}));

app.get('/api/health', (req, res) => res.json({
  success: true,
  timestamp: new Date().toISOString(),
  database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
}));

// Get All Applications
app.get('/api/applications', validateUserId, async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Application
app.post('/api/applications', validateUserId, validateJobData, async (req, res) => {
  try {
    const { linkedinJobId, jobUrl } = req.body;
    const applicationData = { ...req.body, userId: req.userId };
    delete applicationData._extractedData;

    const existingJob = await findDuplicateJob(req.userId, { jobUrl, linkedinJobId });

    if (existingJob) {
      const { shouldBlock, response } = handleDuplicateByStatus(existingJob);
      
      if (shouldBlock) return res.json(response);
      
      const updatedJob = await updateExistingJob(existingJob, applicationData);
      return res.json({
        success: true,
        isUpdate: true,
        message: 'Job application updated',
        data: updatedJob
      });
    }

    const application = new JobApplication(applicationData);
    await application.save();
    
    res.status(201).json({
      success: true,
      isUpdate: false,
      message: 'Application created',
      data: application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'Job already saved'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, errors });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Application
app.get('/api/applications/:id', validateUserId, async (req, res) => {
  try {
    const application = await JobApplication.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Application
app.put('/api/applications/:id', validateUserId, validateJobData, async (req, res) => {
  try {
    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, lastStatusUpdate: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    
    res.json({ success: true, message: 'Updated', data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Application
app.delete('/api/applications/:id', validateUserId, async (req, res) => {
  try {
    const application = await JobApplication.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Statistics
app.get('/api/stats', validateUserId, async (req, res) => {
  try {
    const total = await JobApplication.countDocuments({ userId: req.userId });
    const statusCounts = await JobApplication.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const statusStats = {};
    statusCounts.forEach(s => { statusStats[s._id] = s.count; });

    res.json({ 
      success: true, 
      data: {
        total,
        byStatus: statusStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CSV Upload
app.post('/api/upload/csv', validateUserId, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file' });
    }

    const results = [];
    const filePath = req.file.path;
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        const application = {
          userId: req.userId,
          company: data.Company || data.company || data.COMPANY,
          position: data.Position || data.position || data.POSITION,
          location: data.Location || data.location,
          salary: data.Salary || data.salary,
          jobUrl: data['Job URL'] || data.jobUrl || data.url,
          linkedinJobId: data['LinkedIn Job ID'] || data.linkedinJobId,
          status: data.Status || data.status || JOB_STATUS.APPLIED,
          dateApplied: data['Date Applied'] ? new Date(data['Date Applied']) : new Date(),
          notes: data.Notes || data.notes || '',
          priority: data.Priority || data.priority || PRIORITY_LEVELS.NORMAL
        };
        
        if (application.company && application.position) {
          results.push(application);
        }
      })
      .on('end', async () => {
        try {
          let created = 0, updated = 0, skipped = 0, errors = 0;

          for (const appData of results) {
            try {
              let existing = null;
              
              if (appData.linkedinJobId) {
                existing = await JobApplication.findOne({
                  userId: req.userId,
                  linkedinJobId: appData.linkedinJobId
                });
              }
              
              if (!existing) {
                existing = await JobApplication.findOne({
                  userId: req.userId,
                  company: { $regex: new RegExp(appData.company, 'i') },
                  position: { $regex: new RegExp(appData.position, 'i') }
                });
              }
              
              if (existing) {
                if (existing.status === JOB_STATUS.REJECTED || existing.status === JOB_STATUS.OFFER) {
                  skipped++;
                  continue;
                }
                
                await JobApplication.findByIdAndUpdate(existing._id, { 
                  ...appData, 
                  lastStatusUpdate: new Date() 
                });
                updated++;
              } else {
                const newApp = new JobApplication(appData);
                await newApp.save();
                created++;
              }
            } catch (err) {
              errors++;
            }
          }

          fs.unlinkSync(filePath);
          res.json({ 
            success: true, 
            stats: { 
              totalProcessed: results.length, 
              created, 
              updated, 
              skipped,
              errors 
            } 
          });
        } catch (error) {
          fs.unlinkSync(filePath);
          res.status(500).json({ success: false, message: error.message });
        }
      })
      .on('error', (error) => {
        fs.unlinkSync(filePath);
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    debugLog('✅ MongoDB connected');
  } catch (error) {
    debugError('❌ MongoDB error:', error.message);
  }
};

// ==================== START SERVER ====================
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    debugLog(`✅ Job Tracker API v1.2.0 running on port ${PORT}`);
    debugLog(`🌐 ${PUBLIC_URL}`);
  });
};

startServer();