// Authentication Module
let currentUser = null;
let currentUserData = null;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

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

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginError.classList.remove('show');
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = getErrorMessage(error.code);
        loginError.classList.add('show');
    }
});

// Logout button
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
});

// Load user data from Firestore
async function loadUserData(uid) {
    try {
        const memberDoc = await db.collection('members').doc(uid).get();
        
        if (memberDoc.exists) {
            currentUserData = {
                id: uid,
                ...memberDoc.data()
            };
        } else {
            // If member doesn't exist, create a default member entry
            console.warn('User not found in members collection, creating default entry');
            currentUserData = {
                id: uid,
                name: currentUser.email.split('@')[0],
                role: 'Member',
                lifetimeContribution: 0
            };
            
            // Create the member document
            await db.collection('members').doc(uid).set({
                name: currentUserData.name,
                role: currentUserData.role,
                lifetimeContribution: 0
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user profile. Please refresh the page.');
    }
}

// Show dashboard page
function showDashboard() {
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    
    // Update user info in header
    userName.textContent = `Welcome, ${currentUserData.name}`;
    userRole.textContent = currentUserData.role;
    userRole.className = 'role-badge ' + currentUserData.role.toLowerCase();
    
    // Show/hide admin panel based on role
    const adminPanel = document.getElementById('adminPanel');
    const adminOnlyPanel = document.getElementById('adminOnlyPanel');
    const membersPanel = document.getElementById('membersPanel');
    
    if (isAdminOrCoAdmin()) {
        adminPanel.classList.remove('hidden');
        membersPanel.classList.remove('hidden');
    } else {
        adminPanel.classList.add('hidden');
        membersPanel.classList.add('hidden');
    }
    
    // Show Admin-only panel only for Admin role
    if (isAdmin()) {
        adminOnlyPanel.classList.remove('hidden');
    } else {
        adminOnlyPanel.classList.add('hidden');
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
    loginForm.reset();
}

// Check if current user is Admin or CoAdmin
function isAdminOrCoAdmin() {
    return currentUserData && 
           (currentUserData.role === 'Admin' || currentUserData.role === 'CoAdmin');
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
