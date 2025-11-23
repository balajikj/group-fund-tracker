# Group Fund Tracker - Zero-Cost Serverless

A secure, web-based application for tracking contributions, loans, and budget allocations for private groups. Built with **zero infrastructure cost** using GitHub Pages and Firebase.

## 🚀 Features

- **Role-Based Access Control**: Admin/Co-Admin can manage funds; Members can view only
- **Financial Tracking**: Comprehensive tracking of contributions, loans, and returns
- **Budget Allocation**: Automatic calculation of fund distribution (Travel 10%, Medical 20%, Lending 50%, Reserve 20%)
- **Real-Time Updates**: Live dashboard with current fund status
- **Loan Management**: Track outstanding loans with due dates and automatic overdue warnings
- **Transaction History**: Complete audit trail of all financial activities
- **Zero Cost**: Hosted on GitHub Pages with Firebase Spark Plan (Free)

## 📋 Requirements

- GitHub account (for hosting)
- Firebase account (for backend/database)
- Modern web browser

## 🛠️ Setup Instructions

### Step 1: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the wizard
   - Choose a project name (e.g., "group-fund-tracker")

2. **Enable Firestore Database**
   - In Firebase Console, go to "Build" → "Firestore Database"
   - Click "Create database"
   - Start in **production mode**
   - Choose a location closest to your users

3. **Set Up Authentication**
   - Go to "Build" → "Authentication"
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Optionally enable "Google" sign-in

4. **Configure Firestore Security Rules**
   - In Firestore Database, go to "Rules" tab
   - Copy the contents of `firestore.rules` from this project
   - Publish the rules

5. **Get Firebase Configuration**
   - Go to Project Settings (gear icon) → General
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register app with a nickname
   - Copy the `firebaseConfig` object

6. **Update Firebase Configuration**
   - Open `firebase-config.js` in your project
   - Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### Step 2: Create Initial Users

1. **Create Admin Users**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password for Admin
   - Repeat for Co-Admin

2. **Create Member Collection**
   - Go to Firestore Database
   - Create a collection named `members`
   - For each user, create a document with the user's UID as the document ID:
   ```
   Document ID: [User UID from Authentication]
   Fields:
     - name: "John Doe" (string)
     - role: "Admin" (string)  // or "CoAdmin" or "Member"
     - lifetimeContribution: 0 (number)
   ```

### Step 3: GitHub Pages Deployment

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Group Fund Tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/group-fund-tracker.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select branch: `main`
   - Click "Save"
   - Your site will be published at: `https://YOUR_USERNAME.github.io/group-fund-tracker/`

3. **Update Firebase Authorized Domains**
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your GitHub Pages domain: `YOUR_USERNAME.github.io`

## 📊 Data Structure

### Collections

#### `members`
- `memberId` (Document ID): Firebase Auth UID
- `name`: Member's display name
- `role`: "Admin", "CoAdmin", or "Member"
- `lifetimeContribution`: Running total of contributions

#### `transactions`
- `transactionId` (Document ID): Auto-generated
- `memberId`: Reference to member
- `type`: "Contribution-Monthly", "Contribution-Quarterly", "Loan-Disbursement", "Loan-Return"
- `amount`: Transaction amount (positive for cash-in, negative for disbursements)
- `date`: Firestore Timestamp
- `loanId`: Reference to loan (if applicable)

#### `loans`
- `loanId` (Document ID): Auto-generated
- `borrowerId`: Reference to borrowing member
- `amount`: Loan amount
- `borrowDate`: Firestore Timestamp
- `dueDate`: Firestore Timestamp
- `status`: "Outstanding" or "Returned"

## 🔐 Security

- **Firebase Security Rules**: Enforces role-based access at the database level
- **Client-Side Validation**: Additional validation in the UI
- **Authentication Required**: All data access requires authenticated users

## 💰 Budget Allocation

The available fund (Total Fund - Outstanding Loans) is automatically allocated:

- 🚗 **Travel Budget**: 10%
- 🏥 **Medical Emergency**: 20%
- 💵 **Lending Fund**: 50%
- 💼 **Reserve**: 20%

## 👥 User Roles

### Admin / Co-Admin
- View all financial data
- Add contributions
- Disburse loans
- Record loan returns
- Full write access

### Member
- View fund balance
- View all transactions
- View outstanding loans
- View their personal contribution
- **No write access**

## 🔧 Local Development

To test locally before deploying:

1. Install a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

2. Open browser to `http://localhost:8000`

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 🐛 Troubleshooting

### Login Issues
- Verify Firebase Auth is enabled
- Check that user exists in both Authentication and members collection
- Ensure authorized domains are configured

### Data Not Loading
- Check browser console for errors
- Verify Firestore rules are published
- Ensure Firebase config is correct

### Permission Denied
- Verify user role in members collection
- Check Firestore security rules
- Ensure user is authenticated

## 📝 Usage Guide

### For Admins

**Adding a Contribution:**
1. Click "Add Contribution"
2. Select member, type (Monthly/Quarterly), amount, and date
3. Click "Add Contribution"

**Disbursing a Loan:**
1. Click "Disburse Loan"
2. Select borrower, amount, borrow date, and due date
3. Click "Disburse Loan"

**Recording Loan Return:**
1. Click "Record Loan Return"
2. Select the loan and return date
3. Click "Record Return"

### For Members

- View current fund balance
- Check personal lifetime contribution
- Review all transactions
- Monitor outstanding loans and due dates

## 🎨 Customization

- Modify `styles.css` to change colors and layout
- Update budget percentages in `app.js` (search for `0.10`, `0.20`, `0.50`)
- Adjust Firebase rules for custom access patterns

## 📄 License

This project is open source and available for personal and group use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For issues or questions, please create an issue in the GitHub repository.

---

**Built with ❤️ for community fund management**
