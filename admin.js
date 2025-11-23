// Admin Functions - Add Contributions, Loans, and Returns

// DOM Elements
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const addContributionBtn = document.getElementById('addContributionBtn');
const addLoanBtn = document.getElementById('addLoanBtn');
const recordReturnBtn = document.getElementById('recordReturnBtn');

// Event Listeners
if (addContributionBtn) {
    addContributionBtn.addEventListener('click', showAddContributionForm);
}

if (addLoanBtn) {
    addLoanBtn.addEventListener('click', showAddLoanForm);
}

if (recordReturnBtn) {
    recordReturnBtn.addEventListener('click', showRecordReturnForm);
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

// Show Add Contribution Form
function showAddContributionForm() {
    modalBody.innerHTML = `
        <h3>➕ Add Contribution</h3>
        <form id="addContributionForm">
            <div class="form-group">
                <label for="contributionMember">Member *</label>
                <select id="contributionMember" required>
                    <option value="">Select Member</option>
                    ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="contributionType">Contribution Type *</label>
                <select id="contributionType" required>
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
            
            <button type="submit" class="btn btn-success">Add Contribution</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default date to today
    document.getElementById('contributionDate').valueAsDate = new Date();
    
    document.getElementById('addContributionForm').addEventListener('submit', handleAddContribution);
    showModal();
}

// Handle Add Contribution
async function handleAddContribution(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('contributionMember').value;
    const type = document.getElementById('contributionType').value;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const dateInput = document.getElementById('contributionDate').value;
    const date = firebase.firestore.Timestamp.fromDate(new Date(dateInput));
    
    try {
        // Add transaction
        await db.collection('transactions').add({
            memberId,
            type,
            amount,
            date,
            loanId: null
        });
        
        // Update member's lifetime contribution
        const memberRef = db.collection('members').doc(memberId);
        const memberDoc = await memberRef.get();
        const currentContribution = memberDoc.data().lifetimeContribution || 0;
        
        await memberRef.update({
            lifetimeContribution: currentContribution + amount
        });
        
        // Refresh dashboard
        await refreshDashboard();
        
        hideModal();
        showSuccessMessage('Contribution added successfully!');
    } catch (error) {
        console.error('Error adding contribution:', error);
        showFormError('Failed to add contribution. Please try again.');
    }
}

// Show Add Loan Form
function showAddLoanForm() {
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
                        return `<option value="${loan.id}">${borrowerName} - $${loan.amount.toFixed(2)}</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="returnDate">Return Date *</label>
                <input type="date" id="returnDate" required>
            </div>
            
            <button type="submit" class="btn btn-info">Record Return</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    // Set default date to today
    document.getElementById('returnDate').valueAsDate = new Date();
    
    document.getElementById('recordReturnForm').addEventListener('submit', handleRecordReturn);
    showModal();
}

// Handle Record Return
async function handleRecordReturn(e) {
    e.preventDefault();
    
    const loanId = document.getElementById('returnLoan').value;
    const returnDateInput = document.getElementById('returnDate').value;
    const returnDate = firebase.firestore.Timestamp.fromDate(new Date(returnDateInput));
    
    try {
        // Get loan details
        const loanDoc = await db.collection('loans').doc(loanId).get();
        const loan = loanDoc.data();
        
        // Update loan status
        await db.collection('loans').doc(loanId).update({
            status: 'Returned'
        });
        
        // Add transaction for loan return
        await db.collection('transactions').add({
            memberId: loan.borrowerId,
            type: 'Loan-Return',
            amount: loan.amount,
            date: returnDate,
            loanId: loanId
        });
        
        // Refresh dashboard
        await refreshDashboard();
        
        hideModal();
        showSuccessMessage('Loan return recorded successfully!');
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
