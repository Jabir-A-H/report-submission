# 📊 রিপোর্ট সাবমিশন সিস্টেম (Report Submission System)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.1.1+-lightgrey.svg)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0+-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791.svg)](https://postgresql.org/)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7.svg)](https://render.com/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Jabir-A-H/report-submission)

A comprehensive Bengali report submission and management system. This application enables organizations to collect, manage, and analyze reports from different zones with user authentication, role-based access control, and comprehensive reporting features.

## 🌐 Live Application

<div align="center">
  <a href="https://report-submission.onrender.com">
    <img src="https://img.shields.io/badge/🌐_Visit_Live_Site-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Live Site"/>
  </a>
</div>

## 📚 Table of Contents

- [🌐 Live Application](#-live-application)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [� GitHub Stats](#-github-stats)
- [�🚀 Quick Start](#-quick-start)
- [📖 Usage Guide](#-usage-guide)
- [🔧 Development](#-development)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 API Reference](#-api-reference)
- [🔍 Troubleshooting](#-troubleshooting)
- [🌟 Connect With Me](#-connect-with-me)
- [📜 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ Features

### 🔐 Authentication & User Management
- **Secure User Authentication** - Login/logout with session management
- **User Registration** - Self-service user registration with admin approval
- **Role-Based Access Control** - Admin and regular user roles
- **Profile Management** - User profile editing and management

### 📋 Report Management
- **Multi-Category Reports** - Support for various report types:
  - 📚 **Courses** (কোর্স) - Educational activities and training
  - 🏢 **Organizational** (দাওয়াত ও সংগঠন) - Organizational development
  - 👤 **Personal** (ব্যক্তিগত) - Individual activities and development
  - 🤝 **Meetings** (বৈঠক) - Meeting reports and attendance
  - ➕ **Extras** (অতিরিক্ত) - Additional activities and metrics
- **Monthly Reporting** - Organized by month and year
- **Zone-Based Organization** - Reports categorized by geographical zones
- **Comments System** - Add contextual comments to reports

### 🎯 Administrative Features
- **Zone Management** - Create, edit, and manage geographical zones
- **User Administration** - Manage user accounts and permissions
- **City Reports** - Aggregate city-level reporting and overrides
- **Data Export** - Export reports in various formats
- **Report Analytics** - Comprehensive data analysis and visualization

### 🌐 User Interface
- **Bengali/Bangla Interface** - Native language support with proper typography
- **Responsive Design** - Mobile-first design using Tailwind CSS
- **Modern UI/UX** - Clean, intuitive interface with gradient backgrounds
- **Accessibility** - WCAG compliant design elements
- **Real-time Feedback** - Toast notifications and form validation

### 🔒 Security Features
- **CSRF Protection** - Built-in CSRF token validation
- **Password Hashing** - Secure password storage using Werkzeug
- **Session Management** - Secure session handling
- **Environment Variables** - Sensitive data protection
- **SQL Injection Prevention** - SQLAlchemy ORM protection

## 📊 Project Statistics

- **📁 Total Files**: 30+ source files
- **🛣️ API Endpoints**: 24+ routes
- **🗄️ Database Tables**: 9 main entities
- **🎨 UI Templates**: 15+ Jinja2 templates
- **🌐 Languages**: Bengali (Primary), English (Secondary)
- **📱 Responsive**: Mobile-first design
- **🚀 Deployment Ready**: Render optimized

## 🛠️ Technology Stack

### Backend
- **Flask 3.1.1+** - Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Primary database (Supabase)
- **Flask-Login** - User session management
- **Flask-WTF** - Form handling and CSRF protection
- **Flask-Migrate** - Database migration management
- **Gunicorn** - WSGI HTTP Server for production

### Frontend
- **Jinja2** - Template engine
- **Tailwind CSS 3.4.0+** - Utility-first CSS framework
- **Tiro Bangla Font** - Bengali typography
- **Vanilla JavaScript** - Interactive UI components

### Development & Deployment
- **Render** - Cloud deployment platform
- **Node.js** - Build tools for CSS compilation
- **Playwright** - Browser automation for testing
- **Python-dotenv** - Environment variable management

## � GitHub Stats

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Jabir-A-H&repo=report-submission&show_icons=true&theme=radical" alt="GitHub Stats"/>
  <br>
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Jabir-A-H&repo=report-submission&layout=compact&theme=radical" alt="Top Languages"/>
</div>

## �🚀 Quick Start

### Prerequisites
- Python 3.8 or higher (tested with Python 3.12)
- Node.js 16 or higher
- PostgreSQL database (or Supabase account)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jabir-A-H/report-submission.git
   cd report-submission
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm ci
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   user=your_db_username
   password=your_db_password
   host=your_db_host
   port=5432
   dbname=your_db_name
   SECRET_KEY=your_secret_key_here
   ```

5. **Generate Secret Key**
   ```bash
   python generate_secret_key.py
   ```

6. **Initialize Database**
   ```bash
   python init_db.py
   ```

7. **Build CSS Assets**
   ```bash
   npm run build-css-prod
   ```

8. **Run the Application**
   ```bash
   python app.py
   ```

The application will be available at `http://localhost:5000`

### 🔧 Environment Variables

The application requires the following environment variables:

| Variable     | Description                   | Example                               |
| ------------ | ----------------------------- | ------------------------------------- |
| `SECRET_KEY` | Flask secret key for sessions | `T-3Cfg718\X}Q,ztG.h(D;_-t>[5VoD/`    |
| `user`       | Database username             | `postgres.abcdefgh`                   |
| `password`   | Database password             | `your_secure_password`                |
| `host`       | Database host                 | `aws-1-us-east-2.pooler.supabase.com` |
| `port`       | Database port                 | `5432`                                |
| `dbname`     | Database name                 | `postgres`                            |
| `RENDER`     | Production flag               | `true` (only for production)          |

> 💡 **Tip**: Use `python generate_secret_key.py` to generate a secure SECRET_KEY

## 📖 Usage Guide

### First Time Setup

1. **Access the Application** - Navigate to the application URL
2. **Register an Account** - Use the registration form to create your account
3. **Admin Approval** - Wait for admin approval to activate your account
4. **Login** - Use your credentials to access the system

### Creating Reports

1. **Navigate to Reports** - Click on "রিপোর্ট" in the navigation
2. **Select Report Type** - Choose from available report categories
3. **Fill Report Data** - Enter data for each category
4. **Submit Report** - Save your report for the selected month/year

### Administrative Tasks

1. **User Management** - Access via "ব্যবহারকারী" for user administration
2. **Zone Management** - Access via "এলাকা" to manage geographical zones
3. **City Reports** - Access aggregate reporting features

## 🔧 Development

### Development Environment Setup

1. **Install development dependencies**
   ```bash
   pip install -r requirements.txt
   npm install
   ```

2. **Run development server with CSS watching**
   ```bash
   # Terminal 1: CSS compilation with watch mode
   npm run build-css
   
   # Terminal 2: Flask development server
   export FLASK_ENV=development
   python app.py
   ```

### Database Management

- **Create Migration**: `flask db migrate -m "description"`
- **Apply Migration**: `flask db upgrade`
- **Database Reset**: `python init_db.py`

### Testing

The application includes built-in functionality testing. For manual testing:

- Start the application: `python app.py`
- Test login with admin credentials
- Test report submission and export features
- Test administrative functions (user/zone management)

### Code Structure

```
report-submission/
├── app.py                 # Main Flask application
├── templates/             # Jinja2 templates
│   ├── base.html         # Base template
│   ├── report/           # Report-related templates
│   └── ...
├── static/               # Static assets
│   ├── tailwind.css     # Compiled CSS
│   ├── scripts.js       # JavaScript
│   └── styles.css       # Custom styles
├── requirements.txt      # Python dependencies
├── package.json         # Node.js dependencies
├── DEPLOYMENT.md        # Deployment instructions
└── README.md           # This file
```

## 🚀 Deployment

### Render Deployment

This application is optimized for deployment on Render. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

#### Quick Deployment Steps:

1. **Fork this repository** to your GitHub account
2. **Create a new Web Service** on Render
3. **Connect your repository** to Render
4. **Set environment variables** as described in DEPLOYMENT.md
5. **Deploy** - Render will automatically build and deploy

#### Required Environment Variables:
- `SECRET_KEY` - Flask secret key
- `user` - Database username
- `password` - Database password
- `host` - Database host
- `port` - Database port
- `dbname` - Database name
- `RENDER` - Set to "true" for production

### Local Production Build

```bash
# Build production assets
npm run build-css-prod

# Run with Gunicorn
gunicorn --config gunicorn.conf.py app:app
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines, development setup, and coding standards.

## 📄 API Reference

Complete API documentation is available in [API.md](API.md), including all endpoints, methods, and descriptions.

## 🔍 Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 🌟 Connect With Me

<div align="center">
  <a href="https://github.com/Jabir-A-H">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="https://linkedin.com/in/jabir-abdullah-haian">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</div>

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Flask Community** - For the excellent web framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Supabase** - For reliable PostgreSQL hosting
- **Render** - For seamless deployment platform
- **Google Fonts** - For Tiro Bangla typography
- **Contributors** - All developers who have contributed to this project

## 📞 Support

For support and questions:
- 📧 Create an issue on GitHub
- 📖 Check the documentation in this README
- 🚀 Review deployment guide in [DEPLOYMENT.md](DEPLOYMENT.md)
- 🔧 See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- 📄 Check [API.md](API.md) for endpoint documentation
- 🤝 Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines

---

© 2025 রিপোর্ট সাবমিশন সিস্টেম | v1.0