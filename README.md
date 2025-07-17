# Report-Submission

**Report-Submission** is a web application designed to automate the collection, aggregation, and presentation of team reports, replacing manual Google Sheets workflows. Users log in to submit structured, Excel-like forms, which are securely stored in a database. Authorized users can generate a summarized master report based on custom conditions (e.g., summing values by category) and export it as PDF, Excel, or JPG. Role-based authentication ensures only designated users access the final report, improving efficiency and data accuracy.

## Features
- **User Authentication**: Secure login with JWT, supporting roles (submitter, manager, executive).
- **Form Submission**: Excel-like forms for data entry, customizable to match existing Google Sheets structures.
- **Master Report**: Aggregates data based on user-defined conditions, viewable only by authorized users.
- **Export Options**: Download reports as PDF, Excel, or JPG.
- **Database Storage**: MongoDB stores form submissions for reliable data management.
- **Responsive UI**: Built with React and Tailwind CSS for a modern, user-friendly interface.

## Tech Stack
- **Frontend**: React, Tailwind CSS, React Hook Form, Axios
- **Backend**: Node.js, Express, MongoDB, JWT
- **Libraries**: `exceljs` (Excel export), `pdfkit` (PDF generation)
- **Deployment**: Local or cloud (e.g., Heroku for backend, Vercel for frontend)

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud, e.g., MongoDB Atlas)
- Git
- A modern web browser (e.g., Chrome, Firefox)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/report-submission.git
   cd report-submission
   ```

2. **Backend Setup**:
   - Navigate to the backend directory (if structured separately):
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file in the backend directory:
     ```env
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/report-submission
     JWT_SECRET=your-secure-secret
     ```
   - Start MongoDB locally or update `MONGODB_URI` for a cloud database.
   - Run the backend:
     ```bash
     node server.js
     ```

3. **Frontend Setup**:
   - Navigate to the frontend directory (if structured separately):
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm start
     ```
   - Alternatively, serve the `index.html` file directly if using the standalone version.

4. **Database Initialization**:
   - Connect to MongoDB (e.g., via MongoDB Compass or CLI).
   - Create initial users with roles (example using MongoDB CLI):
     ```javascript
     use report-submission
     db.users.insertMany([
       { email: "submitter@example.com", password: "$2a$10$...", role: "submitter" },
       { email: "manager@example.com", password: "$2a$10$...", role: "manager" },
       { email: "executive@example.com", password: "$2a$10$...", role: "executive" }
     ])
     ```
     Note: Replace passwords with hashed versions using `bcrypt.hashSync("password", 10)`.

## Usage

1. **Login**:
   - Open the app in a browser (e.g., `http://localhost:3000` for React dev server or `index.html`).
   - Log in with credentials (e.g., `submitter@example.com`, password: `password`).

2. **Submitting Reports**:
   - Users with the "submitter" role can access the form page.
   - Fill out fields (e.g., category, value, description) and submit.
   - Data is saved to MongoDB and linked to the user.

3. **Viewing Master Report**:
   - Users with "manager" or "executive" roles can view the master report.
   - The report summarizes data (e.g., sums by category) in a table.
   - Select export format (PDF, Excel, JPG) and download.

4. **Customization**:
   - Update form fields in the frontend (`MemberForm` component) to match your Google Sheets structure.
   - Modify aggregation logic in the backend (`/api/reports/master`) for specific conditions (e.g., filter by date, exclude outliers).

## Project Structure
```
report-submission/
├── backend/
│   ├── server.js           # Express server and API routes
│   ├── node_modules/       # Backend dependencies
│   ├── package.json
│   └── .env               # Environment variables
├── frontend/
│   ├── src/               # React components and logic
│   ├── public/            # Static files (e.g., index.html)
│   ├── node_modules/      # Frontend dependencies
│   └── package.json
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## Customization
- **Form Fields**: Edit the `reportSchema` in `server.js` and `MemberForm` in `index.html` to match your sheet columns.
- **Aggregation Logic**: Update the `/api/reports/master` endpoint in `server.js` to implement your specific conditions (e.g., weighted sums, date filters).
- **Export Formats**: JPG export requires additional setup (e.g., `pdf2pic` or `html2canvas`). Contact for assistance.
- **Styling**: Adjust Tailwind CSS classes in `index.html` for UI customization.

## Deployment
- **Backend**: Deploy to Heroku, AWS, or DigitalOcean. Update `MONGODB_URI` and `JWT_SECRET` in production.
- **Frontend**: Host on Vercel, Netlify, or serve `index.html` via a static server.
- **Database**: Use MongoDB Atlas for cloud hosting or a local MongoDB instance.

## Security Notes
- Replace `JWT_SECRET` with a strong, unique key in production.
- Use HTTPS for API requests in production.
- Hash passwords before storing (handled by `bcrypt` in the backend).
- Restrict database access to authorized IPs.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
MIT License. See `LICENSE` file for details.

## Contact
For issues or feature requests, open a GitHub issue or contact the project maintainer.