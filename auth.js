// Authentication Module
let currentUser = null;
let currentUserData = null;
let isAdminLogin = false; // Flag to track admin login attempts

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const adminLoginForm = document.getElementById('adminLoginForm');
const memberLoginForm = document.getElementById('memberLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const memberLoginError = document.getElementById('memberLoginError');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

// Switch between login tabs
window.showLoginTab = function(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.login-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    if (tabName === 'admin') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        adminLoginForm.classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        memberLoginForm.classList.add('active');
    }
};

// Initialize authentication state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData(user.uid);
        showDashboard();
    } else {
        currentUser = null;
        currentUserData = null;
        showLogin();
    }
});

// Admin Login form submission
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        // Set flag to indicate admin login attempt
        isAdminLogin = true;
        
        // Sign in with email/password
        await auth.signInWithEmailAndPassword(email, password);
        
        // Auth state listener will handle the rest
        adminLoginError.classList.remove('show');
    } catch (error) {
        isAdminLogin = false;
        console.error('Admin login error:', error);
        adminLoginError.textContent = getErrorMessage(error.code);
        adminLoginError.classList.add('show');
    }
});

// Member Login form submission
memberLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('memberIdentifier').value.trim().toUpperCase();
    
    if (!identifier) {
        memberLoginError.textContent = 'Please enter your identifier';
        memberLoginError.classList.add('show');
        return;
    }
    
    try {
        // Find member by identifier BEFORE signing in
        const membersSnapshot = await db.collection('members')
            .where('identifier', '==', identifier)
            .limit(1)
            .get();
        
        if (membersSnapshot.empty) {
            memberLoginError.textContent = 'Invalid identifier. Please check and try again.';
            memberLoginError.classList.add('show');
            return;
        }
        
        const memberDoc = membersSnapshot.docs[0];
        const memberData = memberDoc.data();
        
        // Check if member (not admin)
        if (memberData.role === 'Admin') {
            memberLoginError.textContent = 'Admin users must use Admin Login.';
            memberLoginError.classList.add('show');
            return;
        }
        
        // Store member info in session BEFORE signing in
        // This ensures it's available when auth state listener fires
        sessionStorage.setItem('memberLoginId', memberDoc.id);
        sessionStorage.setItem('memberLoginIdentifier', identifier);
        
        // Now sign in anonymously
        await auth.signInAnonymously();
        
        memberLoginError.classList.remove('show');
    } catch (error) {
        // Clear session storage on error
        sessionStorage.removeItem('memberLoginId');
        sessionStorage.removeItem('memberLoginIdentifier');
        
        console.error('Member login error:', error);
        memberLoginError.textContent = 'Login failed. Please try again.';
        memberLoginError.classList.add('show');
    }
});

// Logout button
logoutBtn.addEventListener('click', async () => {
    try {
        // Clear member login session
        sessionStorage.removeItem('memberLoginId');
        sessionStorage.removeItem('memberLoginIdentifier');
        
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
});

// Load user data from Firestore
async function loadUserData(uid) {
    try {
        // Check if it's a member login via identifier
        const memberLoginId = sessionStorage.getItem('memberLoginId');
        
        let memberDoc;
        if (memberLoginId) {
            // Member logged in with identifier
            memberDoc = await db.collection('members').doc(memberLoginId).get();
        } else {
            // Admin logged in with email/password
            memberDoc = await db.collection('members').doc(uid).get();
        }
        
        if (memberDoc.exists) {
            currentUserData = {
                id: memberDoc.id,
                ...memberDoc.data()
            };
            
            // If admin login, verify role
            if (isAdminLogin && currentUserData.role !== 'Admin') {
                // Not an admin, sign out
                isAdminLogin = false;
                await auth.signOut();
                adminLoginError.textContent = 'Access denied. Only Admin users can login here.';
                adminLoginError.classList.add('show');
                return;
            }
            
            // Reset admin login flag
            isAdminLogin = false;
            
        } else {
            // Member document doesn't exist
            if (isAdminLogin) {
                // Admin login but no member document found
                isAdminLogin = false;
                await auth.signOut();
                adminLoginError.textContent = 'Admin account not found. Please create member entry in Firestore.';
                adminLoginError.classList.add('show');
                return;
            }
            
            // If member doesn't exist for anonymous/identifier login
            if (memberLoginId) {
                console.error('Member not found for identifier login');
                // Clear session storage
                sessionStorage.removeItem('memberLoginId');
                sessionStorage.removeItem('memberLoginIdentifier');
                await auth.signOut();
                memberLoginError.textContent = 'Member account not found. Please contact admin.';
                memberLoginError.classList.add('show');
                return;
            }
            
            // Fallback: Create default member (shouldn't happen in normal flow)
            console.warn('User not found in members collection - creating default');
            currentUserData = {
                id: uid,
                name: currentUser.email ? currentUser.email.split('@')[0] : 'User',
                role: 'Member',
                lifetimeContribution: 0
            };
            
            // Create the member document
            await db.collection('members').doc(uid).set({
                name: currentUserData.name,
                role: currentUserData.role,
                lifetimeContribution: currentUserData.lifetimeContribution,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user profile');
    }
}

// Show dashboard page
function showDashboard() {
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    
    // Update user info in header
    userName.textContent = `Welcome, ${currentUserData.name}`;
    
    // For members, show identifier in role badge
    if (currentUserData.role === 'Member' && currentUserData.identifier) {
        userRole.textContent = `${currentUserData.role} (${currentUserData.identifier})`;
    } else {
        userRole.textContent = currentUserData.role;
    }
    userRole.className = 'role-badge ' + currentUserData.role.toLowerCase();
    
    // Show/hide admin panel based on role
    const adminPanel = document.getElementById('adminPanel');
    const adminOnlyPanel = document.getElementById('adminOnlyPanel');
    const membersPanel = document.getElementById('membersPanel');
    const pendingRequestsPanel = document.getElementById('pendingRequestsPanel');
    const myLoanRequestsPanel = document.getElementById('myLoanRequestsPanel');
    const pendingLoanRequestsPanel = document.getElementById('pendingLoanRequestsPanel');
    
    // All users can see pending contribution requests, but only Admin can take actions
    pendingRequestsPanel.classList.remove('hidden');
    
    // All users can see their own loan requests
    myLoanRequestsPanel.classList.remove('hidden');
    
    // Only Admin can see admin panels, member management, and pending loan requests
    if (isAdmin()) {
        adminPanel.classList.remove('hidden');
        membersPanel.classList.remove('hidden');
        adminOnlyPanel.classList.remove('hidden');
        pendingLoanRequestsPanel.classList.remove('hidden');
    } else {
        adminPanel.classList.add('hidden');
        membersPanel.classList.add('hidden');
        adminOnlyPanel.classList.add('hidden');
        pendingLoanRequestsPanel.classList.add('hidden');
    }
    
    // Load dashboard data
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
}

// Show login page
function showLogin() {
    loginPage.classList.remove('hidden');
    dashboardPage.classList.add('hidden');
    
    // Reset both login forms
    if (adminLoginForm) adminLoginForm.reset();
    if (memberLoginForm) memberLoginForm.reset();
    
    // Clear error messages
    if (adminLoginError) {
        adminLoginError.textContent = '';
        adminLoginError.classList.remove('show');
    }
    if (memberLoginError) {
        memberLoginError.textContent = '';
        memberLoginError.classList.remove('show');
    }
    
    // Show admin tab by default
    showLoginTab('admin');
}

// Check if current user is Admin
function isAdminOrCoAdmin() {
    return currentUserData && currentUserData.role === 'Admin';
}

// Check if current user is Admin only
function isAdmin() {
    return currentUserData && currentUserData.role === 'Admin';
}

// Get current user data
function getCurrentUser() {
    return currentUserData;
}

// User-friendly error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Export functions for use in other modules
window.isAdminOrCoAdmin = isAdminOrCoAdmin;
window.isAdmin = isAdmin;
window.getCurrentUser = getCurrentUser;
