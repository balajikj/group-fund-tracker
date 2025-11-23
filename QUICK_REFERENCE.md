# 🚀 Group Fund Tracker - Quick Reference Card

## 📞 Emergency Contacts & Links

### Firebase Console
🔗 https://console.firebase.google.com/
- View: Firestore Database, Authentication, Usage

### GitHub Repository
🔗 https://github.com/YOUR_USERNAME/group-fund-tracker
- Edit code, view deployment status

### Live Application
🔗 https://YOUR_USERNAME.github.io/group-fund-tracker/
- The actual app URL

---

## 🔐 Admin Quick Actions

### Add a New Member
1. Firebase Console → Authentication → Add user
2. Firestore → members → Add document
   - ID: [Copy UID from Authentication]
   - Fields: name, role ("Admin"/"CoAdmin"/"Member"), lifetimeContribution: 0

### Change User Role
1. Firestore → members → Find user
2. Edit `role` field
3. User must re-login to see changes

### Reset User Password
1. Firebase Console → Authentication
2. Find user → Reset password
3. User will receive email

---

## 💰 Financial Formulas

### Total Fund
```
Total Fund = Σ Contributions - Σ Loan Disbursements + Σ Loan Returns
```

### Outstanding Loans
```
Outstanding = Σ loans where status = "Outstanding"
```

### Available Fund
```
Available = Total Fund - Outstanding Loans
```

### Budget Allocations
```
Travel (10%)  = Available × 0.10
Medical (20%) = Available × 0.20
Lending (50%) = Available × 0.50
Reserve (20%) = Available × 0.20
```

---

## 🗂️ File Purpose Reference

| File | Purpose | When to Edit |
|------|---------|--------------|
| `index.html` | Main page structure | Change layout/structure |
| `styles.css` | Visual design | Change colors/fonts |
| `firebase-config.js` | Firebase connection | **ONCE during setup** |
| `auth.js` | Login system | Add auth features |
| `app.js` | Data & calculations | Change formulas/logic |
| `admin.js` | Admin forms | Add new transaction types |
| `firestore.rules` | Security rules | Change permissions |

---

## 🔧 Common Modifications

### Change Budget Percentages
**File:** `app.js` (lines ~95-98)
```javascript
const travelBudget = availableFund * 0.10;    // ← Change 0.10
const medicalBudget = availableFund * 0.20;   // ← Change 0.20
const lendingBudget = availableFund * 0.50;   // ← Change 0.50
const reserveBudget = availableFund * 0.20;   // ← Change 0.20
```

### Change Primary Color
**File:** `styles.css` (line 3)
```css
--primary-color: #2563eb;  /* ← Change hex code */
```

### Add Transaction Type
**File:** `admin.js` (line ~35)
```html
<option value="Contribution-Annual">Annual</option>  <!-- Add this -->
```

---

## 📊 Firebase Free Tier Limits

| Resource | Limit | Current Usage* |
|----------|-------|----------------|
| Firestore Storage | 1 GiB | < 1 MB |
| Daily Reads | 50,000 | ~1,000 |
| Daily Writes | 20,000 | ~50 |
| Auth Users | Unlimited | 10-11 |

*Estimated for 10-11 members with normal usage

**✅ You're well within limits!**

---

## 🐛 Troubleshooting Flowchart

```
Login Not Working?
│
├─ Incorrect credentials? → Reset password in Firebase Console
├─ "User not found"? → Create user in Authentication
├─ Permission denied? → Check user exists in members collection
└─ Still failing? → Check firebase-config.js has correct values

Data Not Loading?
│
├─ Check browser console (F12) for errors
├─ Verify Firestore rules are published
└─ Check Firebase Usage & Billing for quota issues

Admin Panel Not Showing?
│
├─ Check user role in Firestore (case-sensitive: "Admin")
└─ User needs to logout and login again after role change

Can't Add Transactions?
│
├─ Verify user is Admin or CoAdmin
├─ Check Firestore security rules
└─ Look for errors in browser console
```

---

## 📱 User Roles & Permissions

| Feature | Admin | CoAdmin | Member |
|---------|-------|---------|--------|
| View fund status | ✅ | ✅ | ✅ |
| View transactions | ✅ | ✅ | ✅ |
| View loans | ✅ | ✅ | ✅ |
| View all members | ✅ | ✅ | ✅ |
| Add contributions | ✅ | ✅ | ❌ |
| Disburse loans | ✅ | ✅ | ❌ |
| Record returns | ✅ | ✅ | ❌ |

---

## 🔄 Regular Maintenance Tasks

### Weekly
- [ ] Check outstanding loans for due dates
- [ ] Review new contributions

### Monthly
- [ ] Verify all members are active
- [ ] Check Firebase usage (stay under free tier)
- [ ] Review transaction history for accuracy

### Quarterly
- [ ] Export data backup from Firebase
- [ ] Review and update budget allocations if needed
- [ ] Check for any overdue loans

---

## 💡 Quick Tips

1. **Testing?** Use `setup-initial-data.js` to populate sample data
2. **Backup?** Firebase auto-backs up, but export manually quarterly
3. **Mobile?** Works perfectly on phones - responsive design!
4. **Offline?** No - requires internet for Firebase connection
5. **Export data?** Manual: Firestore → Export (requires paid plan)

---

## 📞 Getting Help

### Check These First
1. Browser console (F12) for JavaScript errors
2. Firebase Console → Usage for quota issues
3. Firestore rules are published correctly
4. User exists in both Auth AND members collection

### Documentation
- 📖 `README.md` - Complete user guide
- 🏗️ `ARCHITECTURE.md` - System design diagrams
- 🚀 `DEPLOYMENT.md` - Setup checklist
- 📋 `PROJECT_SUMMARY.md` - Technical overview

### External Resources
- Firebase Docs: https://firebase.google.com/docs
- GitHub Pages: https://docs.github.com/pages

---

## 🎯 Key Firestore Collections

### `members`
```javascript
{
  "userId123": {
    name: "John Doe",
    role: "Admin",  // or "CoAdmin" or "Member"
    lifetimeContribution: 1500
  }
}
```

### `transactions`
```javascript
{
  "txn123": {
    memberId: "userId123",
    type: "Contribution-Monthly",  // or other types
    amount: 200,
    date: Timestamp,
    loanId: null
  }
}
```

### `loans`
```javascript
{
  "loan123": {
    borrowerId: "userId456",
    amount: 500,
    borrowDate: Timestamp,
    dueDate: Timestamp,
    status: "Outstanding"  // or "Returned"
  }
}
```

---

## 🎨 Color Codes (for customization)

| Element | Default Color | Hex Code |
|---------|---------------|----------|
| Primary (Blue) | 🔵 | `#2563eb` |
| Success (Green) | 🟢 | `#10b981` |
| Warning (Orange) | 🟠 | `#f59e0b` |
| Danger (Red) | 🔴 | `#ef4444` |
| Info (Cyan) | 🔵 | `#06b6d4` |

---

## 📈 Usage Statistics to Monitor

Track these in Firebase Console:

1. **Daily Active Users** (Authentication)
   - Target: 5-10 daily

2. **Firestore Reads** (Usage & Billing)
   - Target: < 5,000/day

3. **Firestore Writes** (Usage & Billing)
   - Target: < 500/day

4. **Storage Used** (Firestore Database)
   - Target: < 10 MB

---

## ⚡ Performance Tips

1. **Dashboard loads slow?**
   - Check internet connection
   - Reduce transaction history display (modify app.js)

2. **Firebase quota warning?**
   - Review security rules (prevent excessive reads)
   - Check for loops in code

3. **UI feels sluggish?**
   - Clear browser cache
   - Check for console errors

---

**Keep this reference handy! Bookmark or print for quick access.** 📌

**Zero cost. Maximum value.** 💰✨
