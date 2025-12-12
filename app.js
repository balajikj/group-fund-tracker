// Dashboard Data Management and Calculations

let members = [];
let transactions = [];
let loans = [];

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadMembers(),
            loadTransactions(),
            loadLoans()
        ]);
        
        calculateAndDisplayMetrics();
        displayPersonalContribution();
        displayLoansTable();
        displayTransactionsTable();
        displayMembersTable();
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
        } else if (txn.type === 'Loan-Return') {
            totalFund += txn.amount;
        }
    });
    
    // Calculate total outstanding loans
    const outstandingLoans = loans
        .filter(loan => loan.status === 'Outstanding')
        .reduce((sum, loan) => sum + loan.amount, 0);
    
    // Calculate total amount (current fund + outstanding loans)
    const totalAmount = totalFund + outstandingLoans;
    
    // Budget allocations (10% travel, 20% medical, 50% lending, 20% reserve) - based on current total fund
    const travelBudget = totalFund * 0.10;
    const medicalBudget = totalFund * 0.20;
    const lendingBudget = totalFund * 0.50;
    const reserveBudget = totalFund * 0.20;
    
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
// Display transactions table
function displayTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No transactions yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(txn => {
        const member = members.find(m => m.id === txn.memberId);
        const memberName = member ? member.name : 'Unknown';
        
        const typeClass = getTransactionTypeClass(txn.type);
        const amountClass = txn.type === 'Loan-Disbursement' ? 'amount-negative' : 'amount-positive';
        const amountPrefix = txn.type === 'Loan-Disbursement' ? '-' : '+';
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

// Export functions
window.loadDashboardData = loadDashboardData;
window.refreshDashboard = refreshDashboard;
window.members = members;
