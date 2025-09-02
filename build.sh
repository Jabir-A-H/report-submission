#!/bin/bash

# Render Build Script for Report Submission System
# This script handles the complete build process for deployment

set -e  # Exit on any error

echo "[BUILD] Starting Report Submission System build process..."

# Step 1: Install Node.js dependencies
echo "[BUILD] Installing Node.js dependencies..."
npm ci

# Step 2: Build Tailwind CSS
echo "[BUILD] Building Tailwind CSS..."
npm run build-css-prod

# Step 3: Install Python dependencies
echo "[BUILD] Installing Python dependencies..."
pip install -r requirements.txt

# Step 4: Install Playwright browsers (skip system deps)
echo "[BUILD] Installing Playwright browsers..."
playwright install chromium || echo "[BUILD] Playwright install failed, continuing..."

echo "[BUILD] Build completed successfully!"
echo "[BUILD] Report Submission System is ready for deployment."
