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
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        const role = localStorage.getItem('currentRole');
        
        if (!user || !role || role !== 'doctor') {
            // For development/testing purposes, allow access with a demo user
            console.log('No valid authentication found, using demo user');
            this.currentUser = { name: 'Dr. Smith', doctorId: 'DOC001', specialization: 'General Physician' };
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
        
        // Debug logging
        console.log('Doctor Dashboard - Loaded data:', {
            patients: this.patients.length,
            tokens: this.tokens.length,
            currentUser: this.currentUser
        });
        
        // Load recent activities
        this.loadRecentActivities();
    }

    saveData() {
        localStorage.setItem('clinicPrescriptions', JSON.stringify(this.prescriptions));
        localStorage.setItem('clinicTokens', JSON.stringify(this.tokens));
    }

    initializeUI() {
        this.updatePatientQueue();
        this.updatePatientDropdown();
        this.loadRecentActivities();
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.dataset.tab;
                this.switchTab(tabName);
            });
        });

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
                this.updatePatientQueue();
                break;
            case 'prescriptions':
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
        
        // Get today's tokens assigned to this doctor
        const today = new Date().toDateString();
        const doctorTokens = this.tokens.filter(token => 
            token.doctorId === this.currentUser.doctorId &&
            new Date(token.date).toDateString() === today
        ).sort((a, b) => a.tokenNumber - b.tokenNumber);
        
        // Debug logging
        console.log('Doctor Dashboard - updatePatientQueue:', {
            today: today,
            currentDoctorId: this.currentUser.doctorId,
            allTokens: this.tokens.length,
            doctorTokens: doctorTokens.length,
            doctorTokensDetails: doctorTokens.map(t => ({
                id: t.id,
                doctorId: t.doctorId,
                tokenNumber: t.tokenNumber,
                date: t.date,
                status: t.status
            }))
        });
        
        queueCount.textContent = doctorTokens.length;
        queueContainer.innerHTML = '';
        
        if (doctorTokens.length === 0) {
            queueContainer.innerHTML = '<div class="no-patients">No patients in queue today</div>';
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
        
        // Get today's tokens assigned to this doctor
        const today = new Date().toDateString();
        const doctorTokens = this.tokens.filter(token => 
            token.doctorId === this.currentUser.doctorId &&
            new Date(token.date).toDateString() === today
        );
        
        doctorTokens.forEach(token => {
            const patient = this.patients.find(p => p.id === token.patientId);
            if (patient) {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.firstName} ${patient.lastName} - Token #${token.tokenNumber}`;
                patientSelect.appendChild(option);
            }
        });
    }

    viewPatientDetails(patientId, tokenId) {
        const patient = this.patients.find(p => p.id === patientId);
        const token = this.tokens.find(t => t.id === tokenId);
        
        if (!patient || !token) {
            this.showNotification('Patient or token not found', 'error');
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
                    <strong>Token Type:</strong> ${token.tokenType}
                </div>
                ${token.notes ? `<div class="detail-full"><strong>Notes:</strong> ${token.notes}</div>` : ''}
            </div>
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
}

// Global functions for HTML onclick events
function switchTab(tabName) {
    doctorDashboard.switchTab(tabName);
}

function refreshQueue() {
    doctorDashboard.updatePatientQueue();
    doctorDashboard.updateDashboardStats();
    doctorDashboard.showNotification('Queue refreshed', 'success');
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
    }
}

// Initialize dashboard when page loads
let doctorDashboard;
document.addEventListener('DOMContentLoaded', function() {
    doctorDashboard = new DoctorDashboard();
});
