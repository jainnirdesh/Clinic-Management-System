// Doctor Dashboard JavaScript
class DoctorDashboard {
    constructor() {
        this.currentUser = null;
        this.patients = [];
        this.tokens = [];
        this.prescriptions = [];
        this.currentPatient = null;
        this.init();
    }

    init() {
        console.log('Doctor Dashboard - Initializing...');
        
        // Check authentication
        this.checkAuth();
        
        // Load data from localStorage
        this.loadData();
        
        // Initialize UI
        this.initializeUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Update date/time
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        console.log('Doctor Dashboard - Initialization complete');
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        const role = localStorage.getItem('currentRole');
        
        if (!user || !role || role !== 'doctor') {
            // For development/testing purposes, allow access with a demo user
            console.log('No valid authentication found, using demo user');
            this.currentUser = { 
                name: 'Dr. John Smith', 
                doctorId: 'DOC001', 
                specialization: 'General Medicine',
                email: 'doctor@clinic.com'
            };
            document.getElementById('doctorName').textContent = this.currentUser.name;
            return;
        }
        
        this.currentUser = JSON.parse(user);
        document.getElementById('doctorName').textContent = this.currentUser.name;
    }

    loadData() {
        // Load data from localStorage
        this.patients = JSON.parse(localStorage.getItem('clinicPatients') || '[]');
        this.tokens = JSON.parse(localStorage.getItem('clinicTokens') || '[]');
        this.prescriptions = JSON.parse(localStorage.getItem('clinicPrescriptions') || '[]');
        
        // Initialize sample data if no data exists (but don't overwrite existing data)
        if (this.patients.length === 0 && this.tokens.length === 0) {
            this.initializeSampleData();
        }
        
        // Debug logging
        console.log('Doctor Dashboard - Loaded data:', {
            patients: this.patients.length,
            tokens: this.tokens.length,
            patientsDetails: this.patients.map(p => ({
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                registrationDate: p.registrationDate
            })),
            tokensDetails: this.tokens.map(t => ({
                id: t.id,
                doctorId: t.doctorId,
                patientName: t.patientName,
                date: t.date,
                status: t.status
            })),
            currentUser: this.currentUser
        });
        
        // Load recent activities
        this.loadRecentActivities();
    }

    initializeSampleData() {
        // Create sample patients
        const samplePatients = [
            {
                id: 'PAT001',
                firstName: 'John',
                lastName: 'Doe',
                age: 35,
                gender: 'Male',
                phone: '+1-555-0201',
                email: 'john.doe@email.com',
                address: '123 Main St, City, State 12345',
                bloodGroup: 'O+',
                emergencyContact: '+1-555-0202',
                medicalHistory: 'Hypertension, Diabetes',
                registrationDate: new Date().toISOString()
            },
            {
                id: 'PAT002',
                firstName: 'Jane',
                lastName: 'Smith',
                age: 28,
                gender: 'Female',
                phone: '+1-555-0203',
                email: 'jane.smith@email.com',
                address: '456 Oak Ave, City, State 12345',
                bloodGroup: 'A+',
                emergencyContact: '+1-555-0204',
                medicalHistory: 'None',
                registrationDate: new Date().toISOString()
            },
            {
                id: 'PAT003',
                firstName: 'Robert',
                lastName: 'Johnson',
                age: 45,
                gender: 'Male',
                phone: '+1-555-0205',
                email: 'robert.johnson@email.com',
                address: '789 Pine St, City, State 12345',
                bloodGroup: 'B+',
                emergencyContact: '+1-555-0206',
                medicalHistory: 'Allergic to penicillin',
                registrationDate: new Date().toISOString()
            }
        ];

        // Create sample tokens for today
        const today = new Date();
        const sampleTokens = [
            {
                id: 'TOK001',
                tokenNumber: 1,
                patientId: 'PAT001',
                patientName: 'John Doe',
                doctorId: 'DOC001',
                date: today.toISOString(),
                tokenType: 'Regular',
                status: 'waiting',
                notes: 'Regular checkup'
            },
            {
                id: 'TOK002',
                tokenNumber: 2,
                patientId: 'PAT002',
                patientName: 'Jane Smith',
                doctorId: 'DOC001',
                date: today.toISOString(),
                tokenType: 'Regular',
                status: 'waiting',
                notes: 'Fever and headache'
            },
            {
                id: 'TOK003',
                tokenNumber: 3,
                patientId: 'PAT003',
                patientName: 'Robert Johnson',
                doctorId: 'DOC001',
                date: today.toISOString(),
                tokenType: 'Emergency',
                status: 'in-consultation',
                notes: 'Chest pain'
            }
        ];

        // Save sample data
        this.patients = samplePatients;
        this.tokens = sampleTokens;
        localStorage.setItem('clinicPatients', JSON.stringify(this.patients));
        localStorage.setItem('clinicTokens', JSON.stringify(this.tokens));
        
        console.log('Sample data initialized:', {
            patients: this.patients.length,
            tokens: this.tokens.length
        });
    }

    saveData() {
        localStorage.setItem('clinicPrescriptions', JSON.stringify(this.prescriptions));
        localStorage.setItem('clinicTokens', JSON.stringify(this.tokens));
    }

    initializeUI() {
        // Set up navigation first
        this.setupNavigation();
        
        this.updatePatientQueue();
        this.updatePatientDropdown();
        this.loadRecentActivities();
        this.updateAllPatientsList();
    }

    setupNavigation() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.dataset.tab;
                this.switchTab(tabName);
                
                // Close mobile menu if open
                this.closeMobileMenu();
            });
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        
        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', () => {
                const isActive = sidebar.classList.contains('active');
                
                if (isActive) {
                    this.closeMobileMenu();
                } else {
                    this.openMobileMenu();
                }
            });

            // Close menu when clicking overlay
            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            }

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMobileMenu();
                }
            });
        }
    }

    openMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        
        if (sidebar) {
            sidebar.classList.add('active');
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        document.body.classList.add('menu-open');
    }

    setupEventListeners() {
        // Prescription form
        const prescriptionForm = document.getElementById('prescriptionForm');
        if (prescriptionForm) {
            prescriptionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePrescription();
            });
        }

        // Set today's date as default
        const consultationDate = document.getElementById('consultationDate');
        if (consultationDate) {
            consultationDate.value = new Date().toISOString().split('T')[0];
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.classList.remove('menu-open');
    }

    switchTab(tabName) {
        // Remove active class from all nav items and tab contents
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected nav item and tab content
        document.querySelector(`[data-tab="${tabName}"]`).parentElement.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Update content based on tab
        switch(tabName) {
            case 'patients':
                this.loadData(); // Refresh data before updating queue
                this.updatePatientQueue();
                this.updateAllPatientsList();
                break;
            case 'prescriptions':
                this.loadData(); // Refresh data before updating dropdown
                this.updatePatientDropdown();
                break;
            case 'history':
                this.loadPatientHistory();
                break;
            case 'profile':
                this.updateProfile();
                break;
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('currentDateTime').textContent = dateTimeString;
    }

    updateDashboardStats() {
        const today = new Date().toDateString();
        
        // Get today's tokens assigned to this doctor
        const doctorTokens = this.tokens.filter(token => 
            token.doctorId === this.currentUser.doctorId &&
            new Date(token.date).toDateString() === today
        );
        
        // Waiting patients
        const waitingPatients = doctorTokens.filter(token => token.status === 'waiting').length;
        document.getElementById('waitingPatients').textContent = waitingPatients;
        
        // Completed today
        const completedToday = doctorTokens.filter(token => token.status === 'served').length;
        document.getElementById('completedToday').textContent = completedToday;
        
        // Prescriptions today
        const prescriptionsToday = this.prescriptions.filter(prescription => 
            prescription.doctorId === this.currentUser.doctorId &&
            new Date(prescription.date).toDateString() === today
        ).length;
        document.getElementById('prescriptionsToday').textContent = prescriptionsToday;
    }

    updatePatientQueue() {
        const queueContainer = document.getElementById('patientsQueue');
        const queueCount = document.getElementById('queueCount');
        
        // Reload data from localStorage to ensure we have the latest data
        this.loadData();
        
        // Get today's tokens assigned to this doctor
        const today = new Date().toDateString();
        const doctorTokens = this.tokens.filter(token => 
            token.doctorId === this.currentUser.doctorId &&
            new Date(token.date).toDateString() === today
        ).sort((a, b) => a.tokenNumber - b.tokenNumber);
        
        // Enhanced debug logging
        console.log('Doctor Dashboard - updatePatientQueue:', {
            today: today,
            currentDoctorId: this.currentUser.doctorId,
            allTokens: this.tokens.length,
            allTokensDetails: this.tokens.map(t => ({
                id: t.id,
                doctorId: t.doctorId,
                tokenNumber: t.tokenNumber,
                patientName: t.patientName,
                date: new Date(t.date).toDateString(),
                status: t.status
            })),
            doctorTokens: doctorTokens.length,
            doctorTokensDetails: doctorTokens.map(t => ({
                id: t.id,
                doctorId: t.doctorId,
                tokenNumber: t.tokenNumber,
                patientName: t.patientName,
                date: new Date(t.date).toDateString(),
                status: t.status
            })),
            allPatients: this.patients.length,
            patientsDetails: this.patients.map(p => ({
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                registrationDate: p.registrationDate
            }))
        });
        
        queueCount.textContent = doctorTokens.length;
        queueContainer.innerHTML = '';
        
        if (doctorTokens.length === 0) {
            // Check if there are any patients registered today who don't have tokens yet
            const today = new Date().toDateString();
            const todaysPatients = this.patients.filter(patient => 
                new Date(patient.registrationDate).toDateString() === today
            );
            
            if (todaysPatients.length > 0) {
                queueContainer.innerHTML = `
                    <div class="no-patients">
                        <p>No tokens generated for today yet</p>
                        <p><strong>${todaysPatients.length}</strong> patient(s) registered today:</p>
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            ${todaysPatients.map(p => `<li>${p.firstName} ${p.lastName} (${p.phone})</li>`).join('')}
                        </ul>
                        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
                            Note: Tokens need to be generated by the receptionist for patients to appear in the queue.
                        </p>
                    </div>
                `;
            } else {
                queueContainer.innerHTML = '<div class="no-patients">No patients in queue today</div>';
            }
            return;
        }
        
        doctorTokens.forEach(token => {
            const patient = this.patients.find(p => p.id === token.patientId);
            if (patient) {
                const patientCard = document.createElement('div');
                patientCard.className = `patient-card ${token.status}`;
                patientCard.innerHTML = `
                    <div class="patient-info">
                        <h3>Token #${token.tokenNumber}</h3>
                        <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</p>
                        <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender}</p>
                        <p><strong>Type:</strong> ${token.tokenType}</p>
                        <p><strong>Time:</strong> ${new Date(token.date).toLocaleTimeString()}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${token.status}">${token.status.toUpperCase()}</span></p>
                    </div>
                    <div class="patient-actions">
                        <button class="btn btn-primary" onclick="doctorDashboard.viewPatientDetails('${patient.id}', '${token.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${token.status === 'waiting' ? 
                            `<button class="btn btn-success" onclick="doctorDashboard.startConsultation('${token.id}')">
                                <i class="fas fa-play"></i> Start Consultation
                            </button>` : ''
                        }
                    </div>
                `;
                queueContainer.appendChild(patientCard);
            }
        });
    }

    updatePatientDropdown() {
        const patientSelect = document.getElementById('patientSelect');
        patientSelect.innerHTML = '<option value="">Select a patient...</option>';
        
        // Get today's tokens assigned to this doctor (for priority)
        const today = new Date().toDateString();
        const doctorTokens = this.tokens.filter(token => 
            token.doctorId === this.currentUser.doctorId &&
            new Date(token.date).toDateString() === today
        );
        
        // Add patients with tokens first (priority patients)
        const patientsWithTokens = [];
        doctorTokens.forEach(token => {
            const patient = this.patients.find(p => p.id === token.patientId);
            if (patient && !patientsWithTokens.find(p => p.id === patient.id)) {
                patientsWithTokens.push(patient);
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `🎫 ${patient.firstName} ${patient.lastName} - Token #${token.tokenNumber} (Today)`;
                patientSelect.appendChild(option);
            }
        });
        
        // Add a separator if there are patients with tokens
        if (patientsWithTokens.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '--- Other Registered Patients ---';
            patientSelect.appendChild(separator);
        }
        
        // Add all other patients (for consultation history or future prescriptions)
        this.patients.forEach(patient => {
            // Skip if already added with token
            if (!patientsWithTokens.find(p => p.id === patient.id)) {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.firstName} ${patient.lastName} (${patient.phone})`;
                patientSelect.appendChild(option);
            }
        });
    }

    viewPatientDetails(patientId, tokenId = '') {
        const patient = this.patients.find(p => p.id === patientId);
        const token = tokenId ? this.tokens.find(t => t.id === tokenId) : null;
        
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }
        
        this.currentPatient = patient;
        this.currentToken = token;
        
        const patientDetails = document.getElementById('patientDetails');
        patientDetails.innerHTML = `
            <div class="patient-detail-card">
                <h3>${patient.firstName} ${patient.lastName}</h3>
                <div class="detail-row">
                    <span><strong>Age:</strong> ${patient.age}</span>
                    <span><strong>Gender:</strong> ${patient.gender}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Phone:</strong> ${patient.phone}</span>
                    <span><strong>Email:</strong> ${patient.email}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Blood Group:</strong> ${patient.bloodGroup}</span>
                    <span><strong>Emergency Contact:</strong> ${patient.emergencyContact}</span>
                </div>
                <div class="detail-full">
                    <strong>Address:</strong> ${patient.address}
                </div>
                <div class="detail-full">
                    <strong>Medical History:</strong> ${patient.medicalHistory || 'None'}
                </div>
                <div class="detail-full">
                    <strong>Registration Date:</strong> ${new Date(patient.registrationDate).toLocaleDateString()}
                </div>
                ${token ? `
                    <div class="detail-full">
                        <strong>Token Type:</strong> ${token.tokenType}
                    </div>
                    ${token.notes ? `<div class="detail-full"><strong>Token Notes:</strong> ${token.notes}</div>` : ''}
                    <div class="detail-full">
                        <strong>Token Status:</strong> <span class="status-badge ${token.status}">${token.status.toUpperCase()}</span>
                    </div>
                ` : `
                    <div class="detail-full">
                        <strong>Status:</strong> <span class="status-badge no-token">No token for today</span>
                    </div>
                `}
            </div>
        `;
        
        // Update modal footer based on whether patient has a token
        const modalFooter = document.querySelector('#patientModal .modal-footer');
        modalFooter.innerHTML = `
            ${token && token.status === 'waiting' ? 
                '<button class="btn btn-primary" onclick="startConsultation()">Start Consultation</button>' : 
                token ? 
                    `<button class="btn btn-info" disabled>Status: ${token.status.toUpperCase()}</button>` :
                    '<button class="btn btn-warning" disabled>No Token Available</button>'
            }
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        `;
        
        document.getElementById('patientModal').style.display = 'block';
    }

    startConsultation(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (token) {
            token.status = 'in-consultation';
            this.saveData();
            this.updatePatientQueue();
            this.updateDashboardStats();
            this.showNotification('Consultation started', 'success');
        }
    }

    savePrescription() {
        const patientId = document.getElementById('patientSelect').value;
        const consultationDate = document.getElementById('consultationDate').value;
        const symptoms = document.getElementById('symptoms').value;
        const diagnosis = document.getElementById('diagnosis').value;
        const notes = document.getElementById('notes').value;
        
        if (!patientId || !consultationDate || !symptoms || !diagnosis) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }
        
        // Get medicines
        const medicines = this.getMedicinesFromForm();
        if (medicines.length === 0) {
            this.showNotification('Please add at least one medicine', 'error');
            return;
        }
        
        const prescription = {
            id: 'RX' + Date.now().toString(),
            patientId: patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorId: this.currentUser.doctorId,
            doctorName: this.currentUser.name,
            date: consultationDate,
            symptoms: symptoms,
            diagnosis: diagnosis,
            medicines: medicines,
            notes: notes,
            createdAt: new Date().toISOString()
        };
        
        this.prescriptions.push(prescription);
        this.saveData();
        
        // Mark associated token as served
        const token = this.tokens.find(t => t.patientId === patientId && t.status === 'in-consultation');
        if (token) {
            token.status = 'served';
            this.saveData();
        }
        
        this.updateDashboardStats();
        this.updatePatientQueue();
        this.showNotification('Prescription saved successfully', 'success');
        this.clearPrescriptionForm();
    }

    getMedicinesFromForm() {
        const medicines = [];
        const medicineRows = document.querySelectorAll('.medicine-row');
        
        medicineRows.forEach(row => {
            const name = row.querySelector('.medicine-name').value;
            const dosage = row.querySelector('.medicine-dosage').value;
            const frequency = row.querySelector('.medicine-frequency').value;
            const days = row.querySelector('.medicine-days').value;
            
            if (name && dosage && frequency && days) {
                medicines.push({
                    name: name,
                    dosage: dosage,
                    frequency: frequency,
                    days: parseInt(days)
                });
            }
        });
        
        return medicines;
    }

    clearPrescriptionForm() {
        document.getElementById('prescriptionForm').reset();
        document.getElementById('consultationDate').value = new Date().toISOString().split('T')[0];
        
        // Reset medicines to one row
        const container = document.getElementById('medicinesContainer');
        container.innerHTML = `
            <div class="medicine-row">
                <input type="text" placeholder="Medicine name" class="medicine-name" required>
                <input type="text" placeholder="Dosage" class="medicine-dosage" required>
                <input type="text" placeholder="Frequency" class="medicine-frequency" required>
                <input type="number" placeholder="Days" class="medicine-days" required>
                <button type="button" class="btn btn-danger" onclick="removeMedicine(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    loadPatientHistory() {
        const historyContainer = document.getElementById('historyResults');
        historyContainer.innerHTML = '';
        
        // Get all prescriptions by this doctor
        const doctorPrescriptions = this.prescriptions.filter(p => p.doctorId === this.currentUser.doctorId);
        
        if (doctorPrescriptions.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No patient history found</div>';
            return;
        }
        
        doctorPrescriptions.forEach(prescription => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            historyCard.innerHTML = `
                <div class="history-header">
                    <h3>${prescription.patientName}</h3>
                    <span class="history-date">${new Date(prescription.date).toLocaleDateString()}</span>
                </div>
                <div class="history-content">
                    <p><strong>Symptoms:</strong> ${prescription.symptoms}</p>
                    <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
                    <div class="medicines-list">
                        <strong>Medicines:</strong>
                        <ul>
                            ${prescription.medicines.map(med => 
                                `<li>${med.name} - ${med.dosage} (${med.frequency} for ${med.days} days)</li>`
                            ).join('')}
                        </ul>
                    </div>
                    ${prescription.notes ? `<p><strong>Notes:</strong> ${prescription.notes}</p>` : ''}
                </div>
            `;
            historyContainer.appendChild(historyCard);
        });
    }

    updateProfile() {
        const totalTreated = this.tokens.filter(t => t.doctorId === this.currentUser.doctorId && t.status === 'served').length;
        const totalPrescriptions = this.prescriptions.filter(p => p.doctorId === this.currentUser.doctorId).length;
        
        document.getElementById('totalTreated').textContent = totalTreated;
        document.getElementById('totalPrescriptions').textContent = totalPrescriptions;
        
        // Update profile info
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileSpecialty').textContent = this.currentUser.specialization || 'General Physician';
        document.getElementById('profileEmail').textContent = this.currentUser.email || 'doctor@clinic.com';
    }

    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        
        // Get recent activities for this doctor
        const activities = [];
        
        // Add prescription activities
        this.prescriptions
            .filter(p => p.doctorId === this.currentUser.doctorId)
            .slice(0, 5)
            .forEach(prescription => {
                activities.push({
                    text: `Prescribed medicines to ${prescription.patientName}`,
                    timestamp: prescription.createdAt,
                    type: 'prescription'
                });
            });
        
        // Add consultation activities
        this.tokens
            .filter(t => t.doctorId === this.currentUser.doctorId && t.status === 'served')
            .slice(0, 5)
            .forEach(token => {
                activities.push({
                    text: `Completed consultation for ${token.patientName}`,
                    timestamp: token.date,
                    type: 'consultation'
                });
            });
        
        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        container.innerHTML = '';
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-activities">No recent activities</div>';
            return;
        }
        
        activities.slice(0, 10).forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-item';
            activityDiv.innerHTML = `
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
            `;
            container.appendChild(activityDiv);
        });
    }

    showNotification(message, type = 'info') {
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
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    updateAllPatientsList() {
        const allPatientsContainer = document.getElementById('allPatientsList');
        const allPatientsCount = document.getElementById('allPatientsCount');
        
        allPatientsCount.textContent = this.patients.length;
        allPatientsContainer.innerHTML = '';
        
        if (this.patients.length === 0) {
            allPatientsContainer.innerHTML = '<div class="no-patients">No patients registered</div>';
            return;
        }
        
        // Sort patients by registration date (newest first)
        const sortedPatients = [...this.patients].sort((a, b) => 
            new Date(b.registrationDate) - new Date(a.registrationDate)
        );
        
        sortedPatients.forEach(patient => {
            const registrationDate = new Date(patient.registrationDate);
            const isToday = registrationDate.toDateString() === new Date().toDateString();
            
            // Check if patient has a token today
            const todayToken = this.tokens.find(token => 
                token.patientId === patient.id &&
                new Date(token.date).toDateString() === new Date().toDateString()
            );
            
            const patientCard = document.createElement('div');
            patientCard.className = `patient-card ${isToday ? 'today' : 'previous'}`;
            patientCard.innerHTML = `
                <div class="patient-info">
                    <h3>${patient.firstName} ${patient.lastName}</h3>
                    <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender}</p>
                    <p><strong>Phone:</strong> ${patient.phone}</p>
                    <p><strong>Email:</strong> ${patient.email}</p>
                    <p><strong>Blood Group:</strong> ${patient.bloodGroup}</p>
                    <p><strong>Registered:</strong> ${registrationDate.toLocaleDateString()} ${isToday ? '(Today)' : ''}</p>
                    ${patient.medicalHistory ? `<p><strong>Medical History:</strong> ${patient.medicalHistory}</p>` : ''}
                    ${todayToken ? 
                        `<p><strong>Today's Token:</strong> <span class="status-badge ${todayToken.status}">#${todayToken.tokenNumber} - ${todayToken.status.toUpperCase()}</span></p>` : 
                        '<p><strong>Status:</strong> <span class="status-badge no-token">No token today</span></p>'
                    }
                </div>
                <div class="patient-actions">
                    <button class="btn btn-primary" onclick="doctorDashboard.viewPatientDetails('${patient.id}', '${todayToken ? todayToken.id : ''}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${!todayToken ? 
                        `<button class="btn btn-secondary" onclick="doctorDashboard.showTokenRequired('${patient.id}')">
                            <i class="fas fa-ticket-alt"></i> Token Required
                        </button>` : ''
                    }
                </div>
            `;
            allPatientsContainer.appendChild(patientCard);
        });
    }

    showTokenRequired(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
            this.showNotification(
                `${patient.firstName} ${patient.lastName} needs a token from the receptionist to be added to the queue`, 
                'info'
            );
        }
    }
}

// Global functions for HTML onclick events
function switchTab(tabName) {
    doctorDashboard.switchTab(tabName);
}

function refreshQueue() {
    doctorDashboard.loadData(); // Reload all data from localStorage
    doctorDashboard.updatePatientQueue();
    doctorDashboard.updateAllPatientsList();
    doctorDashboard.updateDashboardStats();
    doctorDashboard.showNotification('Queue refreshed - Data reloaded from storage', 'success');
}

function addMedicine() {
    const container = document.getElementById('medicinesContainer');
    const medicineRow = document.createElement('div');
    medicineRow.className = 'medicine-row';
    medicineRow.innerHTML = `
        <input type="text" placeholder="Medicine name" class="medicine-name" required>
        <input type="text" placeholder="Dosage" class="medicine-dosage" required>
        <input type="text" placeholder="Frequency" class="medicine-frequency" required>
        <input type="number" placeholder="Days" class="medicine-days" required>
        <button type="button" class="btn btn-danger" onclick="removeMedicine(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(medicineRow);
}

function removeMedicine(button) {
    const medicineRows = document.querySelectorAll('.medicine-row');
    if (medicineRows.length > 1) {
        button.closest('.medicine-row').remove();
    }
}

function clearForm() {
    doctorDashboard.clearPrescriptionForm();
}

function searchHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const historyCards = document.querySelectorAll('.history-card');
    
    historyCards.forEach(card => {
        const patientName = card.querySelector('h3').textContent.toLowerCase();
        if (patientName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function closeModal() {
    document.getElementById('patientModal').style.display = 'none';
}

function startConsultation() {
    if (doctorDashboard.currentToken) {
        doctorDashboard.startConsultation(doctorDashboard.currentToken.id);
        closeModal();
    } else {
        doctorDashboard.showNotification('No active token found for this patient', 'error');
    }
}

// Initialize dashboard when page loads
let doctorDashboard;
document.addEventListener('DOMContentLoaded', function() {
    doctorDashboard = new DoctorDashboard();
});
