// Authentication module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        const savedRole = localStorage.getItem('currentRole');
        
        if (savedUser && savedRole) {
            this.currentUser = JSON.parse(savedUser);
            this.currentRole = savedRole;
        }

        // Initialize login form
        this.initializeLoginForm();
        this.initializeLoginTabs();
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    initializeLoginTabs() {
        const roleTabs = document.querySelectorAll('.role-tab');
        roleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs in the same section
                const parentSection = tab.closest('.auth-section');
                if (parentSection) {
                    const siblingTabs = parentSection.querySelectorAll('.role-tab');
                    siblingTabs.forEach(t => t.classList.remove('active'));
                }
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Update form title based on selected role
                const role = tab.getAttribute('data-role');
                this.updateLoginForm(role);
            });
        });
    }

    updateLoginForm(role) {
        // Store the selected role
        this.selectedRole = role;
        
        // Update form appearance based on role
        const authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            authContainer.setAttribute('data-role', role);
        }
    }

    async handleLogin() {
        const loginId = document.getElementById('loginId').value;
        const password = document.getElementById('loginPassword').value;
        
        // Get the selected role from the active tab
        const activeTab = document.querySelector('#loginSection .role-tab.active');
        const role = activeTab ? activeTab.getAttribute('data-role') : 'doctor';

        // Show loading state
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Logging in...';
        submitBtn.disabled = true;

        try {
            // Simulate authentication delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check both demo credentials and registered users
            const user = await this.authenticateUser(loginId, password, role);
            
            if (user) {
                // Save user session
                this.currentUser = user;
                this.currentRole = role;
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('currentRole', role);

                // Show success message using the new notification system
                if (typeof showNotification === 'function') {
                    showNotification('Login successful! Redirecting...', 'success');
                } else {
                    this.showAlert('Login successful! Redirecting...', 'success');
                }

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    if (role === 'doctor') {
                        window.location.href = 'doctor-dashboard.html';
                    } else {
                        window.location.href = 'receptionist-dashboard.html';
                    }
                }, 1500);

            } else {
                throw new Error('Invalid credentials or role mismatch');
            }

        } catch (error) {
            if (typeof showNotification === 'function') {
                showNotification('Login failed: ' + error.message, 'error');
            } else {
                this.showAlert('Login failed: ' + error.message, 'error');
            }
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async authenticateUser(loginId, password, role) {
        // Check demo credentials first
        const demoCredentials = {
            'DOC001': { password: 'password123', role: 'doctor', name: 'Dr. John Smith', email: 'doctor@clinic.com' },
            'EMP001': { password: 'password123', role: 'receptionist', name: 'Sarah Johnson', email: 'receptionist@clinic.com' }
        };
        
        if (demoCredentials[loginId] && 
            demoCredentials[loginId].password === password && 
            demoCredentials[loginId].role === role) {
            return {
                id: 'demo_' + role,
                loginId: loginId,
                email: demoCredentials[loginId].email,
                name: demoCredentials[loginId].name,
                role: role,
                isDemo: true,
                loginTime: new Date().toISOString()
            };
        }
        
        // Check registered users
        const users = JSON.parse(localStorage.getItem('clinicUsers') || '[]');
        let user = null;
        
        if (role === 'doctor') {
            user = users.find(u => u.doctorId === loginId && u.password === password && u.role === role);
        } else {
            user = users.find(u => u.employeeId === loginId && u.password === password && u.role === role);
        }
        
        if (user) {
            return {
                id: user.id,
                loginId: loginId,
                email: user.email,
                name: user.name,
                role: user.role,
                specialization: user.specialization,
                department: user.department,
                doctorId: user.doctorId,
                employeeId: user.employeeId,
                isDemo: false,
                loginTime: new Date().toISOString()
            };
        }
        
        return null;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    logout() {
        // Clear user session
        this.currentUser = null;
        this.currentRole = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');

        // Show logout message
        this.showAlert('Logged out successfully!', 'info');

        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current role
    getCurrentRole() {
        return this.currentRole;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentRole === role;
    }

    // Protect routes - call this on dashboard pages
    protectRoute(requiredRole) {
        if (!this.isAuthenticated()) {
            this.showAlert('Please log in to access this page.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }

        if (requiredRole && !this.hasRole(requiredRole)) {
            this.showAlert('You do not have permission to access this page.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }

        return true;
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.main') || document.querySelector('.main-content') || document.body;
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Global logout function
function logout() {
    authManager.logout();
}

// Export for use in other files
window.AuthManager = authManager;
