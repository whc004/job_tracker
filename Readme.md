# Job Tracker

A comprehensive full-stack job application tracking system that combines a Chrome Extension, REST API, and React Dashboard to help you organize and manage your job search efficiently.

## Overview

Job Tracker eliminates the pain of manually tracking job applications across multiple platforms. With one click, save job details from LinkedIn directly to your personal dashboard, complete with auto-extracted company info, salary ranges, technical requirements, and more.

> **Why the User ID system?** We use a lightweight user ID approach instead of complex authentication to keep our MongoDB storage minimal and free-tier friendly. This keeps the service sustainable without database bloat.

## ✨ Features

### Chrome Extension
- **One-Click Save** - Extract job details from LinkedIn with a single click
- **Auto-Fill Data** - Automatically captures:
  - Company name
  - Position/Job title
  - Location
  - Salary range
  - Job type (Full-time, Part-time, Contract, etc.)
  - Experience level
  - Work arrangement (Remote/Hybrid/On-site)
  - Technical keywords
  - Job URL
- **Smart Keyword Detection** - Identifies 100+ technical skills and tools from job descriptions
- **Real-time Notifications** - Instant feedback on save success/failure
- **Lightweight & Fast** - Minimal data extraction for quick saves

### Dashboard
- **View All Applications** - See your complete job search history at a glance
- **Status Tracking** - Update application status through the pipeline:
  - Applied
  - Interview - Round 1
  - Interview - Round 2
  - Interview - Round 3
  - Interview - Round 4
  - Interview - Round 5+
  - Offer
  - Rejected
  - No Response
- **Search & Filter** - Find applications by company, position, or status
- **Priority Management** - Mark jobs as Low/Medium/High or Dream Job
- **Notes & Follow-ups** - Add notes and set follow-up dates for each application
- **Analytics Dashboard** - View statistics and trends in your job search
- **Responsive Design** - Seamless experience on desktop and mobile devices
- **Real-time Updates** - Click save and refresh to see new applications instantly

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

## 🚀 Getting Started

### Prerequisites
- Chrome Browser (v90+)
- Node.js v14+ (for local development only)

### Installation

#### Step 1: Download & Install Extension
1. Clone this repository:
   ```bash
   git clone https://github.com/whc004/job_tracker.git
   ```
2. Go to `chrome://extensions/` in your Chrome browser
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` folder from the cloned repository
6. The Job Tracker icon will appear in your Chrome toolbar

![Chrome extension icon in toolbar](images/01-extension-toolbar.png)

#### Step 2: Get Your User ID
1. Send an email to **vincent0109ccc@gmail.com**
2. Request access to Job Tracker and specify the **User ID** you want (e.g., `job_user_123`, `your_name_jobs`, etc.)
3. Receive confirmation with your approved User ID
4. In the extension popup, paste your User ID in the settings

![Extension popup with User ID input field](images/02-extension-settings.png)

#### Step 3: Start Tracking
1. Visit any LinkedIn job listing
2. Click the Job Tracker extension icon
3. Review auto-filled details
4. Click "Save"
5. Visit the [dashboard](https://job-tracker-dashboard.vercel.app) to see your saved application

**[SCREENSHOT: "LinkedIn job page with extension popup showing auto-filled data"]**
**[SCREENSHOT: "Dashboard showing saved applications"]**

## 📖 Usage Guide

### Saving a Job Application

1. Open a LinkedIn job listing
2. Click the Job Tracker extension icon in your toolbar
3. Extension automatically extracts:
   - Company name
   - Position title
   - Location
   - Salary range
   - Technical skills required
   - And more...
4. Review the details
5. Click "Save" - Done!

![Extension popup with all extracted fields](images/04-extension-popup-fields.png)

### Managing Your Applications on Dashboard

1. Visit [Job Tracker Dashboard](https://job-tracker-dashboard.vercel.app)
2. Enter your User ID
3. View all your saved job applications in a clean table/grid format
4. Click on any application to:
   - **Update Status** - Track where you are in the interview pipeline
   - **Add Notes** - Keep track of key points (interview time, contact person, etc.)
   - **Set Priority** - Mark as Dream Job, High, Medium, or Low priority
   - **Set Follow-up Date** - Reminder for when to follow up
5. Use filters to find applications by:
   - Status
   - Company
   - Position
   - Priority

**[SCREENSHOT: "Dashboard table with multiple applications"]**
**[SCREENSHOT: "Application detail modal/edit page"]**

### Real-time Updates

After saving an application in the extension:
1. Go to the dashboard
2. Refresh the page (F5 or Cmd+R)
3. Your new application appears instantly

![Dashboard after refresh showing new application](images/07-dashboard-new-app-saved.png)

## 🌍 Live Demo

- **Dashboard**: https://job-tracker-gamma-three.vercel.app
- **API Server**: https://job-tracker-api.railway.app

## 🔧 Environment Variables

The backend uses environment variables for configuration. Create a `.env` file in the backend directory:

```
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=your_mongodb_connection_string

# CORS Configuration
CORS_ORIGIN=chrome-extension://your_extension_id

# API Base URL (for frontend)
REACT_APP_API_URL=https://job-tracker-api.railway.app
```

### Getting MongoDB Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect"
4. Copy the connection string
5. Paste into `.env` as `MONGODB_URI`

## 🚀 Deployment

### Backend (Node.js + Express)
We use **Railway** for automatic deployment:

1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "Create New Project"
4. Select "Deploy from GitHub repo"
5. Authorize and select your `job_tracker` repository
6. Railway automatically detects Node.js project
7. Add environment variables (MongoDB URI, PORT, NODE_ENV)
8. Railway automatically deploys on every push to main branch
9. Get your API URL from Railway dashboard

**Dashboard URL Pattern**: `https://job-tracker-api-production.up.railway.app`

### Frontend (React)
We use **Vercel** for automatic deployment:

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Select the `frontend` folder as root directory
6. Add environment variable:
   - `REACT_APP_API_URL` = your Railway backend URL
7. Click "Deploy"
8. Vercel automatically deploys on every push to main branch

**Dashboard URL Pattern**: `https://job-tracker-dashboard.vercel.app`

### Extension Deployment
The extension loads locally from your file system in Developer Mode. For distribution:
- Package the `extension` folder as a ZIP
- Submit to [Chrome Web Store](https://chrome.google.com/webstore) (requires $5 one-time fee)

## 🛠 Troubleshooting

### Extension Issues

**"Extension not loading"**
- Ensure you loaded the correct folder (`extension` not `backend` or `frontend`)
- Check that `manifest.json` exists in the extension folder
- Try reloading the extension (click refresh icon on extension card in `chrome://extensions/`)

**"Can't see the extension icon"**
- Go to `chrome://extensions/` → Pin the Job Tracker icon
- Or click the puzzle icon in toolbar and pin it

**"Auto-fill not working on LinkedIn"**
- Ensure you're on a LinkedIn job listing page (not search results)
- Try refreshing the LinkedIn page (F5)
- Verify the extension is enabled in `chrome://extensions/`

### User ID Issues

**"User ID rejected/not found"**
- Verify you received confirmation email from vincent0109ccc@gmail.com
- Check for typos in the User ID you entered
- Request access again if needed

**"Cannot save applications"**
- Verify your User ID is correctly entered in extension settings
- Check your internet connection
- Ensure the backend server is online

### Dashboard Issues

**"Dashboard shows no applications"**
- Verify you entered the correct User ID
- Try refreshing the page (F5)
- Check browser console (F12) for error messages
- Ensure you've actually saved applications (they appear instantly after clicking Save)

### API/Connection Issues

**"CORS errors in browser console"**
- This typically means the backend URL is incorrect
- Verify `REACT_APP_API_URL` in your frontend `.env`
- Check that the Railway backend is deployed and running

**"Cannot connect to API"**
- Check Railway dashboard to ensure backend is deployed
- Verify MongoDB connection string is valid
- Check backend logs on Railway for errors

## 📊 Performance

Job Tracker is built for speed:
- **Extension**: Extracts data in <500ms
- **Save**: Stores to database in ~1 second
- **Dashboard**: Click save and refresh to see new applications instantly
- **Database**: Optimized MongoDB queries keep response times under 100ms

## 📁 Project Structure

```
job_tracker/
├── client/                    # React Dashboard (Frontend)
│   ├── public/
│   │   ├── index.html
│   │   ├── jobtracker.ico
│   │   └── logo*.png
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── logo.svg
│   │   └── shared-constants.js
│   ├── package.json
│   └── .env
│
├── extension/                 # Chrome Extension
│   ├── icons/
│   │   └── job-tracker-icon.png
│   ├── manifest.json         # Extension configuration
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic
│   ├── content.js            # LinkedIn data extraction
│   ├── styles.css            # Extension styles
│   ├── shared-constants.js
│   └── images/
│
├── server/                    # Express API Backend
│   ├── src/
│   │   └── index.js          # Main server file
│   ├── package.json
│   ├── .env
│   ├── nixpacks.toml         # Railway deployment config
│   └── shared-constants.js
│
├── shared-constants.js        # Root-level shared constants
├── .gitignore
├── LICENSE
├── README.md
├── images/                    # README screenshots
│   ├── 01-extension-toolbar.png
│   ├── 02-extension-settings.png
│   ├── 03-linkedin-job-page.png
│   ├── 04-extension-popup-fields.png
│   ├── 05-dashboard-table.png
│   ├── 06-dashboard-edit-modal.png
│   └── 07-dashboard-new-app-saved.png
└── ...
```

**Note**: Each part (client, server, extension) has its own `package.json` and can be developed/deployed independently.

## 📝 How It Works Under the Hood

1. **You click extension icon on LinkedIn job page**
2. **Content script** extracts job data from the page HTML
3. **Popup displays** the auto-filled information
4. **You click Save**
5. **Extension sends** data to backend API with your User ID
6. **Backend validates** and stores in MongoDB
7. **Dashboard fetches** your data when you visit (using your User ID)
8. **You see** all your applications in real-time

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 💬 Support

Have questions or issues?

- **Email**: vincent0109ccc@gmail.com
- **GitHub Issues**: [Open an issue](https://github.com/whc004/job_tracker/issues)

## 🎯 Roadmap

- [ ] Support for more job boards (Indeed, Glassdoor, etc.)
- [ ] Email reminders for follow-ups
- [ ] Salary data analytics
- [ ] Application templates for quick responses
- [ ] Interview prep integration

---

**Happy job hunting! 🚀** 

Built with ❤️ to make your job search easier.