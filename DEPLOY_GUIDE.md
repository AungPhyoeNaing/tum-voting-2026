# 🚀 Deployment Guide (Fixing 404 API Errors)

If your website loads but you cannot Login or Vote (API 404 Errors), it is because **Nginx is serving the files directly** instead of passing requests to your Node.js server.

You need to set up a **Reverse Proxy**.

## 1. Ensure Node.js Server is Running
First, make sure your backend is actually running on port 3005.

```bash
# Run in your terminal
pm2 start server.js --name "vote-app"
pm2 save
```

## 2. Configure Reverse Proxy (aaPanel / cPanel)
This is the most critical step.

### For aaPanel Users (Most Likely):
1. Go to **Website** and click the **Settings** (Config) button for your domain.
2. Find the **Reverse Proxy** tab in the sidebar.
3. Click **Add Reverse Proxy**.
   - **Name:** `CoreApp` (or anything you want)
   - **Target URL:** `http://127.0.0.1:3005`
   - **Sent Domain:** `$host` (default)
4. Click **Submit**.

**✅ That's it!**
Now Nginx will send all traffic to your Node.js app. The Node.js app will serve both the Frontend (HTML/CSS) and the Backend (API).

---

## 3. Alternative: Manual Nginx Config
If you don't have a panel, edit your Nginx config file:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
