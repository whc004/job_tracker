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
} = require('../shared-constants.js');

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
  'job-tracker-duan',
  'job-tracker-adeline',
  'job-tracker-yu',
  'guest'
]);

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

function validateUserId(req, res, next) {
  const userId = req.body.userId || req.query.userId || req.headers['x-user-id'] || req.body._extractedData?.userId;
  
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
  },
  aiAnalysis: {
    matchScore: { type: Number },
    matchingSkills: [String],
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    keyRequirements: [{
      requirement: String,
      hasIt: Boolean
    }],
    recommendation: String,
    detailedAnalysis: String,
    resumeUsed: String,
    resumeName: String,
    analyzedAt: Date
  }
}, { timestamps: true });

jobApplicationSchema.index({ userId: 1, dateApplied: -1 });
jobApplicationSchema.index({ userId: 1, jobUrl: 1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { jobUrl: { $exists: true, $ne: null, $ne: '' } }
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

// ==================== USER SCHEMA (for resumes) ====================
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true, trim: true },
  resumes: [{
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    fileName: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const upload = multer({ dest: '../uploads/' });

// ==================== GEMINI AI SETUP (Direct REST API) ====================

async function analyzeJobWithAI(jobDescription, resumeText) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    // Use stable gemini-1.0-pro model (more widely available)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${API_KEY}`;

    debugLog('🤖 Calling Gemini API...');
    debugLog('📡 API Endpoint:', API_URL.replace(API_KEY, '[API_KEY]'));

    const prompt = `You are an expert technical recruiter. Analyze this resume against the job description and respond with ONLY valid JSON (no markdown).

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return JSON with this structure:
{
  "matchScore": 85,
  "headline": "Strong Match",
  "matchingSkills": ["skill1"],
  "missingSkills": ["skill2"],
  "minimumRequirements": [{"requirement": "text", "met": true, "details": "why"}],
  "strengths": ["point1"],
  "weaknesses": ["point2"],
  "quickFixes": ["tip1"],
  "recommendation": "text",
  "detailedAnalysis": "text"
}

Output ONLY the JSON:`;

    debugLog('📝 Prompt length:', prompt.length, 'characters');
    debugLog('📤 Sending request to Gemini...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
      signal: controller.timeout
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      debugError(`❌ Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    debugLog('✅ Gemini response received:', JSON.stringify(data).substring(0, 200));

    // Extract text from Gemini response
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    debugLog('📝 Raw text from Gemini:', text.substring(0, 300));

    if (!text) {
      throw new Error('No text in Gemini response');
    }

    // Remove markdown code blocks if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();

    // Parse JSON response
    const analysis = JSON.parse(text);
    debugLog('✅ Parsed analysis successfully');

    // Ensure backward compatibility with existing UI (keyRequirements)
    if (analysis.minimumRequirements) {
      analysis.keyRequirements = analysis.minimumRequirements.map(req => ({
        requirement: req.requirement,
        hasIt: req.met
      }));
    }

    return analysis;

  } catch (error) {
    debugError('❌ Gemini AI error:', error.message);
    debugError('Full error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

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

// Test Gemini API models - for debugging
app.get('/api/test-gemini', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        message: 'No API key configured',
        hasApiKey: false
      });
    }

    // Try different model names to see which works
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'models/gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro'
    ];

    const results = {};

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, respond with just "OK"');
        const response = await result.response;
        const text = response.text();
        results[modelName] = { success: true, response: text };
      } catch (error) {
        results[modelName] = { success: false, error: error.message };
      }
    }

    res.json({
      success: true,
      hasApiKey: true,
      apiKeyPrefix: process.env.GEMINI_API_KEY.substring(0, 10) + '...',
      results
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

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

// ==================== RESUME MANAGEMENT ROUTES ====================

// Upload/Add Resume
app.post('/api/users/:userId/resumes', validateUserId, async (req, res) => {
  try {
    const { name, text, fileName } = req.body;

    if (!name || !text) {
      return res.status(400).json({
        success: false,
        message: 'Resume name and text are required'
      });
    }

    let user = await User.findOne({ userId: req.userId });

    if (!user) {
      user = new User({ userId: req.userId, resumes: [] });
    }

    // If this is the first resume, make it active
    const isFirstResume = user.resumes.length === 0;

    const newResume = {
      id: `resume_${Date.now()}`,
      name: name.trim(),
      text: text.trim(),
      fileName: fileName || null,
      isActive: isFirstResume,
      uploadedAt: new Date(),
      updatedAt: new Date()
    };

    user.resumes.push(newResume);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: newResume
    });
  } catch (error) {
    debugError('❌ Error uploading resume:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get User's Resumes
app.get('/api/users/:userId/resumes', validateUserId, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });

    if (!user || user.resumes.length === 0) {
      return res.json({
        success: true,
        data: { resumes: [], activeResume: null }
      });
    }

    const activeResume = user.resumes.find(r => r.isActive);

    res.json({
      success: true,
      data: {
        resumes: user.resumes,
        activeResume: activeResume || null
      }
    });
  } catch (error) {
    debugError('❌ Error fetching resumes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set Active Resume
app.put('/api/users/:userId/resumes/:resumeId/active', validateUserId, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set all resumes to inactive
    user.resumes.forEach(r => r.isActive = false);

    // Set selected resume to active
    const resume = user.resumes.find(r => r.id === req.params.resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    resume.isActive = true;
    await user.save();

    res.json({ success: true, message: 'Active resume updated', data: resume });
  } catch (error) {
    debugError('❌ Error setting active resume:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Resume
app.delete('/api/users/:userId/resumes/:resumeId', validateUserId, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resumeIndex = user.resumes.findIndex(r => r.id === req.params.resumeId);
    if (resumeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const wasActive = user.resumes[resumeIndex].isActive;
    user.resumes.splice(resumeIndex, 1);

    // If deleted resume was active, make first resume active
    if (wasActive && user.resumes.length > 0) {
      user.resumes[0].isActive = true;
    }

    await user.save();

    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    debugError('❌ Error deleting resume:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AI ANALYSIS ROUTES ====================

// Analyze Job with AI
app.post('/api/ai/analyze', validateUserId, async (req, res) => {
  try {
    const { jobDescription, jobId } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    // Get user's active resume
    const user = await User.findOne({ userId: req.userId });

    if (!user || user.resumes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume first',
        needsResume: true
      });
    }

    const activeResume = user.resumes.find(r => r.isActive);
    if (!activeResume) {
      return res.status(400).json({
        success: false,
        message: 'No active resume set',
        needsResume: true
      });
    }

    // Call Gemini AI for analysis
    debugLog('='.repeat(80));
    debugLog('🤖 Starting AI Analysis');
    debugLog('📄 Job Description (first 500 chars):', jobDescription.substring(0, 500));
    debugLog('📝 Resume Text (first 500 chars):', activeResume.text.substring(0, 500));
    debugLog('='.repeat(80));

    const analysis = await analyzeJobWithAI(jobDescription, activeResume.text);

    debugLog('✅ Analysis complete');
    debugLog('='.repeat(80));

    // If jobId provided, save analysis to job record
    if (jobId) {
      try {
        await JobApplication.findOneAndUpdate(
          { _id: jobId, userId: req.userId },
          {
            aiAnalysis: {
              ...analysis,
              resumeUsed: activeResume.id,
              resumeName: activeResume.name,
              analyzedAt: new Date()
            }
          }
        );
        debugLog('✅ Analysis saved to job record');
      } catch (err) {
        debugWarn('⚠️ Could not save analysis to job:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        ...analysis,
        resumeUsed: activeResume.name
      }
    });

  } catch (error) {
    debugError('❌ Error in AI analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI analysis failed',
      error: error.toString()
    });
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
