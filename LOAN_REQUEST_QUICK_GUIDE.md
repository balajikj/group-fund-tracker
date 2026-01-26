# 🚀 Loan Request Feature - Quick Setup Guide

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Deploy Firestore Security Rules

**Option A: Update existing rules**
1. Open Firebase Console → Firestore Database → Rules
2. Add the `loanRequests` match block from `firestore-loan-request-rules.rules`
3. Click "Publish"

**Option B: Use complete rules file**
1. Copy all content from `firestore-loan-request-rules.rules`
2. Replace your entire `firestore.rules` file
3. Deploy: `firebase deploy --only firestore:rules`

### 2️⃣ Create Firestore Indexes

Firebase Console → Firestore Database → Indexes → Create Index

**Index 1: Admin Queue (FIFO)**
- Collection: `loanRequests`
- Fields:
  - `status` (Ascending)
  - `requestedAt` (Ascending)

**Index 2: Member History**
- Collection: `loanRequests`
- Fields:
  - `memberId` (Ascending)
  - `requestedAt` (Descending)

**OR** just test the feature - Firebase will prompt you to create indexes automatically!

### 3️⃣ Test the Feature

#### As Member:
1. Login as a member
2. See "💸 Request Loan" button in "My Contribution" section
3. Click and fill out form (e.g., ₹5,000, 30 days)
4. Submit → Request appears in "My Loan Requests" as "Pending"

#### As Admin:
1. Login as admin
2. See "💸 Pending Loan Requests" panel
3. Click "Review" on the request
4. Click "✅ Approve & Disburse"
5. Loan appears in "Active Loans" table
6. Transaction created in "Transaction History"

---

## 🎯 Key Features at a Glance

| Feature | Member | Admin |
|---------|--------|-------|
| Request loan | ✅ | ✅ |
| View own requests | ✅ | ✅ |
| Cancel pending request | ✅ | ❌ |
| View all pending requests | ❌ | ✅ |
| Approve/Reject requests | ❌ | ✅ |
| Override amount/due date | ❌ | ✅ |

---

## 🔢 Default Limits

| Limit | Value |
|-------|-------|
| Min Loan Amount | ₹100 |
| Max Loan Amount | ₹100,000 |
| Min Term | 7 days |
| Max Term | 180 days |
| Member Outstanding Limit | ₹200,000 |
| Lending Budget | 50% of total amount |

---

## 📍 Where Everything Is

### UI Elements

**Member Dashboard:**
- "Request Loan" button → Personal Contribution section
- "My Loan Requests" panel → Below Personal Contribution

**Admin Dashboard:**
- "Pending Loan Requests" panel → Below Pending Contribution Requests

### Code Files

| File | What Changed |
|------|--------------|
| `index.html` | Added 3 new sections (button + 2 panels) |
| `app.js` | Added 6 functions (load, display, approve, reject, cancel) |
| `admin.js` | Added 2 forms (request loan, review modal) |
| `auth.js` | Updated panel visibility logic |

### Database

| Collection | Purpose |
|------------|---------|
| `loanRequests` | Stores all loan requests (Pending/Approved/Rejected) |
| `loans` | Stores disbursed loans (created on approval) |
| `transactions` | Stores disbursement transactions |

---

## 🧪 Quick Test Scenarios

### Test 1: Happy Path (Member → Approve)
```
1. Member: Request ₹5,000, 30 days, "Medical"
2. Admin: Review → Approve as-is
3. ✅ Loan created, transaction created, request status = Approved
```

### Test 2: Admin Override
```
1. Member: Request ₹10,000, 60 days
2. Admin: Review → Change to ₹8,000, 45 days, "Reduced per policy"
3. ✅ Loan created with ₹8,000, request shows override
```

### Test 3: Rejection
```
1. Member: Request ₹50,000, 90 days
2. Admin: Review → Reject, "Exceeds budget"
3. ✅ No loan created, request status = Rejected, member sees reason
```

### Test 4: Member Cancel
```
1. Member: Request ₹3,000, 20 days
2. Member: Click "Cancel" before Admin reviews
3. ✅ Request deleted, no longer appears
```

### Test 5: Validation
```
1. Member: Request ₹50 (too low) → ❌ Error
2. Member: Request ₹200,000 (too high) → ❌ Error
3. Member: Request ₹5,000, 3 days (too soon) → ❌ Error
4. Member: Request ₹5,000, 200 days (too far) → ❌ Error
```

---

## 🐛 Troubleshooting

### Issue: Indexes not created
**Symptoms**: Console error "requires an index"  
**Solution**: Click the link in error message, or create manually in Firebase Console

### Issue: "Permission denied" errors
**Symptoms**: Cannot create/read loan requests  
**Solution**: Deploy updated security rules (Step 1 above)

### Issue: Buttons not appearing
**Symptoms**: No "Request Loan" button  
**Solution**: Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: Old data showing
**Symptoms**: Approved request still shows as Pending  
**Solution**: Refresh dashboard (logout/login or F5)

---

## 💡 Pro Tips

1. **Test with small amounts first** (e.g., ₹100) to verify flow
2. **Use browser DevTools** (F12) → Console to see errors
3. **Check Firestore Database** directly to verify data creation
4. **Admin can approve own requests** (useful for testing)
5. **Lending budget updates dynamically** as loans are disbursed/returned

---

## 🎨 Customization

### Change Loan Limits
**File**: `admin.js` and `app.js`  
**Search for**: `100`, `100000`, `200000`  
**Update**: Both files consistently

### Change Term Limits
**File**: `admin.js` and `app.js`  
**Search for**: `7`, `180`  
**Update**: Both files consistently

### Change Lending Budget %
**File**: `app.js` → `calculateAndDisplayMetrics()`  
**Line**: `const lendingBudget = totalAmount * 0.50;`  
**Change**: `0.50` to desired percentage (e.g., `0.60` for 60%)

---

## 📋 Checklist

Before going live:

- [ ] Firestore security rules deployed
- [ ] Firestore indexes created (or auto-created via testing)
- [ ] Tested member request flow
- [ ] Tested admin approve flow
- [ ] Tested admin reject flow
- [ ] Tested member cancel flow
- [ ] Tested validation errors
- [ ] Verified loans appear in Active Loans table
- [ ] Verified transactions appear in history
- [ ] Verified budget calculations update correctly
- [ ] Cleared browser cache on production

---

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Review [LOAN_REQUEST_FEATURE.md](LOAN_REQUEST_FEATURE.md) for detailed docs
3. Compare with Contribution Request workflow (similar pattern)
4. Check Firestore Database → loanRequests collection

---

**Feature Status**: ✅ Ready to Use  
**Setup Time**: ~5 minutes  
**Dependencies**: None (uses existing infrastructure)
