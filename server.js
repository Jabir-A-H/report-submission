const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/team-reports', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'leader', 'superior'], required: true }
});
const User = mongoose.model('User', userSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String,
  value: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', reportSchema);

// Middleware to verify JWT
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
  res.json({ token });
});

// Get Current User
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ email: req.user.email, role: req.user.role });
});

// Submit Report
app.post('/api/reports', authMiddleware, async (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ message: 'Only members can submit reports' });
  const report = new Report({ ...req.body, userId: req.user._id });
  await report.save();
  res.json({ message: 'Report submitted' });
});

// Get All Reports (for leader/superior)
app.get('/api/reports', authMiddleware, async (req, res) => {
  if (!['leader', 'superior'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const reports = await Report.find().populate('userId', 'email');
  res.json(reports);
});

// Generate Master Report
app.get('/api/reports/master', authMiddleware, async (req, res) => {
  if (!['leader', 'superior'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const reports = await Report.find();
  const summary = reports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + report.value;
    return acc;
  }, {});

  const format = req.query.format || 'pdf';
  if (format === 'pdf') {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=master-report.pdf');
    doc.pipe(res);
    doc.fontSize(16).text('Master Report', { align: 'center' });
    doc.moveDown();
    Object.entries(summary).forEach(([category, total]) => {
      doc.fontSize(12).text(`Category: ${category}, Total: ${total}`);
    });
    doc.end();
  } else if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Master Report');
    worksheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Total Value', key: 'total', width: 15 }
    ];
    Object.entries(summary).forEach(([category, total]) => {
      worksheet.addRow({ category, total });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=master-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } else if (format === 'jpg') {
    // JPG generation would require rendering the PDF to an image, which is complex and requires additional libraries like `pdf2pic`.
    res.status(501).json({ message: 'JPG format not implemented' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));