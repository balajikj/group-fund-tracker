// Dashboard Data Management and Calculations

let members = [];
let transactions = [];
let loans = [];
let pendingRequests = [];
let memberLoanRequests = [];
let pendingLoanRequests = [];

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Reset pagination to page 1 when loading data
        currentTransactionPage = 1;
        
        await Promise.all([
            loadMembers(),
            loadTransactions(),
            loadLoans(),
            loadPendingRequests(),
            loadMemberLoanRequests(),
            loadPendingLoanRequests()
        ]);
        
        calculateAndDisplayMetrics();
        displayPersonalContribution();
        displayLoansTable();
        displayTransactionsTable();
        displayMembersTable();
        displayPendingRequestsTable();
        displayMemberLoanRequestsTable();
        displayPendingLoanRequestsTable();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Error loading data. Please refresh the page.');
    }
}

// Load members from Firestore
async function loadMembers() {
    const snapshot = await db.collection('members').get();
    members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load transactions from Firestore
async function loadTransactions() {
    const snapshot = await db.collection('transactions')
        .orderBy('date', 'desc')
        .get();
    
    transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load loans from Firestore
async function loadLoans() {
    const snapshot = await db.collection('loans').get();
    loans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load pending contribution requests from Firestore
async function loadPendingRequests() {
    try {
        const snapshot = await db.collection('contributionRequests')
            .where('status', '==', 'Pending')
            .get();
        
        pendingRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        // Sort by requestedAt on client side to avoid index requirement
        .sort((a, b) => {
            if (!a.requestedAt || !b.requestedAt) return 0;
            return b.requestedAt.toMillis() - a.requestedAt.toMillis();
        });
    } catch (error) {
        console.error('Error loading pending requests:', error);
        pendingRequests = [];
    }
}

// Load member's loan requests from Firestore
async function loadMemberLoanRequests() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            memberLoanRequests = [];
            return;
        }
        
        const snapshot = await db.collection('loanRequests')
            .where('memberId', '==', currentUser.id)
            .get();
        
        memberLoanRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        // Sort by requestedAt descending (newest first)
        .sort((a, b) => {
            if (!a.requestedAt || !b.requestedAt) return 0;
            return b.requestedAt.toMillis() - a.requestedAt.toMillis();
        });
    } catch (error) {
        console.error('Error loading member loan requests:', error);
        memberLoanRequests = [];
    }
}

// Load pending loan requests from Firestore (Admin view)
async function loadPendingLoanRequests() {
    try {
        const snapshot = await db.collection('loanRequests')
            .where('status', '==', 'Pending')
            .get();
        
        pendingLoanRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        // Sort by requestedAt ascending (FIFO queue)
        .sort((a, b) => {
            if (!a.requestedAt || !b.requestedAt) return 0;
            return a.requestedAt.toMillis() - b.requestedAt.toMillis();
        });
    } catch (error) {
        console.error('Error loading pending loan requests:', error);
        pendingLoanRequests = [];
    }
}

// Calculate and display all financial metrics
function calculateAndDisplayMetrics() {
    // Calculate total fund: Sum of all contributions minus loans disbursed plus loan returns
    let totalFund = 0;
    
    transactions.forEach(txn => {
        if (txn.type.startsWith('Contribution')) {
            // All contribution types (Monthly, Quarterly, Initial)
            totalFund += txn.amount;
        } else if (txn.type === 'Loan-Disbursement') {
            totalFund -= Math.abs(txn.amount);
        } else if (txn.type === 'Loan-Return' || txn.type === 'Loan-PartialReturn') {
            totalFund += txn.amount;
        } else if (txn.type === 'Expense-Actual') {
            // Actual expenses impact the total fund
            totalFund += txn.amount; // Amount is already negative
        }
        // Expense-Audit is ignored in calculations (audit only)
    });
    
    // Calculate total outstanding loans (remaining balance only)
    const outstandingLoans = loans
        .filter(loan => loan.status === 'Outstanding')
        .reduce((sum, loan) => {
            const amountPaid = loan.amountPaid || 0;
            const remaining = loan.amount - amountPaid;
            return sum + remaining;
        }, 0);
    
    // Calculate total amount (current fund + outstanding loans)
    const totalAmount = totalFund + outstandingLoans;
    
    // Budget allocations (10% travel, 20% medical, 50% lending, 20% reserve) - based on total amount
    const travelBudget = totalAmount * 0.10;
    const medicalBudget = totalAmount * 0.20;
    const lendingBudget = totalAmount * 0.50;
    const reserveBudget = totalAmount * 0.20;
    
    // Display values
    document.getElementById('totalFund').textContent = formatCurrency(totalFund);
    document.getElementById('outstandingLoans').textContent = formatCurrency(outstandingLoans);
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    
    document.getElementById('travelBudget').textContent = formatCurrency(travelBudget);
    document.getElementById('medicalBudget').textContent = formatCurrency(medicalBudget);
    document.getElementById('lendingBudget').textContent = formatCurrency(lendingBudget);
    document.getElementById('reserveBudget').textContent = formatCurrency(reserveBudget);
}

// Display personal contribution
function displayPersonalContribution() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userMember = members.find(m => m.id === currentUser.id);
    const contribution = userMember ? userMember.lifetimeContribution : 0;
    
    document.getElementById('myContribution').textContent = formatCurrency(contribution);
}

// Display loans table
function displayLoansTable() {
    const tbody = document.getElementById('loansTableBody');
    const activeLoans = loans.filter(loan => loan.status === 'Outstanding');
    
    if (activeLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No active loans</td></tr>';
        return;
    }
    
    tbody.innerHTML = activeLoans.map(loan => {
        const borrower = members.find(m => m.id === loan.borrowerId);
        const borrowerName = borrower ? borrower.name : 'Unknown';
        
        const borrowDate = formatDate(loan.borrowDate);
        const dueDate = formatDate(loan.dueDate);
        const daysRemaining = calculateDaysRemaining(loan.dueDate);
        
        const amountPaid = loan.amountPaid || 0;
        const remaining = loan.amount - amountPaid;
        
        let daysClass = '';
        if (daysRemaining < 0) {
            daysClass = 'overdue';
        } else if (daysRemaining <= 7) {
            daysClass = 'due-soon';
        }
        
        return `
            <tr>
                <td>${borrowerName}</td>
                <td class="amount-negative">${formatCurrency(loan.amount)}</td>
                <td class="amount-positive">${formatCurrency(amountPaid)}</td>
                <td class="amount-warning">${formatCurrency(remaining)}</td>
                <td>${borrowDate}</td>
                <td>${dueDate}</td>
                <td class="${daysClass}">${formatDaysRemaining(daysRemaining)}</td>
            </tr>
        `;
    }).join('');
}
// Pagination state
let currentTransactionPage = 1;
const transactionsPerPage = 15;

// Display transactions table with pagination
function displayTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const pagination = document.getElementById('transactionPagination');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No transactions yet</td></tr>';
        pagination.classList.add('hidden');
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(transactions.length / transactionsPerPage);
    const startIndex = (currentTransactionPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    // Display transactions for current page
    tbody.innerHTML = paginatedTransactions.map(txn => {
        const member = members.find(m => m.id === txn.memberId);
        const memberName = txn.memberId ? (member ? member.name : 'Unknown') : 'N/A';
        
        const typeClass = getTransactionTypeClass(txn.type);
        
        // Determine amount class and prefix based on transaction type
        let amountClass, amountPrefix;
        if (txn.type === 'Loan-Disbursement' || txn.type.startsWith('Expense')) {
            amountClass = 'amount-negative';
            amountPrefix = '-';
        } else {
            amountClass = 'amount-positive';
            amountPrefix = '+';
        }
        
        const comments = txn.comments ? txn.comments : '-';
        
        return `
            <tr>
                <td>${formatDate(txn.date)}</td>
                <td>${memberName}</td>
                <td><span class="transaction-type ${typeClass}">${formatTransactionType(txn.type)}</span></td>
                <td class="${amountClass}">${amountPrefix}${formatCurrency(Math.abs(txn.amount))}</td>
                <td class="comment-cell">${comments}</td>
            </tr>
        `;
    }).join('');
    
    // Update pagination controls
    if (totalPages > 1) {
        pagination.classList.remove('hidden');
        document.getElementById('transactionPageInfo').textContent = `Page ${currentTransactionPage} of ${totalPages}`;
        document.getElementById('prevTransactionPage').disabled = currentTransactionPage === 1;
        document.getElementById('nextTransactionPage').disabled = currentTransactionPage === totalPages;
    } else {
        pagination.classList.add('hidden');
    }
}

// Initialize pagination event listeners
function initTransactionPagination() {
    document.getElementById('prevTransactionPage').addEventListener('click', () => {
        if (currentTransactionPage > 1) {
            currentTransactionPage--;
            displayTransactionsTable();
        }
    });
    
    document.getElementById('nextTransactionPage').addEventListener('click', () => {
        const totalPages = Math.ceil(transactions.length / transactionsPerPage);
        if (currentTransactionPage < totalPages) {
            currentTransactionPage++;
            displayTransactionsTable();
        }
    });
}

// Call init on page load
if (document.getElementById('prevTransactionPage')) {
    initTransactionPagination();
}

// Display members table
function displayMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No members yet</td></tr>';
        return;
    }
    
    // Sort members by name
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
    
    tbody.innerHTML = sortedMembers.map(member => {
        const roleClass = member.role ? member.role.toLowerCase().replace(/\s+/g, '-') : 'member';
        const contribution = member.lifetimeContribution || 0;
        
        return `
            <tr>
                <td>${member.name}</td>
                <td><span class="role-badge ${roleClass}">${member.role || 'Member'}</span></td>
                <td class="amount-positive">${formatCurrency(contribution)}</td>
            </tr>
        `;
    }).join('');
}

// Display Pending Contribution Requests Table
function displayPendingRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    
    if (!tbody) {
        return;
    }
    
    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No pending requests</td></tr>';
        return;
    }
    
    const isAdminUser = currentUserData && currentUserData.role === 'Admin';
    
    tbody.innerHTML = pendingRequests.map(request => {
        const dateStr = request.date ? request.date.toDate().toLocaleDateString('en-IN') : 'N/A';
        const requestedAtStr = request.requestedAt ? request.requestedAt.toDate().toLocaleDateString('en-IN') : 'N/A';
        
        // Show action buttons only for Admin users
        const actionButtons = isAdminUser 
            ? `<button class="btn-small btn-success" onclick="approveRequest('${request.id}')">Approve</button>
               <button class="btn-small btn-danger" onclick="rejectRequest('${request.id}')">Reject</button>`
            : `<span style="color: #64748b; font-size: 0.9rem;">Pending Admin Action</span>`;
        
        return `
            <tr>
                <td>${requestedAtStr}</td>
                <td>${request.memberName || 'Unknown'}</td>
                <td>${request.type.replace('Contribution-', '')}</td>
                <td class="amount-positive">${formatCurrency(request.amount)}</td>
                <td>${request.comments || '-'}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// Display Member's Loan Requests Table
function displayMemberLoanRequestsTable() {
    const tbody = document.getElementById('myLoanRequestsTableBody');
    
    if (!tbody) {
        return;
    }
    
    if (memberLoanRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No loan requests yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = memberLoanRequests.map(request => {
        const requestedAtStr = request.requestedAt ? request.requestedAt.toDate().toLocaleDateString('en-IN') : 'N/A';
        const dueDateStr = request.requestedDueDate ? request.requestedDueDate.toDate().toLocaleDateString('en-IN') : 'N/A';
        
        let statusBadge, decisionDetails, actionButtons;
        
        if (request.status === 'Pending') {
            statusBadge = '<span style="background: #fbbf24; color: #78350f; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">🟡 Pending</span>';
            decisionDetails = 'Awaiting Admin review';
            actionButtons = `<button class="btn-small btn-danger" onclick="cancelLoanRequest('${request.id}')">Cancel</button>`;
        } else if (request.status === 'Approved') {
            statusBadge = '<span style="background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">✅ Approved</span>';
            const approvedDate = request.reviewedAt ? request.reviewedAt.toDate().toLocaleDateString('en-IN') : 'N/A';
            decisionDetails = `₹${formatCurrency(request.approvedAmount)} on ${approvedDate}`;
            actionButtons = '-';
        } else if (request.status === 'Rejected') {
            statusBadge = '<span style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">❌ Rejected</span>';
            decisionDetails = request.rejectionReason || 'No reason provided';
            actionButtons = '-';
        }
        
        return `
            <tr>
                <td>${requestedAtStr}</td>
                <td class="amount-warning">${formatCurrency(request.requestedAmount)}</td>
                <td>${dueDateStr}</td>
                <td>${statusBadge}</td>
                <td>${decisionDetails}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// Display Pending Loan Requests Table (Admin View)
function displayPendingLoanRequestsTable() {
    const tbody = document.getElementById('pendingLoanRequestsTableBody');
    
    if (!tbody) {
        return;
    }
    
    if (pendingLoanRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No pending loan requests</td></tr>';
        return;
    }
    
    tbody.innerHTML = pendingLoanRequests.map(request => {
        const requestedAtStr = request.requestedAt ? request.requestedAt.toDate().toLocaleDateString('en-IN') : 'N/A';
        const dueDateStr = request.requestedDueDate ? request.requestedDueDate.toDate().toLocaleDateString('en-IN') : 'N/A';
        
        // Get member info
        const member = members.find(m => m.id === request.memberId);
        const memberContribution = member ? formatCurrency(member.lifetimeContribution || 0) : 'N/A';
        
        // Calculate member's outstanding loans
        const memberLoans = loans.filter(l => l.borrowerId === request.memberId && l.status === 'Outstanding');
        const totalOutstanding = memberLoans.reduce((sum, loan) => {
            const remaining = loan.amount - (loan.amountPaid || 0);
            return sum + remaining;
        }, 0);
        
        const memberInfo = `
            <div style="font-size: 0.85rem; line-height: 1.4;">
                <div>Contrib: ${memberContribution}</div>
                <div>Outstanding: ${formatCurrency(totalOutstanding)}</div>
            </div>
        `;
        
        return `
            <tr>
                <td>${requestedAtStr}</td>
                <td>${request.memberName || 'Unknown'}</td>
                <td class="amount-warning">${formatCurrency(request.requestedAmount)}</td>
                <td>${dueDateStr}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${request.comments || '-'}</td>
                <td>${memberInfo}</td>
                <td>
                    <button class="btn-small btn-success" onclick="reviewLoanRequest('${request.id}')">Review</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Approve Contribution Request
async function approveRequest(requestId) {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) {
        alert('Request not found.');
        return;
    }
    
    const adminComments = prompt(`Approve contribution request from ${request.memberName}?\n\nAmount: ${formatCurrency(request.amount)}\nType: ${request.type}\n\nAdd admin comments (optional):`);
    
    if (adminComments === null) {
        return; // User cancelled
    }
    
    try {
        // Create transaction
        const transactionData = {
            memberId: request.memberId,
            type: request.type,
            amount: request.amount,
            date: request.date,
            loanId: null,
            comments: request.comments || ''
        };
        
        await db.collection('transactions').add(transactionData);
        
        // Update member's lifetime contribution
        const memberRef = db.collection('members').doc(request.memberId);
        const memberDoc = await memberRef.get();
        const currentContribution = memberDoc.data().lifetimeContribution || 0;
        
        await memberRef.update({
            lifetimeContribution: currentContribution + request.amount
        });
        
        // Update request status
        await db.collection('contributionRequests').doc(requestId).update({
            status: 'Approved',
            adminComments: adminComments,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: window.getCurrentUser().id
        });
        
        // Refresh dashboard
        await refreshDashboard();
        showSuccessMessage('Contribution request approved successfully!');
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Failed to approve request. Please try again.');
    }
}

// Reject Contribution Request
async function rejectRequest(requestId) {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) {
        alert('Request not found.');
        return;
    }
    
    const adminComments = prompt(`Reject contribution request from ${request.memberName}?\n\nAmount: ${formatCurrency(request.amount)}\nType: ${request.type}\n\nAdd rejection reason (required):`);
    
    if (!adminComments || adminComments.trim() === '') {
        alert('Rejection reason is required.');
        return;
    }
    
    try {
        // Update request status
        await db.collection('contributionRequests').doc(requestId).update({
            status: 'Rejected',
            adminComments: adminComments.trim(),
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: window.getCurrentUser().id
        });
        
        // Refresh dashboard
        await refreshDashboard();
        showSuccessMessage('Contribution request rejected.');
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject request. Please try again.');
    }
}

// Helper: Format currency
function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Helper: Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper: Calculate days remaining until due date
function calculateDaysRemaining(dueDate) {
    if (!dueDate) return 0;
    
    let date;
    if (dueDate.toDate) {
        date = dueDate.toDate();
    } else if (dueDate instanceof Date) {
        date = dueDate;
    } else {
        date = new Date(dueDate);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Helper: Format days remaining
function formatDaysRemaining(days) {
    if (days < 0) {
        return `Overdue by ${Math.abs(days)} days`;
    } else if (days === 0) {
        return 'Due today';
    } else if (days === 1) {
        return '1 day';
    } else {
        return `${days} days`;
    }
}

// Helper: Get transaction type CSS class
function getTransactionTypeClass(type) {
    if (type.startsWith('Contribution')) {
        return 'type-contribution';
    } else if (type === 'Loan-Disbursement') {
        return 'type-loan';
    } else if (type === 'Loan-Return' || type === 'Loan-PartialReturn') {
        return 'type-return';
    } else if (type === 'Expense-Actual') {
        return 'type-expense-actual';
    } else if (type === 'Expense-Audit') {
        return 'type-expense-audit';
    }
    return '';
}

// Helper: Format transaction type for display
function formatTransactionType(type) {
    return type.replace(/-/g, ' ');
}

// Refresh dashboard data
async function refreshDashboard() {
    await loadDashboardData();
}

// Cancel Loan Request (Member)
async function cancelLoanRequest(requestId) {
    const request = memberLoanRequests.find(r => r.id === requestId);
    if (!request) {
        alert('Request not found.');
        return;
    }
    
    const confirmed = confirm(`Cancel loan request for ${formatCurrency(request.requestedAmount)}?`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        await db.collection('loanRequests').doc(requestId).delete();
        
        await refreshDashboard();
        showSuccessMessage('Loan request cancelled successfully.');
    } catch (error) {
        console.error('Error cancelling loan request:', error);
        alert('Failed to cancel request. Please try again.');
    }
}

// Review Loan Request (Admin) - Opens modal
async function reviewLoanRequest(requestId) {
    const request = pendingLoanRequests.find(r => r.id === requestId);
    if (!request) {
        alert('Request not found.');
        return;
    }
    
    // Call the function from admin.js
    if (typeof window.showReviewLoanRequestModal === 'function') {
        window.showReviewLoanRequestModal(request);
    }
}

// Approve Loan Request (Admin)
async function approveLoanRequest(requestId, approvedAmount, approvedDueDate, adminComments) {
    try {
        const currentUser = window.getCurrentUser();
        
        // Calculate current total amount and lending budget
        let totalFund = 0;
        transactions.forEach(txn => {
            if (txn.type.startsWith('Contribution')) {
                totalFund += txn.amount;
            } else if (txn.type === 'Loan-Disbursement') {
                totalFund -= Math.abs(txn.amount);
            } else if (txn.type === 'Loan-Return' || txn.type === 'Loan-PartialReturn') {
                totalFund += txn.amount;
            } else if (txn.type === 'Expense-Actual') {
                totalFund += txn.amount;
            }
        });
        
        const outstandingLoans = loans
            .filter(loan => loan.status === 'Outstanding')
            .reduce((sum, loan) => {
                const amountPaid = loan.amountPaid || 0;
                const remaining = loan.amount - amountPaid;
                return sum + remaining;
            }, 0);
        
        const totalAmount = totalFund + outstandingLoans;
        const lendingBudget = totalAmount * 0.50;
        
        // Use transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            const requestRef = db.collection('loanRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);
            
            if (!requestDoc.exists) {
                throw new Error('Request not found');
            }
            
            const requestData = requestDoc.data();
            
            if (requestData.status !== 'Pending') {
                throw new Error('Request already processed');
            }
            
            // Validate lending budget
            if (approvedAmount > lendingBudget) {
                throw new Error(`Exceeds available lending budget of ${formatCurrency(lendingBudget)}`);
            }
            
            // Validate approved amount
            if (approvedAmount < 100 || approvedAmount > 100000) {
                throw new Error('Approved amount must be between ₹100 and ₹100,000');
            }
            
            // Create loan
            const loanRef = db.collection('loans').doc();
            transaction.set(loanRef, {
                borrowerId: requestData.memberId,
                amount: approvedAmount,
                borrowDate: firebase.firestore.FieldValue.serverTimestamp(),
                dueDate: firebase.firestore.Timestamp.fromDate(new Date(approvedDueDate)),
                status: 'Outstanding',
                loanRequestId: requestId,
                amountPaid: 0
            });
            
            // Create transaction
            const txnRef = db.collection('transactions').doc();
            transaction.set(txnRef, {
                memberId: requestData.memberId,
                type: 'Loan-Disbursement',
                amount: -Math.abs(approvedAmount),
                date: firebase.firestore.FieldValue.serverTimestamp(),
                loanId: loanRef.id,
                comments: `Approved from request ${requestId}`
            });
            
            // Update request
            transaction.update(requestRef, {
                status: 'Approved',
                approvedAmount: approvedAmount,
                approvedDueDate: firebase.firestore.Timestamp.fromDate(new Date(approvedDueDate)),
                adminComments: adminComments || '',
                reviewedBy: currentUser.id,
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                loanId: loanRef.id,
                transactionId: txnRef.id
            });
        });
        
        await refreshDashboard();
        showSuccessMessage(`Loan approved and disbursed: ${formatCurrency(approvedAmount)}`);
        return { success: true };
    } catch (error) {
        console.error('Error approving loan request:', error);
        alert('Failed to approve loan: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Reject Loan Request (Admin)
async function rejectLoanRequest(requestId, rejectionReason) {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
        alert('Rejection reason must be at least 10 characters.');
        return { success: false };
    }
    
    try {
        const currentUser = window.getCurrentUser();
        
        await db.collection('loanRequests').doc(requestId).update({
            status: 'Rejected',
            rejectionReason: rejectionReason.trim(),
            reviewedBy: currentUser.id,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await refreshDashboard();
        showSuccessMessage('Loan request rejected.');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting loan request:', error);
        alert('Failed to reject request: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Export functions
window.loadDashboardData = loadDashboardData;
window.refreshDashboard = refreshDashboard;
window.members = members;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.cancelLoanRequest = cancelLoanRequest;
window.reviewLoanRequest = reviewLoanRequest;
window.approveLoanRequest = approveLoanRequest;
window.rejectLoanRequest = rejectLoanRequest;
