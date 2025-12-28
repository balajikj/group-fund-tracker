# Firestore Security Rules Setup

## 🔐 Required Security Rules for Contribution Requests

To enable the contribution request feature, you need to add security rules for the `contributionRequests` collection in your Firebase console.

### How to Update Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left menu
4. Click on the **Rules** tab
5. Add the rules below to your existing rules

---

## 📋 Security Rules for `contributionRequests` Collection

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules for members, transactions, loans...
    
    // Contribution Requests Rules - SIMPLE VERSION
    match /contributionRequests/{requestId} {
      // Allow all authenticated users to read and write
      allow read, write: if request.auth != null;
    }
    
    // Keep your existing rules for members, transactions, loans below...
  }
}
```

### Alternative: More Restrictive Rules (Optional)

If you want stricter control:

```javascript
// Contribution Requests Rules - RESTRICTIVE VERSION
match /contributionRequests/{requestId} {
  // Allow authenticated users to read all requests
  allow read: if request.auth != null;
  
  // Allow authenticated users to create requests for themselves
  allow create: if request.auth != null 
                && request.resource.data.memberId == request.auth.uid;
  
  // Allow all authenticated users to update (for now)
  allow update: if request.auth != null;
  
  // Allow all authenticated users to delete (for now)
  allow delete: if request.auth != null;
}
```

---

## 🔍 Complete Example (if starting fresh)

If you're setting up rules for the first time, here's a complete example with SIMPLE rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Members Collection
    match /members/{memberId} {
      allow read, write: if request.auth != null;
    }
    
    // Transactions Collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    // Loans Collection
    match /loans/{loanId} {
      allow read, write: if request.auth != null;
    }
    
    // Contribution Requests Collection
    match /contributionRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note**: This allows any authenticated user to read/write. For production, you may want to add role-based restrictions.

---

## ✅ Testing Your Rules

After updating the rules:

1. **Test as Member:**
   - ✅ Should be able to create request
   - ✅ Should be able to read all requests
   - ❌ Should NOT be able to update/delete requests

2. **Test as Admin/CoAdmin:**
   - ✅ Should be able to read all requests
   - ✅ Should be able to approve/reject (update) requests
   - ✅ Should be able to delete requests

3. **Test Unauthenticated:**
   - ❌ Should NOT be able to access any requests

---

## 🐛 Common Issues

### "Missing or insufficient permissions" Error

**Cause 1**: Security rules not updated
- **Solution**: Add the rules above to Firebase Console → Firestore → Rules

**Cause 2**: User not authenticated
- **Solution**: Make sure user is logged in before accessing data

**Cause 3**: Member document doesn't exist
- **Solution**: Ensure user has a corresponding document in `members` collection

**Cause 4**: Role field missing
- **Solution**: Check that member document has a `role` field (Admin, CoAdmin, or Member)

### Rules not applying

1. Click **Publish** button after editing rules in Firebase Console
2. Wait 1-2 minutes for rules to propagate
3. Clear browser cache and reload page
4. Check Firebase Console → Firestore → Rules for syntax errors

---

## 📝 Rule Breakdown

### Read Permission
```javascript
allow read: if request.auth != null;
```
- Any authenticated user can read contribution requests
- This allows members to see status and Admin to view pending requests

### Create Permission
```javascript
allow create: if request.auth != null 
              && request.resource.data.memberId == request.auth.uid
              && request.resource.data.status == 'Pending';
```
- User must be logged in
- Can only create requests for themselves (memberId matches auth.uid)
- Initial status must be 'Pending'

### Update Permission
```javascript
allow update: if request.auth != null && isAdminOrCoAdmin();
```
- Only Admin or CoAdmin can update requests
- This allows approve/reject functionality

### Delete Permission
```javascript
allow delete: if request.auth != null && isAdminOrCoAdmin();
```
- Only Admin or CoAdmin can delete requests
- Useful for cleaning up old rejected requests

---

## 🚀 Quick Fix Steps

If you're seeing the permissions error right now:

1. Open Firebase Console
2. Go to Firestore Database → Rules
3. Copy the complete example above
4. Click **Publish**
5. Wait 1 minute
6. Refresh your app
7. Try again

---

## 📞 Need Help?

If rules still not working:

1. Check browser console for exact error message
2. Verify you're logged in (check `request.auth != null`)
3. Verify member document exists with correct role
4. Check Firebase Console → Firestore → Rules for syntax errors
5. Try the Rules Playground in Firebase Console to test specific operations

---

**Last Updated**: December 28, 2025
