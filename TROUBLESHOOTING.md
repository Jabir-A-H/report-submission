# 🔍 Troubleshooting Guide

## Common Issues

### Database Connection Error
```bash
# Check database credentials in .env file
# Start the application and test login functionality
python app.py
```

**Symptoms:**
- Application fails to start
- "Database connection error" messages
- Login attempts fail

**Solutions:**
1. Verify all environment variables are set correctly in `.env`
2. Check Supabase database is accessible
3. Ensure SSL connection is enabled (required for Supabase)
4. Test connection with: `python -c "from app import db; db.create_all()"`


### CSS Not Loading
```bash
# Install Node.js dependencies first
npm install

# Rebuild CSS assets
npm run build-css-prod

# For development with watch mode
npm run build-css
```

**Symptoms:**
- Styling appears broken or missing
- Tailwind classes not working
- Bengali fonts not loading

**Solutions:**
1. Ensure Node.js and npm are installed
2. Run `npm install` to install dependencies
3. Build CSS with `npm run build-css-prod`
4. Check that `static/tailwind.css` exists and is not empty


### Import/Module Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Symptoms:**
- "Module not found" errors
- Import errors on startup
- Missing package errors

**Solutions:**
1. Activate virtual environment
2. Reinstall requirements: `pip install -r requirements.txt`
3. Check Python version compatibility (3.8+ required)
4. Clear pip cache: `pip cache purge`


### Permission Denied Errors
**Symptoms:**
- Cannot execute scripts
- File access denied
- Build script fails

**Solutions:**
- Check file permissions: `chmod +x build.sh`
- Ensure virtual environment is activated
- Verify all dependencies are installed
- On Windows, run terminal as administrator if needed


### Bengali Text Display Issues
**Symptoms:**
- Bengali characters appear as question marks or boxes
- Font rendering problems
- Text encoding issues

**Solutions:**
- Ensure proper UTF-8 encoding in your editor
- Check if Tiro Bangla font is loading properly
- Verify browser language settings
- Clear browser cache and reload
- Check database collation supports UTF-8


### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :5000   # Windows

# Or use a different port
export PORT=8000 && python app.py
```

**Symptoms:**
- "Port 5000 already in use" error
- Application fails to start

**Solutions:**
1. Kill existing process on port 5000
2. Use different port: `export PORT=8000`
3. Check for zombie processes


### CSRF Token Errors
**Symptoms:**
- Form submissions fail with CSRF errors
- "CSRF token missing" messages

**Solutions:**
1. Ensure `SECRET_KEY` is set in environment
2. Check that forms include CSRF tokens
3. Clear browser cookies and cache
4. Verify Flask-WTF is properly configured


### Database Sequence Issues
**Symptoms:**
- "Duplicate key" errors during user registration
- User creation fails with unique constraint violations

**Solutions:**
1. Run the sequence fix script: `python fix_sequence_simple.py`
2. Or manually fix via SQL:
   ```sql
   SELECT setval('people_id_seq', (SELECT MAX(id) FROM people) + 1);
   ```


### PDF Generation Issues
**Symptoms:**
- PDF downloads fail
- Playwright errors during report export

**Solutions:**
1. Install Playwright browsers: `playwright install`
2. Ensure proper permissions for PDF generation
3. Check system has required dependencies for PDF rendering


### Environment Variable Issues
**Symptoms:**
- Application starts but features don't work
- Database connections fail silently

**Solutions:**
1. Verify `.env` file exists and is readable
2. Check variable names match exactly (case-sensitive)
3. Ensure no extra spaces or quotes
4. Use `python -c "import os; print(os.getenv('VARIABLE_NAME'))"` to test


## Getting Help

### Debug Mode
Enable debug mode for development:
```bash
export FLASK_ENV=development
python app.py
```

### Logging
Check application logs for detailed error information:
- Render logs (for production)
- Console output (for development)
- Database logs in Supabase dashboard

### Support Resources
- [GitHub Issues](https://github.com/Jabir-A-H/report-submission/issues) - Report bugs
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment-specific issues
- [README.md](../README.md) - General documentation

### Common Debug Commands
```bash
# Test database connection
python -c "from app import test_database_connection; test_database_connection()"

# Test Flask app startup
python -c "from app import app; print('App created successfully')"

# Check environment variables
python -c "import os; [print(f'{k}={v}') for k,v in os.environ.items() if k in ['SECRET_KEY', 'user', 'host', 'dbname']]"
```

---

*If you encounter an issue not covered here, please create a detailed issue on GitHub with steps to reproduce, error messages, and your environment details.*