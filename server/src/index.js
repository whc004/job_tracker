// Core deps
const express = require('express'), mongoose = require('mongoose');
const cors = require('cors'), dotenv = require('dotenv');
const multer = require('multer'), csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();
console.log('🚀 Starting Job Tracker API...');

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_URL =
  process.env.RAILWAY_STATIC_URL ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  `http://localhost:${PORT}`;

const VALID_USER_IDS = new Set([
  'job-tracker_vincent','job-tracker-don','job-tracker-alex','job-tracker-leo','job-tracker-duan'
]);

// Middleware to validate User ID
function validateUserId(req, res, next) {
  // Extract userId from multiple possible locations
  const userId = req.body.userId || req.query.userId || req.headers['x-user-id'] || req.body._extractedData?.userId;
  console.log('🔍 Checking User ID:', userId);

  // Check if userId exists
  if (!userId) return res.status(401).json({ success:false, message:'User ID is required. Please set your User ID in the extension popup.' });

  // Check if userId is valid
  if (!VALID_USER_IDS.has(userId)) return res.status(403).json({ success:false, message:'Invalid User ID. Please contact admin for access.' });

  console.log('✅ Valid User ID:', userId);
  // Attach userId to request for use in routes
  req.userId = userId; next();
}
console.log('✅ User ID validation configured');
console.log('📋 Valid User IDs:', [...VALID_USER_IDS]);

// Middleware
app.use(cors()); app.use(express.json());
app.use((req,_res,next)=>{ console.log(`[REQ] ${req.method} ${req.url}`); next(); });
console.log('✅ Middleware configured');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find duplicate job application
 * Priority: URL → LinkedIn ID → Company+Position
 */
async function findDuplicateJob(userId, { jobUrl, linkedinJobId, company, position }) {
  let existingJob = null;

  // FIRST: Check by URL (most reliable)
  if (jobUrl && jobUrl.trim()) {
    console.log('🔍 [Priority 1] Checking duplicate by URL:', jobUrl);
    existingJob = await JobApplication.findOne({
      userId: userId,
      jobUrl: jobUrl.trim()
    });
    
    if (existingJob) {
      console.log('✅ Found existing job by URL:', existingJob._id);
      return existingJob;
    }
  }

  // SECOND: Check by LinkedIn Job ID
  if (!existingJob && linkedinJobId) {
    console.log('🔍 [Priority 2] Checking duplicate by LinkedIn Job ID:', linkedinJobId);
    existingJob = await JobApplication.findOne({
      userId: userId,
      linkedinJobId: linkedinJobId
    });
    
    if (existingJob) {
      console.log('✅ Found existing job by LinkedIn ID:', existingJob._id);
      return existingJob;
    }
  }
  return null;
}

/**
 * Handle duplicate job based on status
 * Returns: { shouldBlock: boolean, response: object|null }
 */
function handleDuplicateByStatus(existingJob) {
  console.log('⚠️ Duplicate found:', existingJob._id, 'Status:', existingJob.status);
  
  const jobInfo = {
    id: existingJob._id,
    position: existingJob.position,
    company: existingJob.company,
    status: existingJob.status,
    dateApplied: existingJob.dateApplied
  };

  switch (existingJob.status) {
    // 🚫 TERMINAL STATE - BLOCK completely
    case 'Offer':
      console.log('🚫 BLOCKED - Already has offer');
      return {
        shouldBlock: true,
        response: {
          success: false,
          isDuplicate: true,
          message: `You already have an offer for "${existingJob.position}" at ${existingJob.company}!`,
          existing: jobInfo
        }
      };
    
    // 🔒 ACTIVE INTERVIEW STATES - BLOCK (already in process)
    case 'OA':
    case 'Behavioral Interview':
    case 'Technical Interview':
    case 'Final Interview':
      console.log('🔒 BLOCKED - Interview in progress');
      return {
        shouldBlock: true,
        response: {
          success: false,
          isDuplicate: true,
          message: `You already have an active interview process for "${existingJob.position}" at ${existingJob.company}. Status: ${existingJob.status}`,
          existing: jobInfo
        }
      };
    
    // ✅ ALLOW RE-APPLICATION - Can try again
    case 'Rejected':
      console.log('✅ ALLOWED - Rejected, can reapply');
      return { shouldBlock: false, response: null };
    
    case 'No Response':
      console.log('✅ ALLOWED - No response, can try again');
      return { shouldBlock: false, response: null };
    
    case 'Applied':
      console.log('✅ ALLOWED - Recently applied, updating info');
      return { shouldBlock: false, response: null };
    
    default:
      console.log('✅ ALLOWED - Default case, updating');
      return { shouldBlock: false, response: null };
  }
}

/**
 * Update existing job application with new data
 */
async function updateExistingJob(existingJob, applicationData) {
  console.log('🔄 Updating existing job entry');
  
  // Update basic fields
  existingJob.company = applicationData.company || existingJob.company;
  existingJob.position = applicationData.position || existingJob.position;
  existingJob.location = applicationData.location || existingJob.location;
  existingJob.salary = applicationData.salary || existingJob.salary;
  existingJob.jobUrl = applicationData.jobUrl || existingJob.jobUrl;
  existingJob.linkedinJobId = applicationData.linkedinJobId || existingJob.linkedinJobId;
  existingJob.jobType = applicationData.jobType || existingJob.jobType;
  existingJob.experienceLevel = applicationData.experienceLevel || existingJob.experienceLevel;
  existingJob.workArrangement = applicationData.workArrangement || existingJob.workArrangement;
  
  // Merge technical details (avoid duplicates)
  if (applicationData.technicalDetails && applicationData.technicalDetails.length > 0) {
    const existingDetails = new Set(existingJob.technicalDetails || []);
    applicationData.technicalDetails.forEach(detail => existingDetails.add(detail));
    existingJob.technicalDetails = Array.from(existingDetails);
  }
  
  // Optional fields - only update if provided
  if (applicationData.notes) existingJob.notes = applicationData.notes;
  
  // Update timestamp
  existingJob.lastStatusUpdate = new Date();
  
  await existingJob.save();
  
  console.log('✅ Job updated successfully');
  return existingJob;
}

// Job Application Schema - UPDATED WITH LINKEDIN JOB ID
const jobApplicationSchema = new mongoose.Schema({
  // User identification - REQUIRED for multi-user support
  userId:{ type:String, required:[true,'User ID is required'], index:true, trim:true },

  // ⭐ NEW: LinkedIn Job ID for duplicate detection
  linkedinJobId:{ type:String, required:false, index:true, trim:true },

  // Core job information
  company:{ type:String, required:[true,'Company name is required'], trim:true },
  position:{ type:String, required:[true,'Position is required'], trim:true },
  location:{ type:String, trim:true },
  salary:{ type:String, trim:true },
  jobUrl:{ type:String, trim:true },

  // Application status workflow
  status:{ type:String, enum:['Applied','OA','Behavioral Interview','Technical Interview','Final Interview','Offer','Rejected','No Response'], default:'Applied' },

  // Additional job details from extension
  jobType:{ type:String, trim:true },
  experienceLevel:{ type:String, trim:true },
  workArrangement:{ type:String, trim:true },

  // Technical details for technical interviews
  technicalDetails:{ type:[String], default:[] }, // Array like ["DSA","Node.js","SQL","System Design"]

  // Date tracking
  dateApplied:{ type:Date, default:Date.now },
  followUpDate:{ type:Date },
  lastStatusUpdate:{ type:Date, default:Date.now },

  // Additional information
  notes:{ type:String, maxlength:[1000,'Notes cannot exceed 1000 characters'] },
  contactPerson:{ type:String, trim:true },

  // Priority levels
  priority:{ type:String, enum:['Low','Medium','High','Dream Job'], default:'Medium' }
},{ timestamps:true }); // Adds createdAt and updatedAt automatically

// Create compound index for efficient queries by user and date
jobApplicationSchema.index({ userId:1, dateApplied:-1 });

// ⭐ NEW: Compound unique index for duplicate prevention
// This prevents the same user from saving the same LinkedIn job twice
jobApplicationSchema.index({ userId:1, jobUrl:1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { jobUrl: { $exists: true, $ne: null, $ne: '' } }
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
console.log('✅ Database model created with duplicate prevention index');

// Configure multer for file uploads path
const upload = multer({ dest:'../uploads/' });

// Routes

// Health check endpoint - Test this first!
app.get('/', (_req,res)=>res.json({
  message:'🎉 Job Tracker API is running!', version:'1.1.0',
  endpoints:[
    'GET /api/applications - Get all applications',
    'POST /api/applications - Create application (with duplicate detection)',
    'GET /api/applications/:id - Get single application',
    'PUT /api/applications/:id - Update application',
    'DELETE /api/applications/:id - Delete application',
    'GET /api/stats - Get statistics',
    'POST /api/upload/csv - Upload CSV file'
  ]
}));

app.get('/api/health', (_req,res)=>res.json({
  success:true, message:'Job Tracker API is healthy!', timestamp:new Date().toISOString(),
  database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
}));

// GET /api/applications - Get all applications
app.get('/api/applications', validateUserId, async (req,res)=>{
  try{
    console.log('📋 Getting applications for user:', req.userId);
    const applications = await JobApplication.find({ userId:req.userId }).sort({ createdAt:-1 });
    res.json({ success:true, count:applications.length, data:applications });
  }catch(error){
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({ success:false, message:'Error fetching applications', error:error.message });
  }
});

// POST /api/applications - Create new application
app.post('/api/applications', validateUserId, async (req, res) => {
  try {
    console.log('➕ Creating new application for user:', req.userId);
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const { linkedinJobId, jobUrl, company, position } = req.body;
    
    // Build application data with validated userId
    const applicationData = { ...req.body, userId: req.userId };
    delete applicationData._extractedData;

    // ============================================
    // DUPLICATE DETECTION
    // ============================================
    const existingJob = await findDuplicateJob(req.userId, {
      jobUrl,
      linkedinJobId,
      company,
      position
    });

    if (existingJob) {
      // Check if we should block based on status
      const { shouldBlock, response } = handleDuplicateByStatus(existingJob);
      
      if (shouldBlock) {
        return res.json(response);
      }
      
      // Not blocked - update the existing job
      const updatedJob = await updateExistingJob(existingJob, applicationData);
      
      return res.json({
        success: true,
        isUpdate: true,
        message: 'Job application updated successfully',
        data: updatedJob
      });
    }

    // ============================================
    // NO DUPLICATE - CREATE NEW JOB
    // ============================================
    console.log('✨ No duplicate found - Creating new job');
    const application = new JobApplication(applicationData);
    await application.save();
    
    console.log('✅ New job created:', application._id);
    res.status(201).json({
      success: true,
      isUpdate: false,
      message: 'Application created successfully',
      data: application
    });
    
  } catch (error) {
    console.error('❌ Error creating application:', error);
    
    // Handle duplicate key error (MongoDB unique index violation)
    if (error.code === 11000) {
      console.log('⚠️ Duplicate key error caught by database index');
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'This job has already been saved to your tracker',
        error: 'Duplicate entry'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  }
});

// GET /api/applications/:id - Get single application
app.get('/api/applications/:id', validateUserId, async (req,res)=>{
  try{
    console.log('🔍 Getting application:', req.params.id, 'for user:', req.userId);
    // Only get if user owns this application
    const application = await JobApplication.findOne({ _id:req.params.id, userId:req.userId });
    if (!application) return res.status(404).json({ success:false, message:'Application not found' });
    res.json({ success:true, data:application });
  }catch(error){
    console.error('❌ Error fetching application:', error);
    res.status(500).json({ success:false, message:'Error fetching application', error:error.message });
  }
});

// PUT /api/applications/:id - Update application
app.put('/api/applications/:id', validateUserId, async (req,res)=>{
  try{
    console.log('✏️ Updating application:', req.params.id, 'for user:', req.userId);
    // Only update if user owns this application
    const application = await JobApplication.findOneAndUpdate(
      { _id:req.params.id, userId:req.userId }, // Security: ensure user owns this
      { ...req.body, lastStatusUpdate: new Date() },
      { new:true, runValidators:true }
    );
    if (!application) return res.status(404).json({ success:false, message:'Application not found or you do not have permission to update it' });
    res.json({ success:true, message:'Application updated successfully', data:application });
  }catch(error){
    console.error('❌ Error updating application:', error);
    res.status(500).json({ success:false, message:'Error updating application', error:error.message });
  }
});

// DELETE /api/applications/:id - Delete application
app.delete('/api/applications/:id', validateUserId, async (req,res)=>{
  try{
    console.log('🗑️ Deleting application:', req.params.id, 'for user:', req.userId);
    // Only delete if user owns this application
    const application = await JobApplication.findOneAndDelete({ _id:req.params.id, userId:req.userId }); // Security: ensure user owns this
    if (!application) return res.status(404).json({ success:false, message:'Application not found or you do not have permission to delete it' });
    res.json({ success:true, message:'Application deleted successfully' });
  }catch(error){
    console.error('❌ Error deleting application:', error);
    res.status(500).json({ success:false, message:'Error deleting application', error:error.message });
  }
});

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', validateUserId, async (req,res)=>{
  try{
    console.log('📊 Getting statistics for user:', req.userId);
    // Only count applications for THIS user
    const total = await JobApplication.countDocuments({ userId:req.userId });
    const statusCounts = await JobApplication.aggregate([
      { $match:{ userId:req.userId } }, // Filter by user first
      { $group:{ _id:'$status', count:{ $sum:1 } } }
    ]);
    const statusStats = {}; statusCounts.forEach(s=>{ statusStats[s._id]=s.count; });

    // Focus on positive progress metrics instead of anxiety-inducing ones
    res.json({ success:true, data:{
      total, byStatus:statusStats,
      // Individual status counts for filtering
      applied:statusStats.Applied||0, oa:statusStats.OA||0,
      behavioralInterview:statusStats['Behavioral Interview']||0,
      technicalInterview:statusStats['Technical Interview']||0,
      finalInterview:statusStats['Final Interview']||0,
      offers:statusStats.Offer||0, rejected:statusStats.Rejected||0,
      noResponse:statusStats['No Response']||0,

      // Positive progress metrics
      activeOpportunities:(statusStats.Applied||0)+(statusStats.OA||0)+(statusStats['Behavioral Interview']||0)+(statusStats['Technical Interview']||0)+(statusStats['Final Interview']||0),

      interviewProgress:(statusStats['Behavioral Interview']||0)+(statusStats['Technical Interview']||0)+(statusStats['Final Interview']||0),

      // Interview conversion rate - focuses on progress rather than failures
      interviewRate: total>0 ? Math.round(((statusStats['Behavioral Interview']||0)+(statusStats['Technical Interview']||0)+(statusStats['Final Interview']||0)+(statusStats.Offer||0))/total*100) : 0
    }});
  }catch(error){
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ success:false, message:'Error fetching statistics', error:error.message });
  }
});

// POST /api/upload/csv - Upload and parse CSV file
app.post('/api/upload/csv', validateUserId, upload.single('csvFile'), async (req,res)=>{
  try{
    if (!req.file) return res.status(400).json({ success:false, message:'No CSV file uploaded' });
    console.log('📁 Processing CSV upload:', req.file.filename);

    const results=[], filePath=req.file.path;
    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data',(data)=>{
        // Map CSV columns to our schema - flexible column naming
        const application={
          userId: req.userId, // Use the validated userId
          company:data.Company||data.company||data.COMPANY,
          position:data.Position||data.position||data.POSITION,
          location:data.Location||data.location||data.LOCATION,
          salary:data.Salary||data.salary||data.SALARY,
          jobUrl:data['Job URL']||data.jobUrl||data.url||data.URL,
          linkedinJobId: data['LinkedIn Job ID']||data.linkedinJobId||data['Job ID']||null,
          status:data.Status||data.status||data.STATUS||'Applied',
          dateApplied: data['Date Applied']||data.dateApplied||data.date ? new Date(data['Date Applied']||data.dateApplied||data.date) : new Date(),
          followUpDate: data['Follow Up Date']||data.followUpDate ? new Date(data['Follow Up Date']||data.followUpDate) : null,
          notes:data.Notes||data.notes||data.NOTES||'',
          contactPerson:data['Contact Person']||data.contactPerson||data.contact||'',
          priority:data.Priority||data.priority||data.PRIORITY||'Medium',
          technicalDetails: data['Technical Details']||data.technicalDetails||data.technical ? (data['Technical Details']||data.technicalDetails||data.technical).split(',').map(s=>s.trim()) : []
        };
        // Only add if company and position exist
        if (application.company && application.position) results.push(application);
      })
      .on('end', async ()=>{
        try{
          console.log(`📊 Parsed ${results.length} applications from CSV`);
          let created=0, updated=0, skipped=0, errors=0;

          // Process each application
          for (const appData of results){
            try{
              // Check for duplicate by linkedinJobId first (if available)
              let existing = null;
              
              if (appData.linkedinJobId) {
                existing = await JobApplication.findOne({
                  userId: req.userId,
                  linkedinJobId: appData.linkedinJobId
                });
              }
              
              // Fallback: check by company + position if no linkedinJobId match
              if (!existing) {
                existing = await JobApplication.findOne({
                  userId: req.userId,
                  company:{ $regex:new RegExp(appData.company,'i') },
                  position:{ $regex:new RegExp(appData.position,'i') }
                });
              }
              
              if (existing){
                // Skip if status is Rejected or Offer
                if (existing.status === 'Rejected' || existing.status === 'Offer') {
                  console.log(`⏭️ Skipping ${appData.position} at ${appData.company} - Status: ${existing.status}`);
                  skipped++;
                  continue;
                }
                
                // Update existing application
                await JobApplication.findByIdAndUpdate(existing._id,{ 
                  ...appData, 
                  lastStatusUpdate:new Date() 
                });
                updated++;
              } else {
                // Create new application
                const newApp = new JobApplication({ ...appData, lastStatusUpdate:new Date() });
                await newApp.save(); 
                created++;
              }
            }catch(err){ 
              console.error('Error processing application:', err); 
              errors++; 
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(filePath);
          res.json({ 
            success:true, 
            message:'CSV processed successfully', 
            stats:{ 
              totalProcessed:results.length, 
              created, 
              updated, 
              skipped,
              errors 
            } 
          });
        }catch(error){
          console.error('❌ Error saving applications:', error);
          fs.unlinkSync(filePath);
          res.status(500).json({ success:false, message:'Error processing CSV data', error:error.message });
        }
      })
      .on('error',(error)=>{
        console.error('❌ Error parsing CSV:', error);
        fs.unlinkSync(filePath);
        res.status(500).json({ success:false, message:'Error parsing CSV file', error:error.message });
      });
  }catch(error){
    console.error('❌ CSV upload error:', error);
    res.status(500).json({ success:false, message:'Error uploading CSV', error:error.message });
  }
});

// MongoDB Connection - Updated version without deprecated options
const connectDB = async ()=>{
  try{
    console.log('🔄 Connecting to MongoDB...');
    console.log('Connection URI (masked):', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
    if (!process.env.MONGODB_URI){
      console.log('RAILWAY ENV VAR TEST:', process.env.MONGODB_URI ? 'MONGODB_URI loaded ✅' : '❌ MONGODB_URI missing');
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log('✅ Duplicate prevention index active');
  }catch(error){
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error details:', error);
  }
};

// Start server
const startServer = async ()=>{
  await connectDB();
  app.listen(PORT, ()=> {
    console.log('🚀========================================🚀');
    console.log(`✅ Job Tracker API v1.1.0 is running on port ${PORT}`);
    console.log(`🌐 Base URL: ${PUBLIC_URL}`);
    console.log(`🏥 Health check: ${PUBLIC_URL.replace(/\/$/, '')}/api/health`);
    console.log('🔒 Duplicate detection: ENABLED');
    console.log('🚀========================================🚀');
  });
};
startServer();