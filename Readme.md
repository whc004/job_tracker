# Job Tracker

A comprehensive full-stack job application tracking system that combines a Chrome Extension, REST API, and React Dashboard to help you organize and manage your job search efficiently.

## Overview

Job Tracker is an AI-powered job application management system that transforms your job search workflow. With intelligent resume-to-job matching powered by Google Gemini AI, you can instantly analyze how well you match any LinkedIn job posting—complete with match scores, skills gap analysis, and personalized recommendations.

Beyond AI analysis, Job Tracker eliminates manual tracking overhead: one-click saving of job details from LinkedIn, automatic extraction of company info, salary ranges, and technical requirements, all synced to your personal dashboard in real-time.

> **Why the User ID system?** We use a lightweight user ID approach instead of complex authentication to keep our MongoDB storage minimal and free-tier friendly. This keeps the service sustainable without database bloat.

---

## Quick Navigation

- **👤 [User Guide](#user-guide)** - For job seekers who want to use the extension
- **👨‍💻 [Developer Guide](#developer-guide)** - For developers who want to contribute or self-host

---

## 🚀 Install Now

**[Get Job Tracker on Chrome Web Store](https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf)**

Or see the [Developer Guide](#developer-guide) to set up locally.

---

## ✨ Features

### 🤖 AI-Powered Resume Analysis
- **Intelligent Job Matching** - AI-powered comparison between your resume and job descriptions using Google Gemini
- **Match Score Calculation** - Get instant compatibility scores (0-100%) for each job posting
- **Skills Gap Analysis** - Automatically identifies matching skills (✓) and missing skills (✗) with visual breakdown
- **Requirements Validation** - Instant checklist of "Minimum Requirements" to see if you are qualified for the role.
- **Smart Recommendations** - AI-generated "Quick Wins" for improving your application competitiveness
- **Detailed Feedback** - Comprehensive analysis explaining strengths, weaknesses, and action items
- **Resume Management** - Upload multiple resumes and switch between them for different job types
- **One-Click Analysis** - Simply click "Match" on any LinkedIn job page to trigger AI comparison

### Chrome Extension
- **One-Click Save** - Extract job details from LinkedIn with a single click
- **Auto-Fill Data** - Automatically captures company, position, location, salary, job type, experience level, work arrangement, technical keywords, and job URL
- **Smart Keyword Detection** - Identifies 100+ technical skills and tools from job descriptions
- **AI Resume Comparison** - Built-in resume-to-job matching with visual modal displaying detailed analysis
- **Resume Selector** - View current active resume and switch between uploaded resumes directly from popup
- **Real-time Notifications** - Instant feedback on save success/failure and AI analysis results
- **Lightweight & Fast** - Minimal data extraction for quick saves

### Dashboard
- **Resume Management** - Upload, manage, and switch between multiple resume versions
- **View All Applications** - See your complete job search history with AI match scores
- **Status Tracking** - Track progress through: Applied → Interview Rounds 1-5+ → Offer/Rejected
- **Search & Filter** - Find applications by company, position, status, or priority
- **Priority Management** - Mark jobs as Dream Job, High, Medium, or Low priority
- **Notes** - Add notes for each application
- **Analytics Dashboard** - View statistics and trends in your job search
- **Real-time Updates** - Instant synchronization across devices

### Backend API
- **AI Integration** - Google Gemini API integration for intelligent job analysis
- **Resume Storage** - Secure resume upload, storage, and retrieval with MongoDB GridFS
- **Resume Management** - Multi-resume support with active resume switching
- **AI Analysis Endpoint** - Structured JSON responses with match scores, skills breakdown, and recommendations
- **CRUD Operations** - Full create, read, update, delete functionality
- **User ID-based Access** - Simple, lightweight authentication
- **Data Validation** - Ensures data integrity across all operations
- **Statistics Endpoint** - Comprehensive analytics data
- **Error Handling** - Clear, helpful error responses
- **CORS Support** - Enables seamless cross-origin requests

## 🛠 Tech Stack

- **Frontend**: React
- **Chrome Extension**: Vanilla JavaScript with AI-powered analysis modal
- **Backend**: Node.js with Express
- **Database**: MongoDB (free tier) with GridFS for resume storage
- **AI/ML**: Google Gemini 1.5 Flash API for intelligent job matching
- **Deployment**: Railway (Backend) + Vercel (Frontend)

---

# USER GUIDE

# For Non-Technical Users: Track Your Job Applications

## Getting Started with Job Tracker (Easy Setup)

### Step 1: Install Extension
1. Click **[Get Job Tracker on Chrome Web Store](https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf)**
2. Click "Add to Chrome"
3. Confirm the permissions
4. The Job Tracker icon will appear in your toolbar

![Chrome extension icon in toolbar](images/01-extension-toolbar.png)

---

### Step 2: Choose Your Access Method

You have two options to start using Job Tracker:

**Option A: Try as a Guest (No Setup Required)**
- Use the extension immediately without any email requests
- Perfect for testing all the features before committing
- Guest data is stored locally in your browser

**Option B: Request a Personal User ID (Recommended for Regular Use)**
- Get your own unique User ID for better data management
- Follow the steps below to request access

---

### Step 3: Set Up the Extension

#### For Guest Users:
1. Click the Job Tracker icon in your toolbar
2. Select **"Use as Guest"** button
3. You're ready to start tracking jobs!

![Job Tracker guest setup](images/03-linkedin-job-page.png)

#### For Registered Users:
1. Send an email to **vincent0109ccc@gmail.com**
2. **Subject:** "Job Tracker Access Request"
3. **Message:** "I want to use Job Tracker. My preferred User ID is: [your_choice]"
4. **Examples:** `john_jobs`, `job_tracker_2025`, `sarah_applications`
5. Receive your User ID confirmation via email

### Step 4: Activate Your User ID

1. Click the Job Tracker icon in your toolbar
2. Paste your User ID in the input field
3. Click "Set User ID"

![Job Tracker extension settings](images/02-extension-settings.png)

4. You're ready to start!

![Job Tracker on LinkedIn job page](images/03-linkedin-job-page.png)

---

### Tips

- **Just exploring?** Start as a guest to try all features without commitment
- **Ready for more?** Request a personal User ID for enhanced data organization
- **Need help?** Contact vincent0109ccc@gmail.com with any questions

---

## How to Use

### Saving a Job Application

1. Go to **LinkedIn** (linkedin.com)
2. Search for jobs or browse job listings
3. Click on any job listing that interests you
4. Click **"Mark as Applied"** button
5. You'll see a confirmation notification

<img src="images/04-extension-popup-fields.png" width="600">


### View Your Applications

1. Visit **[Job Tracker Dashboard](https://job-tracker-gamma-three.vercel.app)**
2. Enter your User ID
3. Click **"Access Dashboard"**
<img src="images/09-dashboard-log-in-page.png" width="600">

4. See all your saved job applications in one place
<img src="images/05-dashboard-table.png" width="600">

### Manage Your Applications

1. Click on any job application in the dashboard
2. Update the application status:
   - Applied
   - Interview - Round 1
   - Interview - Round 2
   - Interview - Round 3
   - Interview - Round 4
   - Interview - Round 5+
   - Offer
   - Rejected
   - No Response
3. Add notes about the company, interview time, or contact person
4. Set priority: Star or Normal
5. Click **"Save"** when done

<img src="images/06-dashboard-edit-modal.png" width="600">

### Track Your Progress in Real-Time

1. After saving a job in the extension, go to the dashboard
2. Refresh the page using refresh bottom
3. Your new application appears instantly on the dashboard

<img src="images/08-chrome-extensions-page.png" width="600">
<img src="images/07-dashboard-new-app-saved.png" width="600">

---

## AI-Powered Resume Analysis

### Upload Your Resume

1. Visit the **[Job Tracker Dashboard](https://job-tracker-gamma-three.vercel.app)**
2. Enter your User ID and access your dashboard
3. Click **"Upload Resume"** or the resume management section
4. Select your resume file (PDF, DOC, DOCX, or TXT)
5. Your resume is securely stored and ready for AI analysis

### Analyze Job Match with AI

1. Go to any **LinkedIn job page** that interests you
2. Click the **Job Tracker extension icon** in your toolbar
3. Click the **"🤖 Match"** button to trigger AI analysis
4. Wait a few seconds while AI analyzes the job against your resume
5. View your personalized analysis modal with:
   - **⚡ Minimum Requirements** - Critical must-have requirements with ✓/✗ indicators
   - **📊 Skills Breakdown** - Your matching skills (green ✓) and missing skills (red ✗)
   - **🚀 Quick Wins** - Actionable tips to improve your application competitiveness
   - **💡 Detailed Feedback** - Comprehensive AI analysis of your fit for the role

### Switch Between Multiple Resumes

1. Click the **Job Tracker extension icon**
2. In the popup, find the **"📄 Current Resume"** section
3. Click **"Change"** to see all your uploaded resumes
4. Select a different resume for different job types (e.g., frontend-focused vs. full-stack)
5. If on a LinkedIn job page, the AI will automatically re-analyze with your newly selected resume

### Tips for Best AI Results

- **Keep resumes updated** - Upload fresh versions when you gain new skills or experience
- **Use multiple resume versions** - Create specialized resumes for different job types
- **Pay attention to Quick Wins** - AI-generated tips can significantly improve your applications
- **Review minimum requirements first** - Focus on jobs where you meet all critical requirements
- **Check skills gaps** - Use missing skills as a learning roadmap

---

## Tips for Best Results

- **Save often** - The more jobs you track, the better you can see patterns
- **Update status regularly** - Keep your progress up-to-date for accurate tracking
- **Use notes** - Write down important details about each company
- **Set reminders** - Use follow-up dates to remember when to reach out

## Troubleshooting

**"Extension not showing on LinkedIn"**
- Make sure you're on a LinkedIn job searching page
- Try refreshing the page
- Check that the extension is enabled in Chrome

**"Can't save the job"**
- Verify your User ID is correct in the extension settings
- Check your internet connection
- Make sure the dashboard is accessible

**"My data isn't appearing on the dashboard"**
- Make sure you used the same User ID
- Refresh the dashboard page
- Wait a few seconds after saving

---

# DEVELOPER GUIDE

For developers who want to contribute, self-host, or understand the architecture.

## Prerequisites
- Chrome Browser (v90+)
- Node.js v14+
- Git
- MongoDB account (free tier at mongodb.com)

## Installation (Local Development)

### Step 1: Clone Repository
```bash
git clone https://github.com/whc004/job_tracker.git
cd job_tracker
```

### Step 2: Install Extension Locally
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension will appear in your toolbar

### Step 3: Set Up Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

### Step 4: Set Up Frontend
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your backend API URL
npm start
```

### Step 5: Testing
- Visit `http://localhost:3000` for the dashboard
- Use the extension on LinkedIn to test

## Project Structure

```
job_tracker/
├── client/                    # React Dashboard (Vercel)
│   ├── src/
│   ├── package.json
│   └── .env
├── extension/                 # Chrome Extension
│   ├── manifest.json
│   ├── popup.html/js
│   ├── content.js
│   └── icons/
├── server/                    # Express API (Railway)
│   ├── src/index.js
│   ├── package.json
│   └── .env
└── shared-constants.js        # Shared constants
```

## Environment Variables

### Backend (.env in `/server`)
```
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job_tracker
GEMINI_API_KEY=your_google_gemini_api_key_here
CORS_ORIGIN=chrome-extension://your_extension_id
REACT_APP_API_URL=https://job-tracker-api.railway.app
```

**Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (free tier available)
3. Add it to your `.env` file as `GEMINI_API_KEY`

### Frontend (.env in `/client`)
```
REACT_APP_API_URL=http://localhost:3000
```

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for complete endpoint documentation.

### Key Endpoints
- `POST /api/jobs` - Save a job
- `GET /api/jobs/:userId` - Get all jobs for user
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job
- `GET /api/statistics/:userId` - Get user statistics
- `POST /api/users/:userId/resumes` - Upload a resume (multipart/form-data)
- `GET /api/users/:userId/resumes` - Get all resumes for user with active resume info
- `PUT /api/users/:userId/resumes/:resumeId/active` - Set active resume
- `POST /api/analyze` - AI-powered job analysis (requires userId, jobDescription, resumeText)

## Deployment

### Deploy Backend (Railway)
1. Push code to GitHub
2. Go to railway.app
3. Create new project from GitHub repo
4. Add environment variables
5. Railway auto-deploys on git push

### Deploy Frontend (Vercel)
1. Push code to GitHub
2. Go to vercel.com
3. Import GitHub repository
4. Select `/client` as root directory
5. Add `REACT_APP_API_URL` environment variable
6. Vercel auto-deploys on git push

### Publish to Chrome Web Store
See [CHROME_STORE_GUIDE.md](./CHROME_STORE_GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## How It Works (Architecture)

### Job Saving Workflow
1. User clicks extension icon on LinkedIn
2. Content script extracts visible job data using DOM parsing
3. Data sent to backend API with user ID
4. Backend validates and stores in MongoDB
5. User visits dashboard and enters user ID
6. Dashboard fetches their data in real-time
7. User updates status, notes, priority
8. Changes sync instantly

### AI Analysis Workflow
1. User uploads resume to dashboard (stored in MongoDB GridFS)
2. User clicks "Match" button on LinkedIn job page
3. Extension extracts job description via DOM parsing
4. Extension sends job description + userId to backend `/api/analyze`
5. Backend fetches user's active resume from MongoDB
6. Backend constructs structured prompt with resume + job description
7. Backend sends request to Google Gemini API (gemini-2.5-flash model)
8. Gemini returns JSON with match score, skills breakdown, requirements analysis
9. Backend parses and validates AI response
10. Response sent back to extension
11. Extension displays beautiful analysis modal with:
    - Minimum Requirements (must-haves)
    - Skills Breakdown (matching/missing)
    - Quick Wins (actionable tips)
    - Detailed Feedback (comprehensive analysis)

## Performance

- **Extension extraction**: <500ms
- **API response time**: <100ms (non-AI endpoints)
- **AI analysis time**: 2-5 seconds (depends on Gemini API)
- **Resume upload**: Supports files up to 5MB
- **Database queries**: Optimized with indexes
- **Dashboard load**: <2 seconds

## Technology Details

### Chrome Extension
- Vanilla JavaScript (no frameworks)
- DOM parsing for data extraction
- Chrome Storage API for user ID
- Message passing for content/popup communication

### Frontend (React)
- React hooks for state management
- Responsive design with CSS Flexbox
- Real-time updates with API calls
- Deployed on Vercel

### Backend (Express)
- RESTful API design
- MongoDB for data persistence
- CORS enabled for cross-origin requests
- Error handling and validation

## License

MIT License - see [LICENSE](./LICENSE)

## Support

- **User Issues**: Email vincent0109ccc@gmail.com
- **Developer Questions**: Open an issue on [GitHub Issues](https://github.com/whc004/job_tracker/issues)
- **Feature Requests**: Submit via GitHub Issues

---

## 🌍 Links

- **Chrome Web Store**: https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf
- **Dashboard**: https://job-tracker-gamma-three.vercel.app
- **API Server**: https://job-tracker-api.railway.app
- **GitHub Repository**: https://github.com/whc004/job_tracker

---

**Happy job hunting! 🚀**

Built with ❤️ to make your job search easier.
