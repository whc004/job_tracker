# Job Tracker

A comprehensive full-stack job application tracking system that combines a Chrome Extension, REST API, and React Dashboard to help you organize and manage your job search efficiently.

## Overview

Job Tracker eliminates the pain of manually tracking job applications across multiple platforms. With one click, save job details from LinkedIn directly to your personal dashboard, complete with auto-extracted company info, salary ranges, technical requirements, and more.

> **Why the User ID system?** We use a lightweight user ID approach instead of complex authentication to keep our MongoDB storage minimal and free-tier friendly. This keeps the service sustainable without database bloat.

---

## 🚀 Install Now

**[Get Job Tracker on Chrome Web Store](https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf)**

Or follow the steps below to set up locally for development.

---

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

## 🚀 Getting Started (Local Development)

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
5. Visit the [dashboard](https://job-tracker-gamma-three.vercel.app) to see your saved application

![LinkedIn job page with extension popup showing auto-filled data](images/03-linkedin-job-page.png)
![Dashboard showing saved applications](images/05-dashboard-table.png)

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

1. Visit [Job Tracker Dashboard](https://job-tracker-gamma-three.vercel.app)
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

![Dashboard table with multiple applications](images/05-dashboard-table.png)
![Application detail modal/edit page](images/06-dashboard-edit-modal.png)

### Real-time Updates

After saving an application in the extension:
1. Go to the dashboard
2. Refresh the page (F5 or Cmd+R)
3. Your new application appears instantly

![Dashboard after refresh showing new application](images/07-dashboard-new-app-saved.png)

## 🌍 Live Demo & Links

- **Chrome Web Store**: https://chromewebstore.google.com/detail/oelhgkiopbnchopjgpilhdnpnkbponkf
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
7. Ad