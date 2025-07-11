# How to Deploy Your Next.js Application

This guide provides instructions for deploying your LocalBloom application. The easiest and recommended method for a Next.js app is using Vercel, but we also provide guidance for traditional hosting like Hostinger.

---

## Option 1: Recommended - Deploying to Vercel (Easiest)

Vercel is the company behind Next.js, and their platform is perfectly optimized for deploying Next.js apps. It's the simplest and fastest way to get your app online.

1.  **Push Your Code to a Git Repository**:
    *   If you haven't already, push your project code to a GitHub, GitLab, or Bitbucket account.

2.  **Sign Up for Vercel**:
    *   Go to [vercel.com](https://vercel.com/) and sign up for a free account. You can use your GitHub account to sign up for a seamless experience.

3.  **Import Your Project**:
    *   From your Vercel dashboard, click "Add New... > Project".
    *   Select the Git repository where you pushed your code. Vercel will automatically detect that it's a Next.js project.

4.  **Configure Environment Variables**:
    *   Before deploying, you'll need to add your Supabase credentials. In the project settings on Vercel, go to "Settings > Environment Variables".
    *   Add the following variables with the same values from your local `.env` file (or your Supabase project dashboard):
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5.  **Deploy**:
    *   Click the "Deploy" button.
    *   Vercel will handle everything: it will install dependencies, build your project (`next build`), and deploy it to a live URL.

That's it! Your site will be live. Future pushes to your main branch will automatically trigger new deployments.

---

## Option 2: Deploying to Hostinger (or other Node.js hosts)

Deploying to a provider like Hostinger is more manual and requires a hosting plan that supports **Node.js** (like a VPS or some Cloud Hosting plans). Shared hosting plans often do not support Next.js apps easily.

### Step 1: Build Your Project Locally

First, you need to create a production-ready build of your application.

Open a terminal in your project directory and run:

```bash
npm run build
```

This command will create a `.next` folder in your project. This folder contains the optimized version of your app that will be deployed.

### Step 2: Prepare Files for Upload

You will need to upload the following files and folders to your Hostinger server:

1.  `.next` (the folder created by the build command)
2.  `public` (if you have any static assets)
3.  `package.json`
4.  `package-lock.json`
5.  `next.config.ts`

**You do not need to upload the `src` folder or other development files.**

### Step 3: Set Up on Hostinger

1.  **Upload Files**: Use Hostinger's File Manager or an FTP client (like FileZilla) to upload the prepared files and folders to your server.

2.  **Install Dependencies**:
    *   You'll need access to a terminal on your Hostinger server (often via SSH).
    *   Navigate to your project directory.
    *   Run the following command to install only the production dependencies:
        ```bash
        npm install --production
        ```

3.  **Set Environment Variables**:
    *   On Hostinger, you'll need to find where to set environment variables. This is usually in your hosting control panel, often under a section named "Node.js" or "Setup App".
    *   Set the same Supabase variables as mentioned in the Vercel guide.

4.  **Start the Server**:
    *   The command to run your app in production is:
        ```bash
        npm run start
        ```
    *   For a real deployment, you should use a process manager like `pm2` to ensure your app restarts if it crashes and runs in the background. If `pm2` is available, you would use:
        ```bash
        pm2 start npm --name "my-next-app" -- start
        ```

### Summary of Folder Structure on Server

After uploading and running `npm install`, your server's directory should look something like this:

```
/your-project-folder/
├── .next/
├── public/ (optional)
├── node_modules/
├── next.config.ts
├── package.json
└── package-lock.json
```

This setup is what's needed to run `npm run start` and serve your application.
