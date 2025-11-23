# Group Fund Tracker - Deployment Checklist

## Pre-Deployment Checklist

### Firebase Setup
- [ ] Created Firebase project
- [ ] Enabled Firestore Database in production mode
- [ ] Enabled Authentication (Email/Password)
- [ ] Deployed Firestore Security Rules from `firestore.rules`
- [ ] Created initial Admin/CoAdmin users in Authentication
- [ ] Added corresponding documents in `members` collection
- [ ] Updated `firebase-config.js` with actual Firebase credentials

### Code Configuration
- [ ] Replaced placeholder Firebase config in `firebase-config.js`
- [ ] Tested login functionality locally
- [ ] Verified Admin panel appears for Admin/CoAdmin users
- [ ] Tested adding contributions, loans, and returns
- [ ] Verified calculations are correct

### GitHub Setup
- [ ] Created GitHub repository
- [ ] Pushed code to main branch
- [ ] Enabled GitHub Pages in repository settings
- [ ] Added GitHub Pages URL to Firebase authorized domains

## Deployment Steps

### 1. Firebase Configuration

```javascript
// In firebase-config.js, replace with your values:
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 2. Firestore Security Rules

Deploy these rules in Firebase Console > Firestore Database > Rules:

```
[See firestore.rules file]
```

### 3. Create Initial Admin User

In Firebase Console > Authentication:
1. Add user with email/password
2. Copy the user UID
3. In Firestore, create document in `members` collection:
   - Document ID: [User UID]
   - name: "Your Name"
   - role: "Admin"
   - lifetimeContribution: 0

### 4. GitHub Pages Deployment

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment: Group Fund Tracker"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/group-fund-tracker.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 5. Enable GitHub Pages

1. Go to repository Settings
2. Navigate to Pages section
3. Source: Deploy from branch
4. Branch: main / (root)
5. Save

Your site will be available at:
`https://YOUR_USERNAME.github.io/group-fund-tracker/`

### 6. Update Firebase Authorized Domains

1. Firebase Console > Authentication > Settings
2. Authorized domains tab
3. Add: `YOUR_USERNAME.github.io`
4. Save

## Post-Deployment Verification

### Test Login
- [ ] Navigate to your GitHub Pages URL
- [ ] Login with Admin credentials
- [ ] Verify dashboard loads correctly
- [ ] Check that Admin panel is visible

### Test Admin Functions
- [ ] Add a test contribution
- [ ] Disburse a test loan
- [ ] Record a loan return
- [ ] Verify all transactions appear in history
- [ ] Check calculations are correct

### Test Member Access
- [ ] Create a Member user in Firebase Auth
- [ ] Add them to members collection with role "Member"
- [ ] Login as Member
- [ ] Verify Admin panel is NOT visible
- [ ] Confirm all data is viewable (read-only)

### Test Security
- [ ] Try to modify Firestore data as a Member (should fail)
- [ ] Verify unauthorized access is blocked
- [ ] Test logout functionality

## Firebase Free Tier Limits (Spark Plan)

✅ **Within Free Tier:**
- Firestore: 1 GiB stored, 50K reads/day, 20K writes/day
- Authentication: Unlimited users
- Hosting: 10 GB bandwidth/month

📊 **Expected Usage (10-11 members):**
- ~100-200 transactions/month
- ~50-100 reads per dashboard load
- ~10-20 active sessions/day
- **Well within free limits**

## Maintenance

### Adding New Members
1. Firebase Console > Authentication > Add user
2. Firestore > members collection > Add document
3. Use the Auth UID as document ID
4. Set name, role, lifetimeContribution: 0

### Updating Budget Percentages
Edit `app.js`, function `calculateAndDisplayMetrics()`:
```javascript
const travelBudget = availableFund * 0.10;    // Change percentage here
const medicalBudget = availableFund * 0.20;   // Change percentage here
const lendingBudget = availableFund * 0.50;   // Change percentage here
const reserveBudget = availableFund * 0.20;   // Change percentage here
```

### Backup Strategy
**Automatic:** Firebase maintains backups
**Manual Export:**
1. Firebase Console > Firestore Database
2. Import/Export tab
3. Export data to Cloud Storage

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules are deployed
- Verify user exists in members collection with correct role
- Ensure user is logged in

### Firebase config errors
- Verify all config values are correct (no placeholders)
- Check for typos in apiKey, projectId, etc.
- Ensure Firebase SDK is loaded before config

### GitHub Pages not loading
- Wait 5-10 minutes after enabling Pages
- Check repository is public or Pages is enabled for private repos
- Verify branch and folder settings in Pages configuration

### Data not syncing
- Check browser console for errors
- Verify internet connection
- Check Firebase quotas (unlikely to hit on free tier)

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **GitHub Pages Documentation**: https://docs.github.com/pages
- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started

## Security Best Practices

✅ **Implemented:**
- Role-based access control via Firestore rules
- Authentication required for all data access
- Admin-only write operations
- Client-side role verification

⚠️ **Additional Recommendations:**
- Enable 2FA for Admin accounts
- Regularly review Firebase Auth users
- Monitor Firestore usage in Firebase Console
- Keep Firebase SDK updated

---

**Last Updated:** November 2024
**Version:** 1.0.0
