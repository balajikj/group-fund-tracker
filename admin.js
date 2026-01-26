// Admin Functions - Add Contributions, Loans, and Returns

// DOM Elements
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const addMemberBtn = document.getElementById('addMemberBtn');
const addLoanBtn = document.getElementById('addLoanBtn');
const recordReturnBtn = document.getElementById('recordReturnBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const requestContributionBtn = document.getElementById('requestContributionBtn');
const requestLoanBtn = document.getElementById('requestLoanBtn');

// Event Listeners
if (addMemberBtn) {
    addMemberBtn.addEventListener('click', showAddMemberForm);
}

if (addLoanBtn) {
    addLoanBtn.addEventListener('click', showAddLoanForm);
}

if (recordReturnBtn) {
    recordReturnBtn.addEventListener('click', showRecordReturnForm);
}

if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', showAddExpenseForm);
}

if (requestContributionBtn) {
    requestContributionBtn.addEventListener('click', showRequestContributionForm);
}

if (requestLoanBtn) {
    requestLoanBtn.addEventListener('click', showRequestLoanForm);
}

if (closeModal) {
    closeModal.addEventListener('click', hideModal);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});

// Show modal
function showModal() {
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

// Hide modal
function hideModal() {
    modal.classList.add('hidden');
    modal.classList.remove('active');
    modalBody.innerHTML = '';
}

// Show Add Member Form
function showAddMemberForm() {
    // Check if user is Admin
    if (!window.isAdmin()) {
        alert('Only Admin users can add new members.');
        return;
    }

    modalBody.innerHTML = `
        <h3>👤 Add New Member</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem; font-size: 0.9rem;">
            💡 <strong>For Admin:</strong> Create with email/password in Firebase Auth, use UID as UUID<br>
            💡 <strong>For Members:</strong> Auto-generate identifier for simple login
        </p>
        <form id="addMemberForm">
            <div class="form-group">
                <label for="memberName">Name *</label>
                <input type="text" id="memberName" required placeholder="Full Name">
            </div>
            
            <div class="form-group">
                <label for="memberRole">Role *</label>
                <select id="memberRole" required onchange="toggleUuidField()">
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                </select>
            </div>
            
            <div class="form-group" id="uuidField" style="display: none;">
                <label for="memberUuid">UUID (Firebase Auth UID) *</label>
                <input type="text" id="memberUuid" placeholder="e.g., abc123xyz (from Firebase Auth)">
                <small style="color: #64748b; display: block; margin-top: 5px;">
                    Create Firebase Auth user first, then paste the UID here
                </small>
            </div>
            
            <div class="form-group" id="identifierField" style="display: none;">
                <label for="memberIdentifier">Member Identifier *</label>
                <input type="text" id="memberIdentifier" readonly style="background: #f1f5f9; cursor: not-allowed;">
                <small style="color: #10b981; display: block; margin-top: 5px;">
                    ✅ Auto-generated - Share this with the member for login
                </small>
            </div>
            
            <div class="form-group">
                <label for="memberContribution">Lifetime Contribution (₹)</label>
                <input type="number" id="memberContribution" step="0.01" min="0" value="0" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Add Member</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Auto-generate identifier on page load
    generateMemberIdentifier();
    
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    showModal();
}

// Toggle UUID/Identifier fields based on role
window.toggleUuidField = function() {
    const role = document.getElementById('memberRole').value;
    const uuidField = document.getElementById('uuidField');
    const identifierField = document.getElementById('identifierField');
    const uuidInput = document.getElementById('memberUuid');
    
    if (role === 'Admin') {
        uuidField.style.display = 'block';
        identifierField.style.display = 'none';
        uuidInput.required = true;
    } else if (role === 'Member') {
        uuidField.style.display = 'none';
        identifierField.style.display = 'block';
        uuidInput.required = false;
        generateMemberIdentifier();
    } else {
        uuidField.style.display = 'none';
        identifierField.style.display = 'none';
        uuidInput.required = false;
    }
};

// Generate random member identifier
function generateMemberIdentifier() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let identifier = '';
    for (let i = 0; i < 8; i++) {
        identifier += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const identifierInput = document.getElementById('memberIdentifier');
    if (identifierInput) {
        identifierInput.value = identifier;
    }
    return identifier;
}

// Handle Add Member
async function handleAddMember(e) {
    e.preventDefault();
    
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;
    const lifetimeContribution = parseFloat(document.getElementById('memberContribution').value) || 0;
    
    try {
        let memberId;
        let identifier = null;
        
        if (role === 'Admin') {
            // Admin: Use Firebase Auth UID
            const uuid = document.getElementById('memberUuid').value.trim();
            
            if (!uuid || uuid.length === 0) {
                showFormError('UUID is required for Admin users.');
                return;
            }
            
            // Check if UUID already exists
            const existingDoc = await db.collection('members').doc(uuid).get();
            if (existingDoc.exists) {
                showFormError('A member with this UUID already exists.');
                return;
            }
            
            memberId = uuid;
            
        } else if (role === 'Member') {
            // Member: Generate random document ID and use identifier
            identifier = document.getElementById('memberIdentifier').value;
            
            // Check if identifier already exists
            const identifierCheck = await db.collection('members')
                .where('identifier', '==', identifier)
                .get();
            
            if (!identifierCheck.empty) {
                showFormError('Identifier already exists. Generating new one...');
                generateMemberIdentifier();
                return;
            }
            
            // Use random ID for document
            const memberRef = db.collection('members').doc();
            memberId = memberRef.id;
            
        } else {
            showFormError('Please select a role.');
            return;
        }
        
        // Create member document
        const memberData = {
            name: name,
            role: role,
            lifetimeContribution: lifetimeContribution,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add identifier for members
        if (identifier) {
            memberData.identifier = identifier;
        }
        
        await db.collection('members').doc(memberId).set(memberData);
        
        // If lifetime contribution > 0, create an initial transaction
        if (lifetimeContribution > 0) {
            await db.collection('transactions').add({
                memberId: memberId,
                type: 'Contribution-Initial',
                amount: lifetimeContribution,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                loanId: null
            });
        }
        
        // Refresh dashboard
        if (typeof refreshDashboard === 'function') {
            await refreshDashboard();
        }
        
        hideModal();
        
        // Show success message with identifier for members
        let message;
        if (role === 'Member') {
            message = `✅ Member "${name}" added successfully!\n\n🔑 Member Identifier: ${identifier}\n\n📋 Share this identifier with ${name} for login.`;
            alert(message);
        } else {
            message = lifetimeContribution > 0 
                ? `Admin "${name}" added with initial contribution of ₹${lifetimeContribution.toFixed(2)}`
                : `Admin "${name}" added successfully`;
            showSuccessMessage(message);
        }
    } catch (error) {
        console.error('Error adding member:', error);
        showFormError('Failed to add member: ' + error.message);
    }
}

// Show Request Contribution Form (for all users)
function showRequestContributionForm() {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
        alert('Unable to load user information. Please refresh the page.');
        return;
    }

    modalBody.innerHTML = `
        <h3>➕ Request Contribution</h3>
        <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.9rem;">
            Submit your contribution for Admin approval
        </p>
        <form id="requestContributionForm">
            <div class="form-group">
                <label for="contributionType">Contribution Type *</label>
                <select id="contributionType" required>
                    <option value="">Select Type</option>
                    <option value="Contribution-Monthly">Monthly</option>
                    <option value="Contribution-Quarterly">Quarterly</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="contributionAmount">Amount (₹) *</label>
                <input type="number" id="contributionAmount" step="0.01" min="0.01" required>
            </div>
            
            <div class="form-group">
                <label for="contributionDate">Date *</label>
                <input type="date" id="contributionDate" required>
            </div>
            
            <div class="form-group">
                <label for="contributionComments">Comments</label>
                <textarea id="contributionComments" rows="3" placeholder="Add any additional information (optional)"></textarea>
            </div>
            
            <button type="submit" class="btn btn-success">Submit Request</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default date to today
    document.getElementById('contributionDate').valueAsDate = new Date();
    
    document.getElementById('requestContributionForm').addEventListener('submit', handleRequestContribution);
    showModal();
}

// Handle Request Contribution
async function handleRequestContribution(e) {
    e.preventDefault();
    
    const currentUser = window.getCurrentUser();
    const type = document.getElementById('contributionType').value;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const dateInput = document.getElementById('contributionDate').value;
    const date = firebase.firestore.Timestamp.fromDate(new Date(dateInput));
    const comments = document.getElementById('contributionComments').value.trim();
    
    try {
        // Create contribution request
        await db.collection('contributionRequests').add({
            memberId: currentUser.id,
            memberName: currentUser.name,
            type: type,
            amount: amount,
            date: date,
            comments: comments || '',
            status: 'Pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Refresh dashboard
        if (typeof refreshDashboard === 'function') {
            await refreshDashboard();
        }
        
        hideModal();
        showSuccessMessage('Contribution request submitted successfully! Awaiting approval from Admin.');
    } catch (error) {
        console.error('Error submitting contribution request:', error);
        showFormError('Failed to submit request. Please try again.');
    }
}

// OLD: Show Add Contribution Form - REMOVED, keeping for reference if needed
function showAddContributionForm() {
    // This function is no longer used - contributions are now request-based
    alert('Please use the "Request Contribution" feature. Contributions require Admin approval.');
}

// OLD: Handle Add Contribution - REMOVED
function handleAddContribution(e) {
    e.preventDefault();
    alert('This feature has been replaced by the contribution request system.');
}

// Show Request Loan Form (for all users)
function showRequestLoanForm() {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
        alert('Unable to load user information. Please refresh the page.');
        return;
    }

    // Calculate member's current outstanding loans
    const memberLoans = window.members ? loans.filter(l => l.borrowerId === currentUser.id && l.status === 'Outstanding') : [];
    const totalOutstanding = memberLoans.reduce((sum, loan) => {
        const remaining = loan.amount - (loan.amountPaid || 0);
        return sum + remaining;
    }, 0);

    // Calculate available lending budget
    let totalFund = 0;
    const txns = window.transactions || [];
    txns.forEach(txn => {
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
    
    const loansData = window.loans || [];
    const outstandingLoans = loansData
        .filter(loan => loan.status === 'Outstanding')
        .reduce((sum, loan) => {
            const amountPaid = loan.amountPaid || 0;
            const remaining = loan.amount - amountPaid;
            return sum + remaining;
        }, 0);
    
    const totalAmount = totalFund + outstandingLoans;
    const lendingBudget = totalAmount * 0.50;

    modalBody.innerHTML = `
        <h3>💸 Request Loan</h3>
        <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.9rem;">
            Submit your loan request for Admin approval
        </p>
        <form id="requestLoanForm">
            <div class="form-group">
                <label for="loanAmount">Requested Amount (₹) *</label>
                <input type="number" id="loanAmount" step="0.01" min="100" max="100000" required placeholder="Min: ₹100, Max: ₹100,000">
            </div>
            
            <div class="form-group">
                <label for="loanDueDate">Requested Due Date *</label>
                <input type="date" id="loanDueDate" required>
                <small style="color: #64748b; display: block; margin-top: 5px;">
                    Must be 7-180 days from today
                </small>
            </div>
            
            <div class="form-group">
                <label for="loanComments">Reason/Comments (optional but recommended)</label>
                <textarea id="loanComments" rows="3" placeholder="e.g., Medical emergency, Education fees, etc." maxlength="500"></textarea>
            </div>
            
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.9rem;">
                <div style="margin-bottom: 0.5rem;">💡 <strong>Your Info:</strong></div>
                <div>• Current outstanding: <strong>${formatCurrency(totalOutstanding)}</strong></div>
                <div>• Available lending budget: <strong>${formatCurrency(lendingBudget)}</strong></div>
                <div style="color: #64748b; margin-top: 0.5rem;">
                    ⚠️ Total outstanding limit: ₹200,000
                </div>
            </div>
            
            <button type="submit" class="btn btn-warning">Submit Loan Request</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set min/max dates (7-180 days from today)
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 7);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 180);
    
    const dueDateInput = document.getElementById('loanDueDate');
    dueDateInput.min = minDate.toISOString().split('T')[0];
    dueDateInput.max = maxDate.toISOString().split('T')[0];
    
    // Set default to 30 days from today
    const defaultDate = new Date(today);
    defaultDate.setDate(defaultDate.getDate() + 30);
    dueDateInput.value = defaultDate.toISOString().split('T')[0];
    
    document.getElementById('requestLoanForm').addEventListener('submit', handleRequestLoan);
    showModal();
}

// Handle Request Loan
async function handleRequestLoan(e) {
    e.preventDefault();
    
    const currentUser = window.getCurrentUser();
    const requestedAmount = parseFloat(document.getElementById('loanAmount').value);
    const dueDateInput = document.getElementById('loanDueDate').value;
    const requestedDueDate = firebase.firestore.Timestamp.fromDate(new Date(dueDateInput));
    const comments = document.getElementById('loanComments').value.trim();
    
    try {
        // Validate amount range
        if (requestedAmount < 100 || requestedAmount > 100000) {
            showFormError('Amount must be between ₹100 and ₹100,000');
            return;
        }
        
        // Validate due date (7-180 days from today)
        const today = new Date();
        const dueDate = new Date(dueDateInput);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 7 || daysDiff > 180) {
            showFormError('Due date must be 7-180 days from today');
            return;
        }
        
        // Check member's total outstanding
        const memberLoans = loans.filter(l => l.borrowerId === currentUser.id && l.status === 'Outstanding');
        const totalOutstanding = memberLoans.reduce((sum, loan) => {
            const remaining = loan.amount - (loan.amountPaid || 0);
            return sum + remaining;
        }, 0);
        
        if (totalOutstanding + requestedAmount > 200000) {
            showFormError('Your total outstanding would exceed ₹200,000');
            return;
        }
        
        // Validate against lending budget
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
        
        if (requestedAmount > lendingBudget) {
            showFormError(`Requested amount exceeds available lending budget of ${formatCurrency(lendingBudget)}`);
            return;
        }
        
        // Create loan request
        await db.collection('loanRequests').add({
            memberId: currentUser.id,
            memberName: currentUser.name,
            requestedAmount: requestedAmount,
            requestedDueDate: requestedDueDate,
            comments: comments || '',
            status: 'Pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Refresh dashboard
        if (typeof refreshDashboard === 'function') {
            await refreshDashboard();
        }
        
        hideModal();
        showSuccessMessage('Loan request submitted successfully! Awaiting Admin approval.');
    } catch (error) {
        console.error('Error creating loan request:', error);
        showFormError('Failed to submit request. Please try again.');
    }
}

// Helper function for formatting currency (imported from app.js)
function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Show Review Loan Request Modal (Admin)
function showReviewLoanRequestModal(request) {
    if (!window.isAdmin()) {
        alert('Only Admin users can review loan requests.');
        return;
    }

    // Get member info
    const member = members.find(m => m.id === request.memberId);
    const memberContribution = member ? member.lifetimeContribution || 0 : 0;
    
    // Calculate member's outstanding loans
    const memberLoans = loans.filter(l => l.borrowerId === request.memberId && l.status === 'Outstanding');
    const totalOutstanding = memberLoans.reduce((sum, loan) => {
        const remaining = loan.amount - (loan.amountPaid || 0);
        return sum + remaining;
    }, 0);
    
    // Calculate available lending budget
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

    const requestedAtStr = request.requestedAt ? request.requestedAt.toDate().toLocaleDateString('en-IN') : 'N/A';
    const dueDateStr = request.requestedDueDate ? request.requestedDueDate.toDate().toLocaleDateString('en-IN') : 'N/A';
    const dueDateValue = request.requestedDueDate ? request.requestedDueDate.toDate().toISOString().split('T')[0] : '';

    modalBody.innerHTML = `
        <h3>💸 Review Loan Request</h3>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <div style="margin-bottom: 0.5rem;"><strong>Member:</strong> ${request.memberName} (#${request.memberId})</div>
            <div style="margin-bottom: 0.5rem;"><strong>Lifetime Contribution:</strong> ${formatCurrency(memberContribution)}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Current Outstanding:</strong> ${formatCurrency(totalOutstanding)}</div>
            <div><strong>Requested On:</strong> ${requestedAtStr}</div>
        </div>
        
        <div style="border-left: 4px solid #fbbf24; padding-left: 1rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem;">REQUESTED:</div>
            <div style="margin-bottom: 0.5rem;"><strong>Amount:</strong> ${formatCurrency(request.requestedAmount)}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Due Date:</strong> ${dueDateStr}</div>
            <div><strong>Reason:</strong> "${request.comments || 'No reason provided'}"</div>
        </div>
        
        <form id="reviewLoanForm">
            <h4 style="margin-bottom: 1rem;">🔧 Admin Overrides (optional)</h4>
            
            <div class="form-group">
                <label for="approvedAmount">Approved Amount (₹)</label>
                <input type="number" id="approvedAmount" step="0.01" min="100" max="100000" value="${request.requestedAmount}" placeholder="Leave as-is or modify">
            </div>
            
            <div class="form-group">
                <label for="approvedDueDate">Approved Due Date</label>
                <input type="date" id="approvedDueDate" value="${dueDateValue}">
            </div>
            
            <div class="form-group">
                <label for="adminComments">Admin Comments (optional)</label>
                <textarea id="adminComments" rows="2" placeholder="e.g., Approved as requested, Reduced amount per policy"></textarea>
            </div>
            
            <div style="background: #ecfdf5; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.9rem;">
                <div>💡 <strong>Available Lending Budget:</strong> ${formatCurrency(lendingBudget)}</div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                <button type="button" id="approveBtn" class="btn btn-success" style="flex: 1;">✅ Approve & Disburse</button>
                <button type="button" id="rejectBtn" class="btn btn-danger" style="flex: 1;">❌ Reject</button>
                <button type="button" onclick="hideModal()" class="btn btn-secondary">Cancel</button>
            </div>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set up approve button handler
    document.getElementById('approveBtn').addEventListener('click', async () => {
        const approvedAmount = parseFloat(document.getElementById('approvedAmount').value);
        const approvedDueDate = document.getElementById('approvedDueDate').value;
        const adminComments = document.getElementById('adminComments').value.trim();
        
        if (!approvedAmount || approvedAmount <= 0) {
            showFormError('Please enter a valid approved amount');
            return;
        }
        
        if (!approvedDueDate) {
            showFormError('Please select an approved due date');
            return;
        }
        
        // Disable button to prevent double-click
        const approveBtn = document.getElementById('approveBtn');
        approveBtn.disabled = true;
        approveBtn.textContent = 'Processing...';
        
        const result = await window.approveLoanRequest(request.id, approvedAmount, approvedDueDate, adminComments);
        
        if (result && result.success) {
            hideModal();
        } else {
            approveBtn.disabled = false;
            approveBtn.textContent = '✅ Approve & Disburse';
        }
    });
    
    // Set up reject button handler
    document.getElementById('rejectBtn').addEventListener('click', async () => {
        const rejectionReason = prompt('Rejection reason (required, min 10 characters):');
        
        if (!rejectionReason || rejectionReason.trim().length < 10) {
            alert('Rejection reason must be at least 10 characters.');
            return;
        }
        
        // Disable button to prevent double-click
        const rejectBtn = document.getElementById('rejectBtn');
        rejectBtn.disabled = true;
        rejectBtn.textContent = 'Processing...';
        
        const result = await window.rejectLoanRequest(request.id, rejectionReason);
        
        if (result && result.success) {
            hideModal();
        } else {
            rejectBtn.disabled = false;
            rejectBtn.textContent = '❌ Reject';
        }
    });
    
    showModal();
}

// Export function for use in app.js
window.showReviewLoanRequestModal = showReviewLoanRequestModal;

// Show Add Loan Form
function showAddLoanForm() {
    // Check if user is Admin
    if (!window.isAdminOrCoAdmin()) {
        alert('Access Denied: Only Admin users can disburse loans.');
        return;
    }
    
    modalBody.innerHTML = `
        <h3>💸 Disburse Loan</h3>
        <form id="addLoanForm">
            <div class="form-group">
                <label for="loanBorrower">Borrower *</label>
                <select id="loanBorrower" required>
                    <option value="">Select Member</option>
                    ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="loanAmount">Loan Amount (₹) *</label>
                <input type="number" id="loanAmount" step="0.01" min="0.01" required>
            </div>
            
            <div class="form-group">
                <label for="loanBorrowDate">Borrow Date *</label>
                <input type="date" id="loanBorrowDate" required>
            </div>
            
            <div class="form-group">
                <label for="loanDueDate">Due Date *</label>
                <input type="date" id="loanDueDate" required>
            </div>
            
            <button type="submit" class="btn btn-warning">Disburse Loan</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default dates
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
    
    document.getElementById('loanBorrowDate').valueAsDate = today;
    document.getElementById('loanDueDate').valueAsDate = dueDate;
    
    document.getElementById('addLoanForm').addEventListener('submit', handleAddLoan);
    showModal();
}

// Handle Add Loan
async function handleAddLoan(e) {
    e.preventDefault();
    
    const borrowerId = document.getElementById('loanBorrower').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const borrowDateInput = document.getElementById('loanBorrowDate').value;
    const dueDateInput = document.getElementById('loanDueDate').value;
    
    const borrowDate = firebase.firestore.Timestamp.fromDate(new Date(borrowDateInput));
    const dueDate = firebase.firestore.Timestamp.fromDate(new Date(dueDateInput));
    
    // Validate due date is after borrow date
    if (new Date(dueDateInput) <= new Date(borrowDateInput)) {
        showFormError('Due date must be after borrow date.');
        return;
    }
    
    try {
        // Create loan record
        const loanRef = await db.collection('loans').add({
            borrowerId,
            amount,
            borrowDate,
            dueDate,
            status: 'Outstanding'
        });
        
        // Add transaction for loan disbursement
        await db.collection('transactions').add({
            memberId: borrowerId,
            type: 'Loan-Disbursement',
            amount: -Math.abs(amount), // Negative to indicate money going out
            date: borrowDate,
            loanId: loanRef.id
        });
        
        // Refresh dashboard
        await refreshDashboard();
        
        hideModal();
        showSuccessMessage('Loan disbursed successfully!');
    } catch (error) {
        console.error('Error disbursing loan:', error);
        showFormError('Failed to disburse loan. Please try again.');
    }
}

// Show Record Return Form
function showRecordReturnForm() {
    // Check if user is Admin
    if (!window.isAdminOrCoAdmin()) {
        alert('Access Denied: Only Admin users can record loan returns.');
        return;
    }
    
    // Get only outstanding loans
    const outstandingLoans = loans.filter(loan => loan.status === 'Outstanding');
    
    if (outstandingLoans.length === 0) {
        alert('No outstanding loans to record returns for.');
        return;
    }
    
    modalBody.innerHTML = `
        <h3>✅ Record Loan Return</h3>
        <form id="recordReturnForm">
            <div class="form-group">
                <label for="returnLoan">Select Loan *</label>
                <select id="returnLoan" required>
                    <option value="">Select Loan</option>
                    ${outstandingLoans.map(loan => {
                        const borrower = members.find(m => m.id === loan.borrowerId);
                        const borrowerName = borrower ? borrower.name : 'Unknown';
                        const amountPaid = loan.amountPaid || 0;
                        const remaining = loan.amount - amountPaid;
                        return `<option value="${loan.id}" data-amount="${loan.amount}" data-paid="${amountPaid}">${borrowerName} - ₹${loan.amount.toFixed(2)} (Paid: ₹${amountPaid.toFixed(2)}, Remaining: ₹${remaining.toFixed(2)})</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="form-group checkbox-group">
                <label>
                    <input type="checkbox" id="isPartialReturn">
                    <span>Partial Payment</span>
                </label>
            </div>
            
            <div class="form-group" id="partialAmountGroup" style="display: none;">
                <label for="partialAmount">Partial Return Amount (₹) *</label>
                <input type="number" id="partialAmount" step="0.01" min="0.01">
                <small id="remainingAmount" style="color: #64748b; display: block; margin-top: 5px;"></small>
            </div>
            
            <div class="form-group">
                <label for="returnDate">Return Date *</label>
                <input type="date" id="returnDate" required>
            </div>
            
            <div class="form-group">
                <label for="returnComments">Comments</label>
                <textarea id="returnComments" rows="3" placeholder="Add notes about this return (optional)"></textarea>
            </div>
            
            <button type="submit" class="btn btn-info">Record Return</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default date to today
    document.getElementById('returnDate').valueAsDate = new Date();
    
    // Handle partial payment checkbox
    const partialCheckbox = document.getElementById('isPartialReturn');
    const partialAmountGroup = document.getElementById('partialAmountGroup');
    const partialAmountInput = document.getElementById('partialAmount');
    const loanSelect = document.getElementById('returnLoan');
    const remainingAmountText = document.getElementById('remainingAmount');
    
    partialCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            partialAmountGroup.style.display = 'block';
            partialAmountInput.required = true;
            updateRemainingAmount();
        } else {
            partialAmountGroup.style.display = 'none';
            partialAmountInput.required = false;
            partialAmountInput.value = '';
        }
    });
    
    loanSelect.addEventListener('change', updateRemainingAmount);
    
    function updateRemainingAmount() {
        const selectedOption = loanSelect.options[loanSelect.selectedIndex];
        if (selectedOption && selectedOption.value && partialCheckbox.checked) {
            const totalAmount = parseFloat(selectedOption.dataset.amount);
            const amountPaid = parseFloat(selectedOption.dataset.paid);
            const remaining = totalAmount - amountPaid;
            remainingAmountText.textContent = `Remaining balance: ₹${remaining.toFixed(2)}`;
            partialAmountInput.max = remaining;
        }
    }
    
    document.getElementById('recordReturnForm').addEventListener('submit', handleRecordReturn);
    showModal();
}

// Handle Record Return
async function handleRecordReturn(e) {
    e.preventDefault();
    
    const loanId = document.getElementById('returnLoan').value;
    const returnDateInput = document.getElementById('returnDate').value;
    const returnDate = firebase.firestore.Timestamp.fromDate(new Date(returnDateInput));
    const isPartial = document.getElementById('isPartialReturn').checked;
    const comments = document.getElementById('returnComments').value.trim();
    
    try {
        // Get loan details
        const loanDoc = await db.collection('loans').doc(loanId).get();
        const loan = loanDoc.data();
        const currentAmountPaid = loan.amountPaid || 0;
        
        let returnAmount;
        let newStatus;
        let transactionType;
        
        if (isPartial) {
            // Partial payment
            returnAmount = parseFloat(document.getElementById('partialAmount').value);
            const remainingBalance = loan.amount - currentAmountPaid; // Remaining BEFORE this payment
            const newAmountPaid = currentAmountPaid + returnAmount;
            
            // Validate partial amount
            if (returnAmount <= 0) {
                showFormError('Partial amount must be greater than 0.');
                return;
            }
            
            if (returnAmount > remainingBalance) {
                showFormError(`Partial amount cannot exceed remaining balance of ₹${remainingBalance.toFixed(2)}.`);
                return;
            }
            
            // Update loan with partial payment
            await db.collection('loans').doc(loanId).update({
                amountPaid: newAmountPaid,
                status: newAmountPaid >= loan.amount ? 'Returned' : 'Outstanding'
            });
            
            transactionType = 'Loan-PartialReturn';
            newStatus = newAmountPaid >= loan.amount ? 'Returned' : 'Outstanding';
        } else {
            // Full payment
            returnAmount = loan.amount - currentAmountPaid;
            
            // Update loan status to returned
            await db.collection('loans').doc(loanId).update({
                amountPaid: loan.amount,
                status: 'Returned'
            });
            
            transactionType = 'Loan-Return';
            newStatus = 'Returned';
        }
        
        // Add transaction for loan return (partial or full)
        const transactionData = {
            memberId: loan.borrowerId,
            type: transactionType,
            amount: returnAmount,
            date: returnDate,
            loanId: loanId
        };
        
        // Add comments if provided
        if (comments) {
            transactionData.comments = comments;
        }
        
        await db.collection('transactions').add(transactionData);
        
        // Refresh dashboard
        await refreshDashboard();
        
        hideModal();
        const message = isPartial 
            ? `Partial return of ₹${returnAmount.toFixed(2)} recorded successfully! Loan status: ${newStatus}`
            : 'Loan return recorded successfully!';
        showSuccessMessage(message);
    } catch (error) {
        console.error('Error recording loan return:', error);
        showFormError('Failed to record loan return. Please try again.');
    }
}

// Show form error message
function showFormError(message) {
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.classList.add('show');
        formMessage.classList.remove('success-message');
        formMessage.classList.add('error-message');
    }
}

// Show success message (toast-like notification)
function showSuccessMessage(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '10000';
    successDiv.style.padding = '1rem 2rem';
    successDiv.style.borderRadius = '8px';
    successDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show Add Expense Form
function showAddExpenseForm() {
    // Check if user is Admin
    if (!window.isAdminOrCoAdmin()) {
        alert('Access Denied: Only Admin users can add expenses.');
        return;
    }

    modalBody.innerHTML = `
        <h3>💰 Add Expense</h3>
        <form id="addExpenseForm">
            <div class="form-group">
                <label for="expenseType">Expense Type *</label>
                <select id="expenseType" required>
                    <option value="">Select Type</option>
                    <option value="Expense-Actual">Actual Expense (Impacts Total Amount)</option>
                    <option value="Expense-Audit">Audit Only (For Record Keeping)</option>
                </select>
                <small style="color: #64748b; display: block; margin-top: 5px;">
                    <strong>Actual:</strong> Deducts from total fund & splits cost equally among all members<br>
                    <strong>Audit:</strong> Record only, no deduction or member impact
                </small>
            </div>
            
            <div class="form-group">
                <label for="expenseCategory">Category *</label>
                <select id="expenseCategory" required>
                    <option value="">Select Category</option>
                    <option value="Travel">🚗 Travel</option>
                    <option value="Medical">🏥 Medical Emergency</option>
                    <option value="Administrative">📋 Administrative</option>
                    <option value="Maintenance">🔧 Maintenance</option>
                    <option value="Event">🎉 Event</option>
                    <option value="Other">📌 Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="expenseAmount">Amount (₹) *</label>
                <input type="number" id="expenseAmount" step="0.01" min="0.01" required>
            </div>
            
            <div class="form-group">
                <label for="expenseDate">Date *</label>
                <input type="date" id="expenseDate" required>
            </div>
            
            <div class="form-group">
                <label for="expenseDescription">Description *</label>
                <textarea id="expenseDescription" rows="3" required placeholder="Provide details about this expense"></textarea>
            </div>
            
            <button type="submit" class="btn btn-danger">Add Expense</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default date to today
    document.getElementById('expenseDate').valueAsDate = new Date();
    
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    showModal();
}

// Handle Add Expense
async function handleAddExpense(e) {
    e.preventDefault();
    
    const expenseType = document.getElementById('expenseType').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const dateInput = document.getElementById('expenseDate').value;
    const date = firebase.firestore.Timestamp.fromDate(new Date(dateInput));
    const description = document.getElementById('expenseDescription').value.trim();
    
    try {
        // If it's an actual expense, split equally among all members and deduct from lifetime contributions
        if (expenseType === 'Expense-Actual') {
            // Fetch all members from database to ensure we have fresh data
            const membersSnapshot = await db.collection('members').get();
            const allMembers = membersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Total members found:', allMembers.length);
            console.log('Members before expense:', allMembers.map(m => ({ name: m.name, contribution: m.lifetimeContribution })));
            
            if (allMembers.length === 0) {
                showFormError('No members found. Cannot split expense.');
                return;
            }
            
            // Calculate per-member share
            const perMemberShare = amount / allMembers.length;
            console.log(`Per member share: ₹${perMemberShare.toFixed(2)} (Total: ₹${amount.toFixed(2)} / ${allMembers.length} members)`);
            
            // Create a batch for all updates
            const batch = db.batch();
            
            // Update each member's lifetime contribution
            allMembers.forEach(member => {
                const memberRef = db.collection('members').doc(member.id);
                const currentContribution = member.lifetimeContribution || 0;
                const newContribution = currentContribution - perMemberShare;
                
                console.log(`${member.name}: ₹${currentContribution.toFixed(2)} - ₹${perMemberShare.toFixed(2)} = ₹${newContribution.toFixed(2)}`);
                
                batch.update(memberRef, {
                    lifetimeContribution: newContribution
                });
            });
            
            // Add the transaction to the batch
            const transactionRef = db.collection('transactions').doc();
            batch.set(transactionRef, {
                memberId: null, // Expenses are not tied to a specific member
                type: expenseType,
                amount: -Math.abs(amount), // Negative to indicate money going out
                date: date,
                loanId: null,
                comments: `[${category}] ${description}`
            });
            
            // Commit all updates at once (member updates + transaction)
            await batch.commit();
            
            console.log(`Expense of ₹${amount.toFixed(2)} split equally: ₹${perMemberShare.toFixed(2)} per member across ${allMembers.length} members`);
            
            // Refresh dashboard
            await refreshDashboard();
            
            hideModal();
            showSuccessMessage(`Actual Expense of ₹${amount.toFixed(2)} recorded! Each member's share: ₹${perMemberShare.toFixed(2)}`);
        } else {
            // Audit expense - just create transaction without affecting members
            await db.collection('transactions').add({
                memberId: null,
                type: expenseType,
                amount: -Math.abs(amount),
                date: date,
                loanId: null,
                comments: `[${category}] ${description}`
            });
            
            // Refresh dashboard
            await refreshDashboard();
            
            hideModal();
            showSuccessMessage(`Audit-Only Expense of ₹${amount.toFixed(2)} recorded successfully!`);
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showFormError('Failed to add expense. Please try again.');
    }
}
