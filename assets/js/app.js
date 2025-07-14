// Firebase Configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase (This will be dynamically loaded)
let app, auth, db;

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Firebase modules will be loaded via CDN
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
        
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Check auth state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                console.log('User is signed in:', user);
            } else {
                // User is signed out
                console.log('User is signed out');
            }
        });
        
        // Initialize the app
        initializeApp();
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Fallback to local storage for development
        initializeApp();
    }
});

// Main app initialization
function initializeApp() {
    initializeTabs();
    initializeStats();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
}

// Tab functionality
function initializeTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and tabs
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Initialize statistics
function initializeStats() {
    // Load data from localStorage or Firebase
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    
    // Update stats
    document.getElementById('totalPatients').textContent = patients.length;
    document.getElementById('todayAppointments').textContent = getTodayAppointments(appointments);
}

// Get today's appointments count
function getTodayAppointments(appointments) {
    const today = new Date().toDateString();
    return appointments.filter(appointment => 
        new Date(appointment.date).toDateString() === today
    ).length;
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const dateTimeElements = document.querySelectorAll('#currentDateTime');
    dateTimeElements.forEach(element => {
        if (element) {
            element.textContent = now.toLocaleDateString('en-US', options);
        }
    });
}

// Utility functions
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main') || document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(alert, mainContent.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Data storage functions
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

function loadData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Authentication Mode Switching
document.addEventListener('DOMContentLoaded', function() {
    // Auth mode tabs (Login/Signup)
    const authModeBtns = document.querySelectorAll('.auth-mode-btn');
    const authSections = document.querySelectorAll('.auth-section');
    
    authModeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Update active auth mode button
            authModeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            authSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === mode + 'Section') {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Role tabs for both login and signup
    const roleTabs = document.querySelectorAll('.role-tab');
    
    roleTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const role = this.dataset.role;
            const parentSection = this.closest('.auth-section');
            
            // Update active role tab within the same section
            const siblingTabs = parentSection.querySelectorAll('.role-tab');
            siblingTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update login form if in login section
            if (parentSection.id === 'loginSection') {
                updateLoginFormForRole(role);
            }
            
            // Show/hide role-specific fields in signup
            if (parentSection.id === 'signupSection') {
                const doctorFields = parentSection.querySelector('#doctorFields');
                const receptionistFields = parentSection.querySelector('#receptionistFields');
                
                if (role === 'doctor') {
                    doctorFields.style.display = 'block';
                    receptionistFields.style.display = 'none';
                    // Make doctor fields required
                    doctorFields.querySelectorAll('input, select').forEach(field => {
                        if (field.id === 'specialization' || field.id === 'licenseNumber' || field.id === 'doctorId') {
                            field.required = true;
                        }
                    });
                    // Make receptionist fields optional
                    receptionistFields.querySelectorAll('input, select').forEach(field => {
                        field.required = false;
                    });
                } else {
                    doctorFields.style.display = 'none';
                    receptionistFields.style.display = 'block';
                    // Make receptionist fields required
                    receptionistFields.querySelectorAll('input, select').forEach(field => {
                        if (field.id === 'employeeId' || field.id === 'department') {
                            field.required = true;
                        }
                    });
                    // Make doctor fields optional
                    doctorFields.querySelectorAll('input, select').forEach(field => {
                        field.required = false;
                    });
                }
            }
            
            // Update login form label and placeholder based on role
            updateLoginFormForRole(role);
        });
    });
    
    // Sign up form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Password confirmation validation
    const confirmPassword = document.getElementById('confirmPassword');
    const signupPassword = document.getElementById('signupPassword');
    
    if (confirmPassword && signupPassword) {
        confirmPassword.addEventListener('input', function() {
            if (this.value !== signupPassword.value) {
                this.setCustomValidity('Passwords do not match');
            } else {
                this.setCustomValidity('');
            }
        });
        
        signupPassword.addEventListener('input', function() {
            if (confirmPassword.value && confirmPassword.value !== this.value) {
                confirmPassword.setCustomValidity('Passwords do not match');
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }
    
    // Initialize login form labels on page load
    const defaultRole = document.querySelector('#loginSection .role-tab.active');
    if (defaultRole) {
        updateLoginFormForRole(defaultRole.dataset.role);
    }
    
    // Add real-time ID validation
    const doctorIdInput = document.getElementById('doctorId');
    const employeeIdInput = document.getElementById('employeeId');
    
    if (doctorIdInput) {
        doctorIdInput.addEventListener('blur', function() {
            const id = this.value.trim();
            if (id && !validateUniqueId(id, 'doctor')) {
                showNotification('Doctor ID already exists. Suggested ID: ' + generateSuggestedId('doctor'), 'error');
                this.focus();
            }
        });
    }
    
    if (employeeIdInput) {
        employeeIdInput.addEventListener('blur', function() {
            const id = this.value.trim();
            if (id && !validateUniqueId(id, 'receptionist')) {
                showNotification('Employee ID already exists. Suggested ID: ' + generateSuggestedId('receptionist'), 'error');
                this.focus();
            }
        });
    }
});

// Update login form label and placeholder based on role
function updateLoginFormForRole(role) {
    const loginIdLabel = document.getElementById('loginIdLabel');
    const loginIdInput = document.getElementById('loginId');
    
    if (loginIdLabel && loginIdInput) {
        if (role === 'doctor') {
            loginIdLabel.textContent = 'Doctor ID';
            loginIdInput.placeholder = 'Enter your Doctor ID (e.g., DOC001)';
        } else {
            loginIdLabel.textContent = 'Employee ID';
            loginIdInput.placeholder = 'Enter your Employee ID (e.g., EMP001)';
        }
    }
}

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const signupData = Object.fromEntries(formData);
    
    // Get the selected role
    const activeRoleTab = document.querySelector('#signupSection .role-tab.active');
    const role = activeRoleTab ? activeRoleTab.dataset.role : 'doctor';
    
    // Validate password confirmation
    if (signupData.password !== signupData.confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    // Validate unique ID
    const idField = role === 'doctor' ? 'doctorId' : 'employeeId';
    if (signupData[idField] && !validateUniqueId(signupData[idField], role)) {
        showNotification(`${role === 'doctor' ? 'Doctor ID' : 'Employee ID'} already exists!`, 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;
        
        // Prepare user data
        const userData = {
            name: signupData.name,
            email: signupData.email,
            phone: signupData.phone,
            role: role,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Add role-specific data
        if (role === 'doctor') {
            userData.doctorId = signupData.doctorId;
            userData.specialization = signupData.specialization;
            userData.licenseNumber = signupData.licenseNumber;
            userData.experience = signupData.experience || 0;
        } else {
            userData.employeeId = signupData.employeeId;
            userData.department = signupData.department;
            userData.shift = signupData.shift;
        }
        
        // For now, simulate account creation (replace with actual Firebase auth later)
        await simulateAccountCreation(userData, signupData.password);
        
        showNotification('Account created successfully! Please login with your credentials.', 'success');
        
        // Switch to login tab
        document.querySelector('.auth-mode-btn[data-mode="login"]').click();
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showNotification('Error creating account: ' + error.message, 'error');
    } finally {
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Simulate account creation (replace with actual Firebase implementation)
async function simulateAccountCreation(userData, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Store user data in localStorage for demo purposes
            const users = JSON.parse(localStorage.getItem('clinicUsers') || '[]');
            
            // Check if user already exists (by email, doctorId, or employeeId)
            const existingUser = users.find(user => 
                user.email === userData.email || 
                (userData.doctorId && user.doctorId === userData.doctorId) ||
                (userData.employeeId && user.employeeId === userData.employeeId)
            );
            
            if (existingUser) {
                reject(new Error('User with this email or ID already exists'));
                return;
            }
            
            // Add password to user data (in real app, this would be handled by Firebase Auth)
            userData.password = password;
            userData.id = Date.now().toString();
            
            users.push(userData);
            localStorage.setItem('clinicUsers', JSON.stringify(users));
            
            resolve(userData);
        }, 1500); // Simulate network delay
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add ID validation functions
function validateUniqueId(id, role) {
    const users = JSON.parse(localStorage.getItem('clinicUsers') || '[]');
    
    if (role === 'doctor') {
        return !users.some(user => user.doctorId === id);
    } else {
        return !users.some(user => user.employeeId === id);
    }
}

function generateSuggestedId(role) {
    const users = JSON.parse(localStorage.getItem('clinicUsers') || '[]');
    const prefix = role === 'doctor' ? 'DOC' : 'EMP';
    let counter = 1;
    
    if (role === 'doctor') {
        const doctorIds = users.filter(u => u.doctorId).map(u => u.doctorId);
        while (doctorIds.includes(`${prefix}${counter.toString().padStart(3, '0')}`)) {
            counter++;
        }
    } else {
        const empIds = users.filter(u => u.employeeId).map(u => u.employeeId);
        while (empIds.includes(`${prefix}${counter.toString().padStart(3, '0')}`)) {
            counter++;
        }
    }
    
    return `${prefix}${counter.toString().padStart(3, '0')}`;
}

// Export functions for use in other files
window.AppUtils = {
    showAlert,
    generateId,
    formatDate,
    formatTime,
    saveData,
    loadData,
    updateDateTime
};
