const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');

// Load environment variables
dotenv.config();

console.log('🚀 Starting Job Tracker API...');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('✅ Middleware configured');

// Job Application Schema
const jobApplicationSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  jobUrl: {
    type: String,
    trim: true
  },
  // Updated status options to match your workflow
  status: {
    type: String,
    enum: ['Applied', 'OA', 'Behavioral Interview', 'Technical Interview', 'Final Interview', 'Offer', 'Rejected', 'No Response'],
    default: 'Applied'
  },
  // Technical details for technical interviews
  technicalDetails: {
    type: [String], // Array like ["DSA", "Node.js", "SQL", "System Design"]
    default: []
  },
  dateApplied: {
    type: Date,
    default: Date.now
  },
  followUpDate: {
    type: Date
  },
  // Track when status was last updated for auto "No Response"
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  contactPerson: {
    type: String,
    trim: true
  },
  // Enhanced priority levels
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Dream Job'],
    default: 'Medium'
  }
}, {
  timestamps: true
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
console.log('✅ Database model created');

// Configure multer for file uploads path
const upload = multer({ dest: '../uploads/' });

// Routes

// Health check endpoint - Test this first!
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Job Tracker API is running!',
    version: '1.0.0',
    endpoints: [
      'GET /api/applications - Get all applications',
      'POST /api/applications - Create application', 
      'GET /api/applications/:id - Get single application',
      'PUT /api/applications/:id - Update application',
      'DELETE /api/applications/:id - Delete application',
      'GET /api/stats - Get statistics',
      'POST /api/upload/csv - Upload CSV file'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Job Tracker API is healthy!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// GET /api/applications - Get all applications
app.get('/api/applications', async (req, res) => {
  try {
    console.log('📋 Getting all applications...');
    const applications = await JobApplication.find().sort({ dateApplied: -1 });
    
    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// POST /api/applications - Create new application
app.post('/api/applications', async (req, res) => {
  try {
    console.log('➕ Creating new application:', req.body);
    const application = new JobApplication(req.body);
    await application.save();
    
    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application
    });
  } catch (error) {
    console.error('❌ Error creating application:', error);
    
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
app.get('/api/applications/:id', async (req, res) => {
  try {
    console.log('🔍 Getting application:', req.params.id);
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('❌ Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
});

// PUT /api/applications/:id - Update application
app.put('/api/applications/:id', async (req, res) => {
  try {
    console.log('✏️ Updating application:', req.params.id);
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    console.error('❌ Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
});

// DELETE /api/applications/:id - Delete application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting application:', req.params.id);
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
});

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    console.log('📊 Getting updated statistics...');
    
    const total = await JobApplication.countDocuments();
    
    const statusCounts = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusStats = {};
    statusCounts.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    // Focus on positive progress metrics instead of anxiety-inducing ones
    res.json({
      success: true,
      data: {
        total,
        byStatus: statusStats,
        // Individual status counts for filtering
        applied: statusStats.Applied || 0,
        oa: statusStats.OA || 0,
        behavioralInterview: statusStats['Behavioral Interview'] || 0,
        technicalInterview: statusStats['Technical Interview'] || 0,
        finalInterview: statusStats['Final Interview'] || 0,
        offers: statusStats.Offer || 0,
        rejected: statusStats.Rejected || 0,
        noResponse: statusStats['No Response'] || 0,
        
        // Positive progress metrics
        activeOpportunities: (statusStats.Applied || 0) + 
                           (statusStats.OA || 0) + 
                           (statusStats['Behavioral Interview'] || 0) + 
                           (statusStats['Technical Interview'] || 0) + 
                           (statusStats['Final Interview'] || 0),
        
        interviewProgress: (statusStats['Behavioral Interview'] || 0) + 
                          (statusStats['Technical Interview'] || 0) + 
                          (statusStats['Final Interview'] || 0),
        
        // Interview conversion rate - focuses on progress rather than failures
        interviewRate: total > 0 ? 
          Math.round(((statusStats['Behavioral Interview'] || 0) + 
                     (statusStats['Technical Interview'] || 0) + 
                     (statusStats['Final Interview'] || 0) + 
                     (statusStats.Offer || 0)) / total * 100) : 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// POST /api/upload/csv - Upload and parse CSV file
app.post('/api/upload/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    console.log('📁 Processing CSV upload:', req.file.filename);
    
    const results = [];
    const filePath = req.file.path;

    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        // Map CSV columns to our schema - flexible column naming
        const application = {
          company: data.Company || data.company || data.COMPANY,
          position: data.Position || data.position || data.POSITION,
          location: data.Location || data.location || data.LOCATION,
          salary: data.Salary || data.salary || data.SALARY,
          jobUrl: data['Job URL'] || data.jobUrl || data.url || data.URL,
          status: data.Status || data.status || data.STATUS || 'Applied',
          dateApplied: data['Date Applied'] || data.dateApplied || data.date ? 
            new Date(data['Date Applied'] || data.dateApplied || data.date) : new Date(),
          followUpDate: data['Follow Up Date'] || data.followUpDate ? 
            new Date(data['Follow Up Date'] || data.followUpDate) : null,
          notes: data.Notes || data.notes || data.NOTES || '',
          contactPerson: data['Contact Person'] || data.contactPerson || data.contact || '',
          priority: data.Priority || data.priority || data.PRIORITY || 'Medium',
          technicalDetails: data['Technical Details'] || data.technicalDetails || data.technical ? 
            (data['Technical Details'] || data.technicalDetails || data.technical).split(',').map(item => item.trim()) : []
        };

        // Only add if company and position exist
        if (application.company && application.position) {
          results.push(application);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 Parsed ${results.length} applications from CSV`);
          
          let created = 0;
          let updated = 0;
          let errors = 0;

          // Process each application
          for (const appData of results) {
            try {
              // Check if application already exists (same company + position)
              const existing = await JobApplication.findOne({
                company: { $regex: new RegExp(appData.company, 'i') },
                position: { $regex: new RegExp(appData.position, 'i') }
              });

              if (existing) {
                // Update existing application
                await JobApplication.findByIdAndUpdate(existing._id, {
                  ...appData,
                  lastStatusUpdate: new Date()
                });
                updated++;
              } else {
                // Create new application
                const newApp = new JobApplication({
                  ...appData,
                  lastStatusUpdate: new Date()
                });
                await newApp.save();
                created++;
              }
            } catch (error) {
              console.error('Error processing application:', error);
              errors++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          res.json({
            success: true,
            message: 'CSV processed successfully',
            stats: {
              totalProcessed: results.length,
              created,
              updated,
              errors
            }
          });

        } catch (error) {
          console.error('❌ Error saving applications:', error);
          fs.unlinkSync(filePath);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV data',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('❌ Error parsing CSV:', error);
        fs.unlinkSync(filePath);
        res.status(500).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('❌ CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading CSV',
      error: error.message
    });
  }
});

// MongoDB Connection - Updated version without deprecated options
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('Connection URI (masked):', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error details:', error);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀========================================🚀');
    console.log(`✅ Job Tracker API is running on port ${PORT}`);
    console.log(`🌐 Test it: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log('🚀========================================🚀');
    console.log('');
  });
};

startServer();