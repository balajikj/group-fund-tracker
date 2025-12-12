// Admin Functions - Add Contributions, Loans, and Returns

// DOM Elements
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const addMemberBtn = document.getElementById('addMemberBtn');
const addContributionBtn = document.getElementById('addContributionBtn');
const addLoanBtn = document.getElementById('addLoanBtn');
const recordReturnBtn = document.getElementById('recordReturnBtn');

// Event Listeners
if (addMemberBtn) {
    addMemberBtn.addEventListener('click', showAddMemberForm);
}

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
            ⚠️ <strong>Note:</strong> Create Firebase Authentication user first, then use that user's UID as the UUID here.
        </p>
        <form id="addMemberForm">
            <div class="form-group">
                <label for="memberUuid">UUID (Firebase Auth UID) *</label>
                <input type="text" id="memberUuid" required placeholder="e.g., abc123xyz (Firebase Auth UID)">
                <small style="color: #64748b; display: block; margin-top: 5px;">
                    This will be used as the document ID. Get this from Firebase Authentication.
                </small>
            </div>
            
            <div class="form-group">
                <label for="memberName">Name *</label>
                <input type="text" id="memberName" required placeholder="Full Name">
            </div>
            
            <div class="form-group">
                <label for="memberRole">Role *</label>
                <select id="memberRole" required>
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="CoAdmin">CoAdmin</option>
                    <option value="Member">Member</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="memberContribution">Lifetime Contribution (₹)</label>
                <input type="number" id="memberContribution" step="0.01" min="0" value="0" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Add Member</button>
            <div id="formMessage" class="error-message"></div>
        </form>
    `;
    
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    showModal();
}

// Handle Add Member
async function handleAddMember(e) {
    e.preventDefault();
    
    const uuid = document.getElementById('memberUuid').value.trim();
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;
    const lifetimeContribution = parseFloat(document.getElementById('memberContribution').value) || 0;
    
    try {
        // Validate UUID is not empty
        if (!uuid || uuid.length === 0) {
            showFormError('UUID is required.');
            return;
        }
        
        // Check if UUID already exists in members collection
        const existingDoc = await db.collection('members').doc(uuid).get();
        if (existingDoc.exists) {
            showFormError('A member with this UUID already exists. Please use a different UUID (Firebase Auth UID).');
            return;
        }
        
        // Create member document in Firestore with UUID as document ID
        await db.collection('members').doc(uuid).set({
            name: name,
            role: role,
            lifetimeContribution: lifetimeContribution,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // If lifetime contribution > 0, create an initial transaction
        if (lifetimeContribution > 0) {
            await db.collection('transactions').add({
                memberId: uuid,
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
        const message = lifetimeContribution > 0 
            ? `Member "${name}" added successfully with initial contribution of ₹${lifetimeContribution.toFixed(2)}`
            : `Member "${name}" added successfully with UUID: ${uuid}`;
        showSuccessMessage(message);
    } catch (error) {
        console.error('Error adding member:', error);
        showFormError('Failed to add member: ' + error.message);
    }
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
            
            <div class="form-group">
                <label for="contributionComments">Comments</label>
                <textarea id="contributionComments" rows="3" placeholder="Add any additional information or notes (optional)"></textarea>
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
    const comments = document.getElementById('contributionComments').value.trim();
    
    try {
        // Add transaction
        const transactionData = {
            memberId,
            type,
            amount,
            date,
            loanId: null
        };
        
        // Add comments if provided
        if (comments) {
            transactionData.comments = comments;
        }
        
        await db.collection('transactions').add(transactionData);
        
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
