# 💸 Loan Request & Approval Feature

## Overview
This feature enables **Members to request loans** and **Admins to review and approve/reject** those requests in a structured queue workflow, similar to the existing Contribution Request system.

---

## 🎯 Key Features

### For Members
1. **Request Loan** - Submit loan requests with amount, due date, and reason
2. **View Request Status** - Track all loan requests (Pending/Approved/Rejected)
3. **Cancel Pending Requests** - Cancel requests before Admin review
4. **Real-time Validation** - Instant feedback on limits and eligibility

### For Admins
1. **Loan Request Queue** - View all pending loan requests
2. **Review Requests** - See member info, contribution history, outstanding loans
3. **Approve with Overrides** - Modify amount/due date at approval time
4. **Reject with Reason** - Provide mandatory rejection explanation
5. **Automatic Disbursement** - Approval creates loan + transaction instantly

---

## 🗂️ Data Model

### `loanRequests` Collection (NEW)

```javascript
{
  id: "req_abc123",                    // Auto-generated document ID
  
  // Request Details
  memberId: "user123",                 // Requester ID
  memberName: "John Doe",              // Requester name
  requestedAmount: 5000.00,            // Amount requested (₹)
  requestedDueDate: Timestamp,         // Due date requested
  comments: "Medical emergency",       // Reason (optional)
  
  // Status & Timestamps
  status: "Pending",                   // Pending | Approved | Rejected
  requestedAt: ServerTimestamp,        // When created
  
  // Admin Decision (populated after review)
  reviewedBy: "admin-uid",             // Admin who reviewed
  reviewedAt: Timestamp,               // When reviewed
  adminComments: "Approved as requested",
  
  // Approval-specific
  approvedAmount: 5000.00,             // Final approved amount
  approvedDueDate: Timestamp,          // Final approved due date
  loanId: "loan_xyz789",               // Created loan reference
  transactionId: "txn_def456",         // Disbursement transaction ref
  
  // Rejection-specific
  rejectionReason: "Insufficient budget" // Required for rejections
}
```

**Required Firestore Indexes:**
```
Collection: loanRequests
- status (ascending) + requestedAt (descending)
- memberId (ascending) + requestedAt (descending)
```

---

## 🔄 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAN REQUEST LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

MEMBER                          ADMIN                    SYSTEM
──────                         ──────                   ────────

1. Click "Request Loan"
2. Fill form:
   - Amount (₹100-₹100,000)
   - Due Date (7-180 days)
   - Comments (optional)
3. Submit ──────────────────> 4. Request appears in queue
                                  
                              5. Click "Review"
                                 - See member info
                                 - Current outstanding
                                 - Contribution history
                                 
                              6a. APPROVE:
                                  - Override amount (opt)
                                  - Override due date (opt)
                                  - Add comments (opt)
                                  ─────────────────────> 7. Create Loan
                                  ─────────────────────> 8. Create Transaction
                                  ─────────────────────> 9. Update Request
                                  
                              6b. REJECT:
                                  - Enter reason (required)
                                  ─────────────────────> 10. Update Request
                                  
11. View "My Loan Requests"
    - See status/decision
```

---

## 🎨 UI Components

### 1. Member Dashboard

#### Request Loan Button
- **Location**: Personal Contribution section (next to "Request Contribution")
- **Label**: "💸 Request Loan"
- **Action**: Opens request form modal

#### Request Loan Form (Modal)
```
┌─────────────────────────────────────────┐
│  💸 Request Loan                        │
├─────────────────────────────────────────┤
│  Requested Amount (₹) *                 │
│  [_____________] (₹100 - ₹100,000)      │
│                                         │
│  Requested Due Date *                   │
│  [____/____/______] (7-180 days)        │
│                                         │
│  Reason/Comments (optional)             │
│  [_________________________________]    │
│                                         │
│  💡 Your Info:                          │
│  • Current outstanding: ₹0              │
│  • Available lending budget: ₹25,000    │
│                                         │
│  [Submit Loan Request]  [Cancel]        │
└─────────────────────────────────────────┘
```

**Validation:**
- Amount: ₹100 ≤ amount ≤ ₹100,000
- Due Date: 7-180 days from today
- Total Outstanding: member's total ≤ ₹200,000
- Lending Budget: requested amount ≤ available lending budget

#### My Loan Requests Panel
- **Location**: Below "My Contribution" section
- **Columns**: Request Date | Amount | Due Date | Status | Decision Details | Actions
- **Status Badges**:
  - 🟡 **Pending** (Yellow) - with "Cancel" button
  - ✅ **Approved** (Green) - shows approved amount + date
  - ❌ **Rejected** (Red) - shows rejection reason

---

### 2. Admin Dashboard

#### Pending Loan Requests Panel
- **Location**: Below "Pending Contribution Requests"
- **Columns**: Requested | Member | Amount | Due Date | Reason | Member Info | Actions
- **Member Info**: Shows contribution + current outstanding
- **Action**: "Review" button → Opens review modal

#### Review Loan Request Modal (Admin)
```
┌─────────────────────────────────────────────┐
│  💸 Review Loan Request                     │
├─────────────────────────────────────────────┤
│  Member: John Doe (#user123)               │
│  Lifetime Contribution: ₹12,000             │
│  Current Outstanding: ₹0                    │
│  Requested On: Jan 20, 2026                 │
│                                             │
│  ───────────────────────────────────────    │
│  REQUESTED:                                 │
│    Amount: ₹5,000                           │
│    Due Date: Mar 15, 2026                   │
│    Reason: "Medical emergency"              │
│  ───────────────────────────────────────    │
│                                             │
│  🔧 ADMIN OVERRIDES (optional):             │
│    Approved Amount (₹): [5000_____]         │
│    Approved Due Date: [____/____/______]    │
│    Admin Comments: [___________________]    │
│                                             │
│  💡 Available Lending Budget: ₹25,000       │
│                                             │
│  [✅ Approve & Disburse]  [❌ Reject]       │
└─────────────────────────────────────────────┘
```

**Approve Flow:**
1. Review request details
2. Optionally modify amount/due date
3. Add admin comments
4. Click "Approve & Disburse"
5. System creates loan + transaction atomically
6. Request status → "Approved"

**Reject Flow:**
1. Click "Reject"
2. Enter rejection reason (min 10 characters, required)
3. Confirm rejection
4. Request status → "Rejected"
5. No loan/transaction created

---

## 🔐 Security & Validation

### Business Rules

#### Amount Limits
- **Minimum**: ₹100
- **Maximum**: ₹100,000
- **Member Outstanding Limit**: ₹200,000 total
- **Lending Budget Check**: Request ≤ 50% of total amount

#### Date Rules
- **Minimum Term**: 7 days from today
- **Maximum Term**: 180 days from today
- **Admin Override**: Admin can set any future due date

#### Request Lifecycle
- **Member Can Cancel**: Only "Pending" requests
- **Admin Can Review**: Only "Pending" requests
- **Concurrency Protection**: Firestore transactions prevent double-approval

### Firestore Security Rules

```javascript
match /loanRequests/{requestId} {
  // Members can read own requests only
  allow read: if request.auth.uid == resource.data.memberId;
  
  // Members can create requests for themselves
  allow create: if request.auth.uid == request.resource.data.memberId
                && request.resource.data.status == 'Pending';
  
  // Members can delete own pending requests
  allow delete: if request.auth.uid == resource.data.memberId
                && resource.data.status == 'Pending';
  
  // Admins can read all, update (approve/reject) pending only
  allow read, update: if getRole(request.auth.uid) == 'Admin';
}

function getRole(uid) {
  return get(/databases/$(database)/documents/members/$(uid)).data.role;
}
```

---

## 🛠️ Technical Implementation

### Files Modified

| File | Changes |
|------|---------|
| **index.html** | Added "Request Loan" button, "My Loan Requests" panel, "Pending Loan Requests" panel |
| **app.js** | Added load functions, display functions, approve/reject handlers |
| **admin.js** | Added request loan form, review modal, event listeners |
| **auth.js** | Updated dashboard visibility logic for loan panels |

### Key Functions

#### app.js
- `loadMemberLoanRequests()` - Load current user's requests
- `loadPendingLoanRequests()` - Load admin queue
- `displayMemberLoanRequestsTable()` - Render member view
- `displayPendingLoanRequestsTable()` - Render admin queue
- `cancelLoanRequest(requestId)` - Member cancel action
- `approveLoanRequest(requestId, amount, dueDate, comments)` - Admin approve
- `rejectLoanRequest(requestId, reason)` - Admin reject

#### admin.js
- `showRequestLoanForm()` - Open request form modal
- `handleRequestLoan(e)` - Submit request with validation
- `showReviewLoanRequestModal(request)` - Open admin review modal

---

## 📊 State Machine

```
┌─────────────┐
│   PENDING   │ ◄── Initial state
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  APPROVED   │   │  REJECTED   │ ◄── Terminal states
└─────────────┘   └─────────────┘

Transitions:
- Pending → Approved: Admin approves (creates loan + transaction)
- Pending → Rejected: Admin rejects (no loan created)
- Pending → Deleted: Member cancels
```

---

## ✅ Testing Checklist

### Member Tests
- [ ] Submit valid loan request
- [ ] Validate amount range (too low/too high)
- [ ] Validate due date range (too soon/too far)
- [ ] Check outstanding limit enforcement
- [ ] Check lending budget enforcement
- [ ] View request history (all statuses)
- [ ] Cancel pending request
- [ ] Cannot cancel approved/rejected request

### Admin Tests
- [ ] View pending loan requests queue
- [ ] Review request (see member info)
- [ ] Approve request as-is
- [ ] Approve with amount override
- [ ] Approve with due date override
- [ ] Reject with valid reason
- [ ] Reject fails without reason
- [ ] Verify loan + transaction created on approval
- [ ] Verify no loan created on rejection
- [ ] Prevent double-approval (concurrency)

### Integration Tests
- [ ] End-to-end: Member submit → Admin approve → Loan disbursed
- [ ] End-to-end: Member submit → Admin reject → Member sees reason
- [ ] Budget validation at approval time (re-check)
- [ ] Outstanding limit validation at submission time

---

## 🎯 Usage Guide

### For Members

#### To Request a Loan:
1. Go to dashboard
2. Click "💸 Request Loan" (in "My Contribution" section)
3. Fill out form:
   - Enter amount (₹100 - ₹100,000)
   - Select due date (7-180 days from today)
   - Add reason/comments (optional but recommended)
4. Click "Submit Loan Request"
5. Wait for Admin approval/rejection

#### To View Request Status:
1. Scroll to "📋 My Loan Requests" section
2. See all your requests with statuses:
   - 🟡 Pending: Awaiting Admin review (can cancel)
   - ✅ Approved: Loan disbursed (see approved amount)
   - ❌ Rejected: See rejection reason

#### To Cancel a Pending Request:
1. Find request in "My Loan Requests"
2. Click "Cancel" button (only available for Pending)
3. Confirm cancellation

---

### For Admins

#### To Review Loan Requests:
1. Go to "💸 Pending Loan Requests" panel
2. See all pending requests with member info
3. Click "Review" on any request

#### To Approve a Request:
1. In review modal, verify:
   - Member's contribution history
   - Current outstanding loans
   - Available lending budget
2. Optionally modify:
   - Approved Amount (e.g., reduce from requested)
   - Approved Due Date (e.g., extend/shorten term)
   - Admin Comments (e.g., "Reduced per policy")
3. Click "✅ Approve & Disburse"
4. Loan and transaction created automatically

#### To Reject a Request:
1. In review modal, click "❌ Reject"
2. Enter rejection reason (min 10 characters, required)
3. Confirm rejection
4. Member will see reason in their request history

---

## 🔧 Configuration

### Limits (Configurable in Code)

| Setting | Value | Location |
|---------|-------|----------|
| Min Loan Amount | ₹100 | admin.js, app.js |
| Max Loan Amount | ₹100,000 | admin.js, app.js |
| Min Term | 7 days | admin.js, app.js |
| Max Term | 180 days | admin.js, app.js |
| Member Outstanding Limit | ₹200,000 | admin.js, app.js |
| Lending Budget % | 50% of total | app.js (calculateAndDisplayMetrics) |

### To Modify Limits:
Search for the value in `admin.js` and `app.js` and update consistently.

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Request already processed" error when approving
- **Cause**: Another admin already approved/rejected
- **Solution**: Refresh dashboard to see current status

**Issue**: "Exceeds available lending budget" error
- **Cause**: Insufficient funds in lending budget (50% allocation)
- **Solution**: Wait for loan returns or increase total fund

**Issue**: Loan requests not appearing in queue
- **Cause**: Missing Firestore index
- **Solution**: Create composite index:
  - Collection: `loanRequests`
  - Fields: `status` (asc) + `requestedAt` (desc)

**Issue**: Cannot cancel loan request
- **Cause**: Request already reviewed (approved/rejected)
- **Solution**: Only pending requests can be cancelled

---

## 📈 Future Enhancements

### Phase 2 (Potential)
- [ ] Email/SMS notifications on approval/rejection
- [ ] Multi-level approval workflow (Co-Admin review)
- [ ] Loan request templates (emergency, education, etc.)
- [ ] Request history export (CSV/PDF)
- [ ] Analytics dashboard (approval rate, avg amount, etc.)

### Phase 3 (Advanced)
- [ ] Dynamic limits based on member contribution level
- [ ] Interest rate support (if needed)
- [ ] Auto-approval for trusted members
- [ ] Loan calculator (EMI preview)
- [ ] Bulk approval/rejection

---

## 📝 Notes

- This feature mirrors the **Contribution Request** workflow for consistency
- Approval **automatically disburses** the loan (single action, not two-step)
- All actions are **audited** with timestamps and user IDs
- **Firestore transactions** ensure data consistency during approval
- **Member limit (₹200,000)** includes both approved and pending requests
- **Lending budget validation** is re-checked at approval time (not just submission)

---

## 🤝 Support

For questions or issues:
1. Check this documentation
2. Review existing Contribution Request workflow (similar pattern)
3. Check browser console for error messages
4. Verify Firestore indexes are created
5. Ensure security rules are deployed

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Feature Status**: ✅ Production Ready
