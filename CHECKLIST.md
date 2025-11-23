# ✅ Complete Setup Checklist

Use this checklist to ensure everything is configured correctly.

## Phase 1: Firebase Setup (15 minutes)

### Create Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Create a project"
- [ ] Name: `group-fund-tracker` (or your choice)
- [ ] Disable Google Analytics
- [ ] Wait for project creation

### Enable Firestore
- [ ] Navigate to Build → Firestore Database
- [ ] Click "Create database"
- [ ] Select "Start in production mode"
- [ ] Choose nearest location
- [ ] Wait for database creation

### Deploy Security Rules
- [ ] In Firestore, click "Rules" tab
- [ ] Open `firestore.rules` from project
- [ ] Copy entire content
- [ ] Paste into Firebase Console
- [ ] Click "Publish"
- [ ] Verify "Published" status

### Enable Authentication
- [ ] Navigate to Build → Authentication
- [ ] Click "Get started"
- [ ] Click "Email/Password"
- [ ] Toggle "Email/Password" to ON
- [ ] Click "Save"

### Get Firebase Config
- [ ] Click ⚙️ (gear icon) → Project settings
- [ ] Scroll to "Your apps"
- [ ] Click web icon `</>`
- [ ] App nickname: `fund-tracker`
- [ ] Don't check "Firebase Hosting"
- [ ] Click "Register app"
- [ ] **Copy the firebaseConfig object**
- [ ] Click "Continue to console"

### Update Project Config
- [ ] Open `firebase-config.js` in your editor
- [ ] Replace ALL placeholder values:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `projectId`
  - [ ] `storageBucket`
  - [ ] `messagingSenderId`
  - [ ] `appId`
- [ ] Save file
- [ ] Verify no placeholder text remains

---

## Phase 2: Create Users (10 minutes)

### Create Admin User
- [ ] Firebase Console → Authentication
- [ ] Click "Add user"
- [ ] Email: __________________ (write it down!)
- [ ] Password: __________________ (write it down!)
- [ ] Click "Add user"
- [ ] **COPY THE UID** (long string like `abc123xyz...`)

### Add Admin to Firestore
- [ ] Firebase Console → Firestore Database
- [ ] Click "Start collection"
- [ ] Collection ID: `members`
- [ ] Click "Next"
- [ ] Document ID: **PASTE THE UID**
- [ ] Add field: `name`
  - Type: string
  - Value: Your full name
- [ ] Click "+ Add field"
- [ ] Add field: `role`
  - Type: string
  - Value: `Admin` (case-sensitive!)
- [ ] Click "+ Add field"
- [ ] Add field: `lifetimeContribution`
  - Type: number
  - Value: `0`
- [ ] Click "Save"

### Create Additional Users (Optional)
For each additional user:
- [ ] Authentication → Add user (get UID)
- [ ] Firestore → members → Add document
  - Document ID: [UID]
  - name: [User name]
  - role: `CoAdmin` or `Member`
  - lifetimeContribution: `0`

### Test Login Locally (Optional but Recommended)
- [ ] Open `index.html` in browser
- [ ] Open browser console (F12)
- [ ] Try logging in with Admin credentials
- [ ] Check console for any Firebase errors
- [ ] If errors, verify firebase-config.js

---

## Phase 3: GitHub Setup (10 minutes)

### Create Repository
- [ ] Go to https://github.com/new
- [ ] Repository name: `group-fund-tracker`
- [ ] Make it **Public** (required for free GitHub Pages)
- [ ] Don't initialize with README
- [ ] Click "Create repository"

### Push Code
Open terminal/command prompt in project folder:

```bash
# Check if git is installed
git --version

# If not installed, download from https://git-scm.com/
```

- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit: Group Fund Tracker"`
- [ ] Run: `git branch -M main`
- [ ] Run: `git remote add origin https://github.com/YOUR_USERNAME/group-fund-tracker.git`
  - Replace YOUR_USERNAME with your GitHub username
- [ ] Run: `git push -u origin main`
- [ ] Verify code appears on GitHub

### Enable GitHub Pages
- [ ] In GitHub repo, click "Settings"
- [ ] Click "Pages" in left sidebar
- [ ] Under "Build and deployment":
  - Source: "Deploy from a branch"
  - Branch: `main`
  - Folder: `/ (root)`
- [ ] Click "Save"
- [ ] Wait 2-5 minutes
- [ ] Refresh page to see your URL
- [ ] **COPY YOUR URL**: `https://YOUR_USERNAME.github.io/group-fund-tracker/`

### Authorize Domain in Firebase
- [ ] Back to Firebase Console
- [ ] Authentication → Settings
- [ ] Click "Authorized domains" tab
- [ ] Click "Add domain"
- [ ] Enter: `YOUR_USERNAME.github.io`
- [ ] Click "Add"

---

## Phase 4: Testing (10 minutes)

### Access Application
- [ ] Open your GitHub Pages URL in browser
- [ ] Verify page loads without errors
- [ ] Check browser console (F12) for errors

### Test Login
- [ ] Enter Admin email and password
- [ ] Click "Login"
- [ ] Should redirect to dashboard
- [ ] Verify your name appears in header
- [ ] Verify "Admin" badge shows

### Test Dashboard
- [ ] All metric cards show $0.00 (expected - no data yet)
- [ ] "Active Loans" shows "No active loans"
- [ ] "Transaction History" shows "No transactions yet"
- [ ] "Admin Actions" section is visible

### Test Admin Functions

#### Add Contribution
- [ ] Click "Add Contribution"
- [ ] Select yourself as member
- [ ] Type: Monthly
- [ ] Amount: 100
- [ ] Date: Today
- [ ] Click "Add Contribution"
- [ ] Modal closes
- [ ] "Total Fund" updates to $100.00
- [ ] "Available for Budgeting" shows $100.00
- [ ] Budget allocations calculate correctly:
  - Travel: $10.00
  - Medical: $20.00
  - Lending: $50.00
  - Reserve: $20.00
- [ ] "My Contribution" shows $100.00
- [ ] Transaction appears in history

#### Disburse Loan
- [ ] Click "Disburse Loan"
- [ ] Select yourself as borrower
- [ ] Amount: 50
- [ ] Borrow Date: Today
- [ ] Due Date: 30 days from now
- [ ] Click "Disburse Loan"
- [ ] "Total Fund" updates to $50.00
- [ ] "Outstanding Loans" shows $50.00
- [ ] "Available for Budgeting" shows $0.00
- [ ] All budgets show $0.00
- [ ] Loan appears in "Active Loans" table
- [ ] Transaction appears in history

#### Record Return
- [ ] Click "Record Loan Return"
- [ ] Select the loan you just created
- [ ] Return Date: Today
- [ ] Click "Record Return"
- [ ] "Outstanding Loans" returns to $0.00
- [ ] "Available for Budgeting" returns to $50.00
- [ ] Loan disappears from "Active Loans"
- [ ] Return transaction appears in history

### Test Member Access
If you created a Member user:
- [ ] Logout
- [ ] Login as Member
- [ ] Verify dashboard loads
- [ ] Verify "Admin Actions" is NOT visible
- [ ] Verify all data is readable
- [ ] Try to modify Firestore directly (should fail)

---

## Phase 5: Production Setup (5 minutes)

### Add Real Members
For each real member (repeat):
- [ ] Create user in Firebase Auth
- [ ] Add to Firestore members collection
- [ ] Set appropriate role (Member/CoAdmin)
- [ ] Send them login credentials securely

### Optional: Add Sample Data
If you want realistic test data:
- [ ] Open application as Admin
- [ ] Open browser console (F12)
- [ ] Copy content of `setup-initial-data.js`
- [ ] Paste into console
- [ ] Run: `setupInitialData()`
- [ ] Wait for completion message
- [ ] Refresh page

### Document Access
- [ ] Share GitHub Pages URL with members
- [ ] Share login credentials securely
- [ ] Share this documentation

### Backup Credentials
- [ ] Save Firebase project ID: __________________
- [ ] Save Firebase Console URL: __________________
- [ ] Save GitHub repo URL: __________________
- [ ] Save GitHub Pages URL: __________________
- [ ] Store in secure location

---

## Phase 6: Monitoring (Ongoing)

### Daily
- [ ] Check for new contributions/loans
- [ ] Monitor due dates

### Weekly
- [ ] Review transaction log
- [ ] Check for overdue loans
- [ ] Verify fund calculations

### Monthly
- [ ] Check Firebase usage (should be < 10% of free tier)
- [ ] Review member access
- [ ] Export data backup (optional)

### Quarterly
- [ ] Review budget allocations
- [ ] Consider adjusting percentages
- [ ] Export complete data backup

---

## Verification Checklist

Before going live, verify:

### Firebase
- [ ] Firestore rules published
- [ ] Authentication enabled
- [ ] Admin user created and added to members
- [ ] Firebase config updated in code
- [ ] GitHub Pages domain authorized

### Code
- [ ] No placeholder values in firebase-config.js
- [ ] All files committed to GitHub
- [ ] GitHub Pages is active

### Functionality
- [ ] Login works
- [ ] Dashboard loads data
- [ ] Admin can add contributions
- [ ] Admin can disburse loans
- [ ] Admin can record returns
- [ ] Calculations are correct
- [ ] Member access is read-only

### Security
- [ ] Firestore security rules prevent member writes
- [ ] Only authorized domains allowed
- [ ] Passwords are strong

### Documentation
- [ ] README.md read and understood
- [ ] QUICK_REFERENCE.md saved for later
- [ ] All credentials backed up securely

---

## Troubleshooting Common Issues

### "Firebase not defined" error
- [ ] Check firebase-config.js has valid config
- [ ] Verify Firebase SDK loads before other scripts
- [ ] Check browser console for more details

### "Permission denied" on login
- [ ] Verify user exists in Authentication
- [ ] Verify user document exists in members collection
- [ ] Check UID matches between Auth and Firestore

### Dashboard shows no data
- [ ] Check browser console for errors
- [ ] Verify Firestore rules are published
- [ ] Check Firebase project has data

### GitHub Pages shows 404
- [ ] Wait 5-10 minutes after enabling Pages
- [ ] Verify repository is public
- [ ] Check Settings → Pages shows green success

---

## 🎉 Success Criteria

Your system is ready when:
- ✅ You can login successfully
- ✅ Dashboard displays correctly
- ✅ You can add a test contribution
- ✅ Calculations update in real-time
- ✅ Member users can view but not edit
- ✅ All documentation is accessible

---

## 📞 Support

If stuck:
1. Check browser console (F12) for specific errors
2. Review Firebase Console for configuration issues
3. Re-read DEPLOYMENT.md for detailed steps
4. Check QUICK_REFERENCE.md for common solutions

---

**Estimated Total Setup Time: 50-60 minutes**

**Cost: $0.00** 💰

**Congratulations on building your zero-cost fund tracking system!** 🎊
