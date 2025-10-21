# Job Tracker

A comprehensive full-stack job application tracking system that combines a Chrome Extension, REST API, and React Dashboard to help you organize and manage your job search efficiently.

## Overview

Job Tracker eliminates the pain of manually tracking job applications across multiple platforms. With one click, save job details from LinkedIn directly to your personal dashboard, complete with auto-extracted company info, salary ranges, technical requirements, and more.

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

### Chrome Extension
- **One-Click Save** - Extract job details from LinkedIn with a single click
- **Auto-Fill Data** - Automatically captures company, position, location, salary, job type, experience level, work arrangement, technical keywords, and job URL
- **Smart Keyword Detection** - Identifies 100+ technical skills and tools from job descriptions
- **Real-time Notifications** - Instant feedback on save success/failure
- **Lightweight & Fast** - Minimal data extraction for quick saves

### Dashboard
- **View All Applications** - See your complete job search history
- **Status Tracking** - Track progress through: Applied → Interview Rounds 1-5+ → Offer/Rejected
- **Search & Filter** - Find applications by company, position, status, or priority
- **Priority Management** - Mark jobs as Dream Job, High, Medium, or Low priority
- **Notes** - Add notes for each application
- **Analytics Dashboard** - View statistics and trends in your job search
- **Real-time Updates** - Instant synchronization across devices

### Backend API
- **CRUD Operations** - Full create, read, update, delete functionality
- **User ID-based Access** - Simple, lightweight authentication
- **Data Validation** - Ensures data integrity across all operations
- **Statistics Endpoint** - Comprehensive analytics data
- **Error Handling** - Clear, helpful error responses
- **CORS Support** - Enables seamless cross-origin requests

## 🛠 Tech Stack

- **Frontend**: React
- **Chrome Extension**: Vanilla JavaScript
- **Backend**: Node.js with Express
- **Database**: MongoDB (free tier)
- **Deployment**: Railway (Backend) + Vercel (Frontend)

---

# USER GUIDE

For non-technical users who want to track their job applications.

## Getting Started (Easy Setup)

### Step 1: Install Extension
1. Click **[Get Job Tracker on Chrome Web Store](https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf)**
2. Click "Add to Chrome"
3. Confirm the permissions
4. The Job Tracker icon will appear in your toolbar

![Chrome extension icon in toolbar](images/01-extension-toolbar.png | width=400)

### Step 2: Get Your User ID
1. Send an email to **vincent0109ccc@gmail.com**
2. Subject: "Job Tracker Access Request"
3. Message: "I want to use Job Tracker. My preferred User ID is: [your_choice]"
4. Example: `john_jobs`, `job_tracker_2025`, etc.
5. Receive your User ID confirmation via email

### Step 3: Set Up the Extension
1. Click the Job Tracker icon in your toolbar
2. Paste your User ID in the input field
3. Click "Set User ID"
4. You're ready to start!

![Extension popup with User ID input field](images/02-extension-settings.png | width=400)

## How to Use

### Saving a Job Application

1. Go to any LinkedIn job listing
2. Search for any jobs you want to apply
2. Click the Job Tracker extension icon
4. Click "Mark as Applied"
5. See confirmation notification

![LinkedIn job page with extension popup showing auto-filled data](images/03-linkedin-job-page.png | width=400)

### View Your Applications

1. Visit **[Job Tracker Dashboard](https://job-tracker-gamma-three.vercel.app)**
2. Enter your User ID
3. Click "Access Dashboard"
4. See all your saved applications

![Dashboard showing saved applications](images/05-dashboard-table.png | width=400)

### Manage Your Applications

1. Click on any job application
2. Update the status (Applied, Interview Round 1-5, Offer, Rejected, etc.)
3. Add notes about the company or interview
4. Set priority (Star, Normal)
5. Click "Save" when done

![Application detail modal/edit page](images/06-dashboard-edit-modal.png | width=400)

### Track Your Progress

After saving a job in the extension:
1. Go to the dashboard
2. Refresh using the "Refresh" bottom
3. Your new application appears instantly

![Dashboard after refresh showing new application](images/07-dashboard-new-app-saved.png | width=400)

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
CORS_ORIGIN=chrome-extension://your_extension_id
REACT_APP_API_URL=https://job-tracker-api.railway.app
```

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

1. User clicks extension icon on LinkedIn
2. Content script extracts visible job data using DOM parsing
3. Data sent to backend API with user ID
4. Backend validates and stores in MongoDB
5. User visits dashboard and enters user ID
6. Dashboard fetches their data in real-time
7. User updates status, notes, priority
8. Changes sync instantly

## Performance

- **Extension extraction**: <500ms
- **API response time**: <100ms
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