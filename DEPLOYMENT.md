# 🚀 Render Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables to Set in Render Dashboard:**
- `SECRET_KEY` - A strong secret key for Flask sessions (generate a new one for production)
- `user` - Database username (from Supabase)
- `password` - Database password (from Supabase)
- `host` - Database host (from Supabase)
- `port` - Database port (usually 5432 for PostgreSQL)
- `dbname` - Database name (from Supabase)
- `RENDER` - Set to "true" (this tells the app it's running on Render)

### 2. **Files Ready for Deployment:**
- ✅ `Procfile` - Created with `web: gunicorn app:app`
- ✅ `requirements.txt` - Updated with all dependencies including Flask-WTF
- ✅ `app.py` - Modified for production deployment

### 3. **Production Settings Applied:**
- ✅ Host changed to `0.0.0.0` for Render
- ✅ Port reads from `PORT` environment variable
- ✅ Debug mode disabled in production
- ✅ CSRF protection enabled
- ✅ Database connection with retry mechanism

## 🔧 Render Deployment Steps

### 1. **Create New Web Service:**
- Go to Render Dashboard
- Click "New" → "Web Service"
- Connect your GitHub repository

### 2. **Configure Build Settings:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app` (or leave empty, Procfile will handle it)
- **Environment:** Python 3

### 3. **Set Environment Variables:**
Go to Environment tab and add all the variables listed above.

### 4. **Database Setup:**
Make sure your Supabase database is accessible from external connections and the connection details are correct.

## 🔒 Security Notes

- ✅ CSRF protection is enabled
- ✅ Secret key is loaded from environment variables
- ✅ Debug mode disabled in production
- ✅ Database connections use SSL (Supabase default)

## 🎯 Post-Deployment

1. **Test all functionality:**
   - User registration and login
   - Admin user management
   - Zone management
   - Report submission
   - CSRF protection

2. **Monitor logs:**
   - Check Render logs for any startup issues
   - Monitor database connection status

## 🚨 Troubleshooting

**If deployment fails:**
1. Check Render build logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure Supabase allows connections from Render IPs
4. Check if database migrations need to be run

**Common Issues:**
- **Database connection errors:** Verify Supabase connection details
- **CSRF errors:** Ensure SECRET_KEY is set
- **Import errors:** Check requirements.txt for missing packages
