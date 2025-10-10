# Deploying the Job Tracker Frontend and API

This guide walks through hosting the React UI as a static site (Netlify, Vercel, S3, etc.) while the Express API keeps running as its own service. No changes to `server/src/index.js` are required—the API remains exactly as in the repository.

## 1. Install dependencies

```bash
# Inside the repository root
cd client
npm install

cd ../server
npm install
```

## 2. Configure environment variables

Create a `server/.env` file (or configure variables in your hosting platform) with at least:

```bash
PORT=5000                       # or any open port
MONGODB_URI=mongodb+srv://...   # Mongo connection string
```

Add any other variables referenced in `server/src/index.js` (for example, the valid user ID allow list).

## 3. Build the React frontend

```bash
cd ../client
npm run build
```

This generates a `client/build` directory with production-ready static assets.

## 4. Deploy the React build

Upload the contents of `client/build` to a static hosting provider of your choice. Common options include:

- **Netlify / Vercel** – drag-and-drop the folder or push a Git repo connected to the provider.
- **Amazon S3 + CloudFront** – create a bucket, enable static website hosting, and point a CDN distribution at it.
- **GitHub Pages** – commit the build output to a branch such as `gh-pages` and enable Pages.

Whichever platform you choose, configure it so that requests to unknown paths (for example, `/analytics`) fall back to `index.html`. This ensures React Router can handle in-app navigation.

## 5. Host the Express API separately

Keep the API as an independent service (Railway, Render, Fly.io, your own VPS, etc.). Start it with the usual command:

```bash
cd ../server
npm start
```

Expose the server over HTTPS if you plan to call it from a public frontend. Consider a process manager such as PM2 or your host's built-in runtime to keep it running.

## 6. Point the frontend at the API

Inside the React app, ensure your API calls target the deployed Express URL (for example, set `REACT_APP_API_BASE_URL` before building or configure your fetch helpers). The frontend and backend communicate over standard HTTP(S), so the API does not need to serve the static assets itself.
