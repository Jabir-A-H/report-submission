# 🤝 Contributing to Report Submission System

We welcome contributions to improve the Report Submission System! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Git
- PostgreSQL database (Supabase recommended)

### Fork and Clone
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/report-submission.git
   cd report-submission
   ```
3. Set up upstream remote:
   ```bash
   git remote add upstream https://github.com/Jabir-A-H/report-submission.git
   ```

## 🔧 Development Setup

### Environment Setup
1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # venv\Scripts\activate   # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize database:**
   ```bash
   python init_db.py
   ```

5. **Build assets:**
   ```bash
   npm run build-css-prod
   ```

6. **Generate secret key:**
   ```bash
   python generate_secret_key.py
   ```

### Development Workflow
```bash
# Start development server
python app.py

# In another terminal, watch CSS changes
npm run build-css
```

## 📝 Coding Standards

### Python Code
- Follow [PEP 8](https://pep8.org/) style guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Use type hints where appropriate
- Maximum line length: 88 characters (Black formatter default)

### JavaScript/CSS
- Use consistent indentation (2 spaces)
- Follow standard naming conventions
- Comment complex logic
- Ensure cross-browser compatibility

### Bengali Text Handling
- Always use Unicode encoding (UTF-8)
- Test Bengali text display across different browsers
- Ensure proper font loading (Tiro Bangla)
- Validate database collation supports Bengali characters

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove)
- Keep first line under 50 characters
- Add detailed description for complex changes

**Examples:**
```
Add user authentication system
Fix Bengali text encoding in reports
Update API documentation
Remove deprecated CSS classes
```

## 🔄 Submitting Changes

### Creating a Pull Request
1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly

4. **Update documentation** if needed

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Pull Request Guidelines
- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Request review from maintainers

## 🧪 Testing

### Running Tests
```bash
# Run the application and manually test features
python app.py

# Test specific functionality:
# - User registration and login
# - Report submission and editing
# - Admin functions (user/zone management)
# - PDF and Excel export
# - Bengali text rendering
```

### Testing Checklist
- [ ] User registration works
- [ ] Login/logout functions properly
- [ ] Admin can manage users and zones
- [ ] Report submission and editing works
- [ ] PDF/Excel export functions
- [ ] Bengali text displays correctly
- [ ] Responsive design works on mobile
- [ ] CSRF protection is active
- [ ] No console errors in browser

## 📚 Documentation

### Updating Documentation
- Keep README.md current with new features
- Update API.md for new endpoints
- Add troubleshooting info to TROUBLESHOOTING.md
- Update DEPLOYMENT.md for deployment changes

### Documentation Standards
- Use clear, concise language
- Include code examples where helpful
- Keep screenshots updated
- Test all instructions on a fresh setup

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, browser, Python version)
- **Error messages** and stack traces
- **Screenshots** for UI issues

### Feature Requests
For new features, please include:
- **Use case** and problem it solves
- **Proposed solution** with implementation details
- **Alternatives considered**
- **Mockups or examples** if applicable

## 📋 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn and contribute
- Maintain professional communication

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or insults
- Trolling or disruptive comments
- Sharing private information

## 🎯 Areas for Contribution

### High Priority
- **Security improvements** - Code review and security audits
- **Performance optimization** - Database queries and page load times
- **Accessibility** - WCAG compliance and screen reader support
- **Internationalization** - Additional language support

### Medium Priority
- **UI/UX enhancements** - Better user experience and design
- **Testing** - Unit tests and integration tests
- **Documentation** - More comprehensive guides
- **API improvements** - REST API enhancements

### Good for Beginners
- **Bug fixes** - Small, isolated issues
- **Documentation updates** - Typos, clarifications
- **Code cleanup** - Removing unused code, improving formatting
- **UI improvements** - Small styling enhancements

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Documentation** - Check existing docs first

## 🙏 Recognition

Contributors will be recognized in:
- GitHub repository contributors list
- CHANGELOG.md for significant contributions
- Acknowledgments section in README.md

Thank you for contributing to the Report Submission System! 🚀