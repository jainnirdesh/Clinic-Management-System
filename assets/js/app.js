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

// Quick Actions Functions
function showContactInfo() {
    const modal = createModal(
        'Contact Information',
        `
        <div style="text-align: left;">
            <h4><i class="fas fa-phone"></i> Phone Numbers</h4>
            <p>Emergency: <a href="tel:+15559110000"><strong>+1 (555) 911-0000</strong></a><br>
            Appointments: <a href="tel:+15551234567"><strong>+1 (555) 123-4567</strong></a><br>
            General Inquiries: <a href="tel:+15559876543"><strong>+1 (555) 987-6543</strong></a></p>
            
            <h4><i class="fas fa-envelope"></i> Email Addresses</h4>
            <p><a href="mailto:info@healthcareclinic.com"><strong>info@healthcareclinic.com</strong></a><br>
            <a href="mailto:appointments@healthcareclinic.com"><strong>appointments@healthcareclinic.com</strong></a><br>
            <a href="mailto:emergency@healthcareclinic.com"><strong>emergency@healthcareclinic.com</strong></a></p>
            
            <h4><i class="fas fa-map-marker-alt"></i> Address</h4>
            <p>123 Healthcare Street<br>
            Medical District<br>
            City, State 12345</p>
            
            <h4><i class="fas fa-clock"></i> Operating Hours</h4>
            <p><strong>Monday - Friday:</strong> 8:00 AM - 8:00 PM<br>
            <strong>Saturday:</strong> 9:00 AM - 5:00 PM<br>
            <strong>Sunday:</strong> 10:00 AM - 4:00 PM</p>
            
            <h4><i class="fas fa-directions"></i> Getting Here</h4>
            <p>We're located in the heart of the Medical District, easily accessible by public transportation and with ample parking available.</p>
        </div>
        `
    );
    document.body.appendChild(modal);
}

function showEmergencyInfo() {
    const modal = createModal(
        'Emergency Services',
        `
        <div style="text-align: left;">
            <h4><i class="fas fa-ambulance"></i> Emergency Hotline</h4>
            <p style="color: #dc3545; font-size: 1.2rem; font-weight: bold;">+1 (555) 911-0000</p>
            
            <h4><i class="fas fa-hospital"></i> 24/7 Services Available</h4>
            <ul style="margin-left: 20px;">
                <li>Emergency Medicine</li>
                <li>Trauma Care</li>
                <li>Cardiac Emergency</li>
                <li>Stroke Response</li>
                <li>Pediatric Emergency</li>
                <li>Poison Control</li>
            </ul>
            
            <h4><i class="fas fa-info-circle"></i> When to Call Emergency</h4>
            <ul style="margin-left: 20px;">
                <li>Severe chest pain</li>
                <li>Difficulty breathing</li>
                <li>Severe injuries</li>
                <li>Loss of consciousness</li>
                <li>Severe allergic reactions</li>
                <li>Signs of stroke</li>
            </ul>
            
            <div style="background: #f8d7da; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <strong>Important:</strong> For life-threatening emergencies, call 911 immediately.
            </div>
        </div>
        `
    );
    document.body.appendChild(modal);
}

function showAppointmentInfo() {
    const modal = createModal(
        'Book Appointment',
        `
        <div style="text-align: left;">
            <h4><i class="fas fa-calendar-check"></i> How to Book</h4>
            <p>Currently, appointments are managed through our staff portal. Please contact us using one of the following methods:</p>
            
            <h4><i class="fas fa-phone"></i> Phone Booking</h4>
            <p>Call us at: <a href="tel:+15551234567"><strong>+1 (555) 123-4567</strong></a><br>
            <strong>Available:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
            
            <h4><i class="fas fa-envelope"></i> Email Booking</h4>
            <p>Email us at: <a href="mailto:appointments@healthcareclinic.com"><strong>appointments@healthcareclinic.com</strong></a><br>
            Include your preferred date, time, and reason for visit.</p>
            
            <h4><i class="fas fa-user-md"></i> Available Services</h4>
            <ul>
                <li>General Consultation - <strong>₹500</strong></li>
                <li>Specialist Consultation - <strong>₹800</strong></li>
                <li>Health Checkup - <strong>₹1200</strong></li>
                <li>Vaccination - <strong>₹200</strong></li>
                <li>Lab Tests - <strong>₹300</strong></li>
                <li>X-Ray - <strong>₹800</strong></li>
            </ul>
            
            <h4><i class="fas fa-credit-card"></i> Payment Options</h4>
            <p>We accept cash, credit cards, debit cards, and digital payments (UPI, PayTM, etc.)</p>
            
            <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <strong>Important:</strong> Please arrive 15 minutes before your appointment time and bring a valid ID.
            </div>
        </div>
        `
    );
    document.body.appendChild(modal);
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <span class="modal-close" onclick="closeModal(this)">&times;</span>
            <h3>${title}</h3>
            <div>${content}</div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
    
    // Close modal on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal.querySelector('.modal-close'));
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Show modal with animation
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Focus trap for accessibility
    setTimeout(() => {
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }, 100);
    
    return modal;
}

function closeModal(element) {
    const modal = element.closest('.modal');
    
    // Add closing animation
    modal.classList.add('closing');
    
    // Remove modal after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        modal.remove();
        document.body.classList.remove('modal-open');
    }, 300);
}

// Enhanced stats animation
function animateStats() {
    const stats = [
        { id: 'totalPatients', target: 1247, prefix: '' },
        { id: 'activeDoctors', target: 12, prefix: '' },
        { id: 'todayAppointments', target: 45, prefix: '' }
    ];
    
    stats.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element) {
            animateNumber(element, 0, stat.target, 2000, stat.prefix);
        }
    });
}

function animateNumber(element, start, end, duration, prefix = '') {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (difference * easeOutQuart));
        
        element.textContent = prefix + current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Initialize stats animation when home tab is shown
function initializeHomePageAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all sections
    document.querySelectorAll('.services-section, .features-section, .testimonials-section, .quick-actions-section, .contact-info-section').forEach(section => {
        observer.observe(section);
    });
}

// Add fadeInUp animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .services-section,
    .features-section,
    .testimonials-section,
    .quick-actions-section,
    .contact-info-section {
        opacity: 0;
    }
`;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    initializeHomePageAnimations();
    
    // Animate stats when home tab is active
    const homeTab = document.getElementById('home');
    if (homeTab && homeTab.classList.contains('active')) {
        setTimeout(animateStats, 500);
    }
});

// Create particle effect
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Add typing effect to hero text
function addTypingEffect() {
    const heroText = document.querySelector('.hero h2');
    if (heroText) {
        const text = heroText.textContent;
        heroText.textContent = '';
        heroText.classList.add('typing-text');
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                heroText.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                heroText.classList.remove('typing-text');
            }
        }, 100);
    }
}

// Add scroll reveal animation
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.service-card, .feature-card, .testimonial-card, .quick-action-card, .contact-card');
    
    revealElements.forEach(element => {
        element.classList.add('scroll-reveal');
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(element => {
        observer.observe(element);
    });
}

// Add interactive icons
function addInteractiveIcons() {
    const icons = document.querySelectorAll('.service-card i, .feature-card i, .quick-action-card i, .contact-card i');
    
    icons.forEach(icon => {
        icon.classList.add('interactive-icon');
        
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.background = 'rgba(102, 126, 234, 0.3)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.marginLeft = '-10px';
            ripple.style.marginTop = '-10px';
            ripple.style.pointerEvents = 'none';
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add ripple animation to CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Enhanced stats with more realistic data
function getRealisticStats() {
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate different stats based on time of day
    let todayAppointments = 0;
    if (hour >= 8 && hour < 12) {
        todayAppointments = Math.floor(Math.random() * 20) + 25; // Morning rush
    } else if (hour >= 12 && hour < 17) {
        todayAppointments = Math.floor(Math.random() * 15) + 35; // Afternoon
    } else if (hour >= 17 && hour < 20) {
        todayAppointments = Math.floor(Math.random() * 10) + 20; // Evening
    } else {
        todayAppointments = Math.floor(Math.random() * 5) + 5; // Night/Early morning
    }
    
    return {
        totalPatients: 1247 + Math.floor(Math.random() * 100),
        activeDoctors: 12,
        todayAppointments: todayAppointments
    };
}

// Update stats animation with realistic data
function animateStatsRealistic() {
    const stats = getRealisticStats();
    const statElements = [
        { id: 'totalPatients', target: stats.totalPatients, prefix: '' },
        { id: 'activeDoctors', target: stats.activeDoctors, prefix: '' },
        { id: 'todayAppointments', target: stats.todayAppointments, prefix: '' }
    ];
    
    statElements.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element) {
            animateNumber(element, 0, stat.target, 2000, stat.prefix);
        }
    });
}

// Add current time display
function addCurrentTimeDisplay() {
    const timeDisplay = document.createElement('div');
    timeDisplay.style.position = 'fixed';
    timeDisplay.style.top = '10px';
    timeDisplay.style.right = '10px';
    timeDisplay.style.background = 'rgba(102, 126, 234, 0.9)';
    timeDisplay.style.color = 'white';
    timeDisplay.style.padding = '8px 12px';
    timeDisplay.style.borderRadius = '20px';
    timeDisplay.style.fontSize = '0.9rem';
    timeDisplay.style.zIndex = '9999';
    timeDisplay.style.backdropFilter = 'blur(10px)';
    timeDisplay.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    
    function updateTime() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString();
    }
    
    updateTime();
    setInterval(updateTime, 1000);
    
    document.body.appendChild(timeDisplay);
}

// Add weather widget simulation
function addWeatherWidget() {
    const weatherWidget = document.createElement('div');
    weatherWidget.style.position = 'fixed';
    weatherWidget.style.top = '10px';
    weatherWidget.style.left = '10px';
    weatherWidget.style.background = 'rgba(255, 255, 255, 0.9)';
    weatherWidget.style.color = '#333';
    weatherWidget.style.padding = '8px 12px';
    weatherWidget.style.borderRadius = '20px';
    weatherWidget.style.fontSize = '0.9rem';
    weatherWidget.style.zIndex = '9999';
    weatherWidget.style.backdropFilter = 'blur(10px)';
    weatherWidget.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    weatherWidget.style.display = 'flex';
    weatherWidget.style.alignItems = 'center';
    weatherWidget.style.gap = '8px';
    
    const weatherIcon = document.createElement('i');
    weatherIcon.className = 'fas fa-sun';
    weatherIcon.style.color = '#f39c12';
    
    const weatherText = document.createElement('span');
    weatherText.textContent = '24°C';
    
    weatherWidget.appendChild(weatherIcon);
    weatherWidget.appendChild(weatherText);
    
    // Simulate weather changes
    const weathers = [
        { icon: 'fas fa-sun', temp: '24°C', color: '#f39c12' },
        { icon: 'fas fa-cloud', temp: '22°C', color: '#95a5a6' },
        { icon: 'fas fa-cloud-sun', temp: '26°C', color: '#f1c40f' },
        { icon: 'fas fa-cloud-rain', temp: '20°C', color: '#3498db' }
    ];
    
    let currentWeather = 0;
    setInterval(() => {
        currentWeather = (currentWeather + 1) % weathers.length;
        const weather = weathers[currentWeather];
        weatherIcon.className = weather.icon;
        weatherIcon.style.color = weather.color;
        weatherText.textContent = weather.temp;
    }, 30000); // Change every 30 seconds
    
    document.body.appendChild(weatherWidget);
}

// Initialize all enhancements
function initializeEnhancements() {
    createParticles();
    addTypingEffect();
    initScrollReveal();
    addInteractiveIcons();
    addCurrentTimeDisplay();
    addWeatherWidget();
}

// Update the main initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeEnhancements();
    initializeHomePageAnimations();
    
    // Use realistic stats
    const homeTab = document.getElementById('home');
    if (homeTab && homeTab.classList.contains('active')) {
        setTimeout(animateStatsRealistic, 500);
    }
});

// Update tab switching to use realistic stats
const originalSwitchTab = switchTab;
function switchTab(tabName) {
    originalSwitchTab(tabName);
    
    // Use realistic stats animation for home tab
    if (tabName === 'home') {
        setTimeout(animateStatsRealistic, 200);
    }
}
