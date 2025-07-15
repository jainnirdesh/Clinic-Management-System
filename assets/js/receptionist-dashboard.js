// Receptionist Dashboard JavaScript
class ReceptionistDashboard {
    constructor() {
        try {
            this.currentUser = null;
            this.patients = [];
            this.doctors = [];
            this.tokens = [];
            this.bills = [];
            this.payments = [];
            this.currentTokenNumber = 1;
            this.init();
        } catch (error) {
            console.error('Error in constructor:', error);
            // Set a basic working state
            this.currentUser = { name: 'Demo Receptionist', employeeId: 'REC001' };
            this.patients = [];
            this.doctors = [];
            this.tokens = [];
            this.bills = [];
            this.payments = [];
            this.currentTokenNumber = 1;
            
            // Try basic initialization
            try {
                this.loadData();
                this.initializeSampleData();
                this.updateDashboardStats();
            } catch (e) {
                console.error('Basic initialization failed:', e);
            }
        }
    }

    init() {
        // Check authentication
        this.checkAuth();
        
        // Load data from localStorage
        this.loadData();
        
        // Initialize sample data if needed
        this.initializeSampleData();
        
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
        
        if (!user || !role || role !== 'receptionist') {
            // For development/testing purposes, allow access with a demo user
            // In production, this should redirect to login
            console.log('No valid authentication found, using demo user');
            this.currentUser = { name: 'Demo Receptionist', employeeId: 'REC001' };
            document.getElementById('receptionistName').textContent = this.currentUser.name;
            return;
        }
        
        this.currentUser = JSON.parse(user);
        document.getElementById('receptionistName').textContent = this.currentUser.name;
    }

    loadData() {
        // Load patients
        this.patients = JSON.parse(localStorage.getItem('clinicPatients') || '[]');
        
        // Load doctors
        this.doctors = JSON.parse(localStorage.getItem('clinicDoctors') || '[]');
        
        // Initialize default doctors if none exist
        if (this.doctors.length === 0) {
            this.initializeDefaultDoctors();
        }
        
        // Load tokens
        this.tokens = JSON.parse(localStorage.getItem('clinicTokens') || '[]');
        
        // Load bills
        this.bills = JSON.parse(localStorage.getItem('clinicBills') || '[]');
        
        // Load notifications
        this.notifications = JSON.parse(localStorage.getItem('clinicNotifications') || '[]');
        
        // Load current token number
        this.currentTokenNumber = parseInt(localStorage.getItem('currentTokenNumber') || '1');
        
        // Update dropdowns
        this.updatePatientDropdowns();
        this.updateDoctorDropdowns();
    }

    saveData() {
        localStorage.setItem('clinicPatients', JSON.stringify(this.patients));
        localStorage.setItem('clinicDoctors', JSON.stringify(this.doctors));
        localStorage.setItem('clinicTokens', JSON.stringify(this.tokens));
        localStorage.setItem('clinicBills', JSON.stringify(this.bills));
        localStorage.setItem('clinicNotifications', JSON.stringify(this.notifications || []));
        localStorage.setItem('currentTokenNumber', this.currentTokenNumber.toString());
    }

    initializeUI() {
        // Initialize navigation
        this.setupNavigation();
        
        // Set today's date for forms
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('billDate').value = today;
        document.getElementById('reportStartDate').value = today;
        document.getElementById('reportEndDate').value = today;
        
        // Update token stats
        this.updateTokenStats();
        
        // Load recent activities
        this.loadRecentActivities();
        
        // Initialize reports tab
        this.initializeReportsTab();
        
        // Initialize notifications panel
        this.updateNotificationPanel();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        try {
            // Remove active class from all nav items and tab contents
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected nav item and tab content
            const navLink = document.querySelector(`[data-tab="${tabName}"]`);
            const tabContent = document.getElementById(tabName);
            
            if (navLink && navLink.parentElement) {
                navLink.parentElement.classList.add('active');
            } else {
                console.error(`Navigation link not found for tab: ${tabName}`);
                return;
            }
            
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.error(`Tab content not found for tab: ${tabName}`);
                return;
            }
            
            // Update content based on tab
            switch(tabName) {
                case 'tokens':
                    this.updateTokensList();
                    break;
                case 'reports':
                    this.initializeReportsTab();
                    break;
                case 'payments':
                    this.loadPaymentHistory();
                    break;
            }
            
            console.log(`Successfully switched to ${tabName} tab`);
            
        } catch (error) {
            console.error('Error switching tab:', error);
            this.showNotification('Error switching tab', 'error');
        }
    }

    setupEventListeners() {
        // Patient registration form
        document.getElementById('patientRegistrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerPatient();
        });

        // Token generation form
        document.getElementById('tokenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateToken();
        });

        // Billing form
        document.getElementById('billingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateBill();
        });

        // Service calculation
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('service-quantity') || e.target.classList.contains('service-rate')) {
                this.calculateServiceAmount(e.target);
            }
        });

        // Doctor selection change handler
        document.getElementById('tokenDoctor').addEventListener('change', (e) => {
            const doctorId = e.target.value;
            if (doctorId) {
                const doctor = this.doctors.find(d => d.doctorId === doctorId);
                if (doctor) {
                    this.showNotification(`Consultation Fee: ₹${doctor.consultationFee || 500}`, 'info');
                }
            }
        });
    }

    updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
        document.getElementById('currentDateTime').textContent = dateTimeString;
    }

    updateDashboardStats() {
        const today = new Date().toDateString();
        
        // Count today's patients
        const todayPatients = this.patients.filter(p => 
            new Date(p.registrationDate).toDateString() === today
        ).length;
        
        // Count today's tokens
        const todayTokens = this.tokens.filter(t => 
            new Date(t.date).toDateString() === today
        ).length;
        
        // Calculate today's revenue
        const todayRevenue = this.bills
            .filter(b => new Date(b.date).toDateString() === today)
            .reduce((sum, bill) => sum + bill.total, 0);
        
        document.getElementById('totalPatientsToday').textContent = todayPatients;
        document.getElementById('tokensGenerated').textContent = todayTokens;
        document.getElementById('todayRevenue').textContent = `₹${todayRevenue.toFixed(2)}`;
        
        // Update notification panel
        this.updateNotificationPanel();
    }

    registerPatient() {
        const formData = new FormData(document.getElementById('patientRegistrationForm'));
        const patientData = Object.fromEntries(formData);
        
        // Generate patient ID
        const patientId = 'P' + Date.now().toString();
        
        const patient = {
            id: patientId,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            emergencyContact: document.getElementById('emergencyContact').value,
            bloodGroup: document.getElementById('bloodGroup').value,
            medicalHistory: document.getElementById('medicalHistory').value,
            registrationDate: new Date().toISOString(),
            registeredBy: this.currentUser.name
        };
        
        this.patients.push(patient);
        this.saveData();
        this.updatePatientDropdowns();
        this.updateDashboardStats();
        this.addRecentActivity(`Registered new patient: ${patient.firstName} ${patient.lastName}`, 'registration');
        
        this.showNotification('Patient registered successfully!', 'success');
        this.clearRegistrationForm();
    }

    clearRegistrationForm() {
        document.getElementById('patientRegistrationForm').reset();
    }

    updatePatientDropdowns() {
        const tokenSelect = document.getElementById('tokenPatient');
        const billSelect = document.getElementById('billPatient');
        
        // Clear existing options
        tokenSelect.innerHTML = '<option value="">Select a patient...</option>';
        billSelect.innerHTML = '<option value="">Select a patient...</option>';
        
        // Add patient options
        this.patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.firstName} ${patient.lastName} - ${patient.phone}`;
            
            tokenSelect.appendChild(option.cloneNode(true));
            billSelect.appendChild(option.cloneNode(true));
        });
    }

    initializeDefaultDoctors() {
        // Add some default doctors for demo purposes
        this.doctors = [
            {
                id: 'DOC001',
                doctorId: 'DOC001',
                name: 'Dr. John Smith',
                specialization: 'General Medicine',
                email: 'doctor@clinic.com',
                phone: '+1-555-0101',
                isActive: true,
                consultationFee: 500,
                experience: 10
            },
            {
                id: 'DOC002',
                doctorId: 'DOC002',
                name: 'Dr. Sarah Wilson',
                specialization: 'Cardiology',
                email: 'sarah.wilson@clinic.com',
                phone: '+1-555-0102',
                isActive: true,
                consultationFee: 800,
                experience: 15
            },
            {
                id: 'DOC003',
                doctorId: 'DOC003',
                name: 'Dr. Michael Brown',
                specialization: 'Pediatrics',
                email: 'michael.brown@clinic.com',
                phone: '+1-555-0103',
                isActive: true,
                consultationFee: 600,
                experience: 12
            },
            {
                id: 'DOC004',
                doctorId: 'DOC004',
                name: 'Dr. Emily Davis',
                specialization: 'Dermatology',
                email: 'emily.davis@clinic.com',
                phone: '+1-555-0104',
                isActive: true,
                consultationFee: 700,
                experience: 8
            },
            {
                id: 'DOC005',
                doctorId: 'DOC005',
                name: 'Dr. Robert Johnson',
                specialization: 'Orthopedics',
                email: 'robert.johnson@clinic.com',
                phone: '+1-555-0105',
                isActive: true,
                consultationFee: 900,
                experience: 18
            }
        ];
        
        // Also load registered doctors from user registrations
        const users = JSON.parse(localStorage.getItem('clinicUsers') || '[]');
        const registeredDoctors = users.filter(user => user.role === 'doctor');
        
        registeredDoctors.forEach(doctor => {
            if (!this.doctors.find(d => d.doctorId === doctor.doctorId)) {
                this.doctors.push({
                    id: doctor.doctorId,
                    doctorId: doctor.doctorId,
                    name: doctor.name,
                    specialization: doctor.specialization || 'General Medicine',
                    email: doctor.email,
                    phone: doctor.phone || 'N/A',
                    isActive: true,
                    consultationFee: 500,
                    experience: doctor.experience || 0
                });
            }
        });
        
        this.saveData();
    }

    initializeSampleData() {
        // Add sample patients if none exist
        if (this.patients.length === 0) {
            const samplePatients = [
                {
                    id: 'P001',
                    firstName: 'John',
                    lastName: 'Doe',
                    age: 35,
                    gender: 'male',
                    phone: '+1-555-0101',
                    email: 'john.doe@email.com',
                    address: '123 Main St, City',
                    emergencyContact: '+1-555-0102',
                    bloodGroup: 'B+',
                    medicalHistory: 'No known allergies',
                    registrationDate: new Date().toISOString(),
                    registeredBy: this.currentUser.name
                },
                {
                    id: 'P002',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    age: 28,
                    gender: 'female',
                    phone: '+1-555-0103',
                    email: 'jane.smith@email.com',
                    address: '456 Oak Ave, City',
                    emergencyContact: '+1-555-0104',
                    bloodGroup: 'A+',
                    medicalHistory: 'Diabetes Type 2',
                    registrationDate: new Date().toISOString(),
                    registeredBy: this.currentUser.name
                }
            ];
            
            this.patients = samplePatients;
            this.saveData();
            this.updatePatientDropdowns();
        }
        
        // Initialize payments array if it doesn't exist
        if (!this.payments) {
            this.payments = [];
        }
        
        // Create payment records for existing bills that don't have payment records
        if (this.bills && this.bills.length > 0) {
            this.bills.forEach(bill => {
                // Check if payment record already exists for this bill
                const existingPayment = this.payments.find(p => p.billId === bill.id);
                
                if (!existingPayment) {
                    // Create payment record for this bill
                    const payment = {
                        id: 'P' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        billId: bill.id,
                        billNo: bill.billNumber,
                        patientId: bill.patientId,
                        amount: bill.total,
                        status: 'pending',
                        paymentMethod: 'Cash',
                        date: bill.date,
                        createdAt: bill.generatedAt || new Date().toISOString(),
                        lastUpdated: bill.generatedAt || new Date().toISOString()
                    };
                    
                    this.payments.push(payment);
                }
            });
            
            // Save the updated payments
            if (this.payments.length > 0) {
                this.saveData();
            }
        }
    }

    updateDoctorDropdowns() {
        const doctorSelect = document.getElementById('tokenDoctor');
        
        if (doctorSelect) {
            // Clear existing options
            doctorSelect.innerHTML = '<option value="">Select a doctor...</option>';
            
            // Add active doctors
            this.doctors.filter(doctor => doctor.isActive).forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.doctorId;
                option.textContent = `${doctor.name} - ${doctor.specialization}`;
                doctorSelect.appendChild(option);
            });
        }
    }

    generateToken() {
        const patientId = document.getElementById('tokenPatient').value;
        const doctorId = document.getElementById('tokenDoctor').value;
        const tokenType = document.getElementById('tokenType').value;
        const appointmentTime = document.getElementById('appointmentTime').value;
        const notes = document.getElementById('tokenNotes').value;
        
        if (!patientId || !doctorId || !tokenType) {
            this.showNotification('Please select patient, doctor, and token type', 'error');
            return;
        }
        
        const patient = this.patients.find(p => p.id === patientId);
        const doctor = this.doctors.find(d => d.doctorId === doctorId);
        
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }
        
        if (!doctor) {
            this.showNotification('Doctor not found', 'error');
            return;
        }
        
        // Generate token number based on doctor (each doctor has their own sequence)
        const doctorTokens = this.tokens.filter(t => t.doctorId === doctorId && 
            new Date(t.date).toDateString() === new Date().toDateString());
        const doctorTokenNumber = doctorTokens.length + 1;
        
        const token = {
            id: 'T' + Date.now().toString(),
            tokenNumber: this.currentTokenNumber,
            doctorTokenNumber: doctorTokenNumber,
            patientId: patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorId: doctorId,
            doctorName: doctor.name,
            doctorSpecialization: doctor.specialization,
            tokenType: tokenType,
            appointmentTime: appointmentTime,
            notes: notes,
            date: new Date().toISOString(),
            status: 'waiting',
            consultationFee: doctor.consultationFee || 500,
            generatedBy: this.currentUser.name
        };
        
        this.tokens.push(token);
        this.currentTokenNumber++;
        this.saveData();
        this.updateTokenStats();
        this.updateTokensList();
        this.updateDashboardStats();
        this.addRecentActivity(`Generated token #${token.tokenNumber} for ${token.patientName} with ${token.doctorName}`, 'token');
        
        // Send notification to patient
        this.sendTokenNotification(token, patient);
        
        this.showTokenModal(token);
        document.getElementById('tokenForm').reset();
    }

    sendTokenNotification(token, patient) {
        const appointmentTime = token.appointmentTime || 'Walk-in';
        const message = `Dear ${patient.firstName}, your token #${token.tokenNumber} has been generated for consultation with ${token.doctorName} (${token.doctorSpecialization}). ${appointmentTime !== 'Walk-in' ? `Appointment time: ${appointmentTime}` : 'Please wait for your turn.'}. Fee: ₹${token.consultationFee}. Thank you!`;
        
        // Send email notification
        if (patient.email) {
            this.sendEmailNotification(patient.email, token, message);
        }
        
        // Send SMS notification
        if (patient.phone) {
            this.sendSMSNotification(patient.phone, token, message);
        }
    }
    
    sendEmailNotification(email, token, message) {
        // Simulate email sending (In real implementation, integrate with email service like SendGrid, Mailgun, etc.)
        console.log('Sending email to:', email);
        console.log('Email content:', message);
        
        // For demonstration, we'll show a notification
        setTimeout(() => {
            this.showNotification(`Email sent to ${email}`, 'success');
        }, 1000);
        
        // Store notification record
        this.addNotificationRecord('email', email, token, message);
    }
    
    sendSMSNotification(phone, token, message) {
        // Simulate SMS sending (In real implementation, integrate with SMS service like Twilio, AWS SNS, etc.)
        console.log('Sending SMS to:', phone);
        console.log('SMS content:', message);
        
        // For demonstration, we'll show a notification
        setTimeout(() => {
            this.showNotification(`SMS sent to ${phone}`, 'success');
        }, 1500);
        
        // Store notification record
        this.addNotificationRecord('sms', phone, token, message);
    }
    
    addNotificationRecord(type, recipient, token, message) {
        const notification = {
            id: 'N' + Date.now().toString(),
            type: type, // 'email' or 'sms'
            recipient: recipient,
            tokenId: token.id,
            tokenNumber: token.tokenNumber,
            patientName: token.patientName,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        
        // Initialize notifications array if it doesn't exist
        if (!this.notifications) {
            this.notifications = [];
        }
        
        this.notifications.push(notification);
        this.saveData();
        
        // Update notification panel
        this.updateNotificationPanel();
        
        // Add to recent activity
        this.addRecentActivity(`${type.toUpperCase()} notification sent to ${token.patientName}`, 'notification');
    }
    
    updateTokenStats() {
        const today = new Date().toDateString();
        const todayTokens = this.tokens.filter(t => 
            new Date(t.date).toDateString() === today
        );
        
        document.getElementById('currentToken').textContent = this.currentTokenNumber;
        document.getElementById('totalTokens').textContent = todayTokens.length;
        document.getElementById('servedTokens').textContent = 
            todayTokens.filter(t => t.status === 'served').length;
    }

    updateTokensList() {
        try {
            const tokensList = document.getElementById('tokensList');
            if (!tokensList) {
                console.error('tokensList element not found');
                return;
            }
            
            const today = new Date().toDateString();
            const todayTokens = this.tokens.filter(t => 
                new Date(t.date).toDateString() === today
            );
            
            tokensList.innerHTML = '';
            
            if (todayTokens.length === 0) {
                tokensList.innerHTML = '<p class="no-tokens">No tokens generated today</p>';
                return;
            }
            
            todayTokens.forEach(token => {
                const tokenCard = document.createElement('div');
                tokenCard.className = `token-card ${token.status}`;
                tokenCard.innerHTML = `
                    <div class="token-header">
                        <span class="token-number">#${token.tokenNumber}</span>
                        <span class="token-status">${token.status.toUpperCase()}</span>
                    </div>
                    <div class="token-details">
                        <p><strong>Patient:</strong> ${token.patientName}</p>
                        <p><strong>Doctor:</strong> ${token.doctorName || 'Not Assigned'}</p>
                        <p><strong>Specialization:</strong> ${token.doctorSpecialization || 'N/A'}</p>
                        <p><strong>Type:</strong> ${token.tokenType}</p>
                        <p><strong>Time:</strong> ${new Date(token.date).toLocaleTimeString()}</p>
                        ${token.appointmentTime ? `<p><strong>Preferred Time:</strong> ${token.appointmentTime}</p>` : ''}
                        ${token.notes ? `<p><strong>Notes:</strong> ${token.notes}</p>` : ''}
                        <p><strong>Fee:</strong> ₹${token.consultationFee || 500}</p>
                    </div>
                    <div class="token-actions">
                        ${token.status === 'waiting' ? 
                            `<button class="btn btn-sm btn-success" onclick="receptionistDashboard.markTokenServed('${token.id}')">
                                <i class="fas fa-check"></i> Mark Served
                            </button>` : ''
                        }
                        <button class="btn btn-sm btn-info" onclick="receptionistDashboard.createBillFromToken('${token.id}')">
                            <i class="fas fa-file-invoice-dollar"></i> Create Bill
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.printToken('${token.id}')">
                            <i class="fas fa-print"></i> Print
                        </button>
                    </div>
                `;
                tokensList.appendChild(tokenCard);
            });
        } catch (error) {
            console.error('Error updating tokens list:', error);
            // Don't redirect, just show error
            const tokensList = document.getElementById('tokensList');
            if (tokensList) {
                tokensList.innerHTML = '<p class="error">Error loading tokens list</p>';
            }
        }
    }

    markTokenServed(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (token) {
            token.status = 'served';
            this.saveData();
            this.updateTokenStats();
            this.updateTokensList();
            this.addRecentActivity(`Marked token #${token.tokenNumber} as served`, 'served');
            this.showNotification('Token marked as served', 'success');
        }
    }

    showTokenModal(token) {
        const modal = document.getElementById('tokenModal');
        const tokenPrint = document.getElementById('tokenPrint');
        
        tokenPrint.innerHTML = `
            <div class="token-receipt">
                <h2>HealthCare Clinic</h2>
                <p>Token Number: <strong>#${token.tokenNumber}</strong></p>
                <p>Patient: ${token.patientName}</p>
                <p>Doctor: ${token.doctorName || 'Not Assigned'}</p>
                <p>Specialization: ${token.doctorSpecialization || 'N/A'}</p>
                <p>Type: ${token.tokenType}</p>
                <p>Date: ${new Date(token.date).toLocaleDateString()}</p>
                <p>Time: ${new Date(token.date).toLocaleTimeString()}</p>
                ${token.appointmentTime ? `<p>Preferred Time: ${token.appointmentTime}</p>` : ''}
                ${token.notes ? `<p>Notes: ${token.notes}</p>` : ''}
                <p>Consultation Fee: ₹${token.consultationFee || 500}</p>
                <hr>
                <p><strong>Please wait for your turn</strong></p>
                <p>Present this token to the doctor</p>
                <div class="token-actions">
                    <button class="btn btn-success" onclick="receptionistDashboard.createBillFromToken('${token.id}')">
                        <i class="fas fa-file-invoice-dollar"></i>
                        Create Bill
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    generateBill() {
        const patientId = document.getElementById('billPatient').value;
        const billDate = document.getElementById('billDate').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        
        if (!patientId || !billDate || !paymentMethod) {
            this.showNotification('Please select patient, bill date, and payment method', 'error');
            return;
        }
        
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }
        
        // Get services
        const services = this.getServicesFromForm();
        if (services.length === 0) {
            this.showNotification('Please add at least one service', 'error');
            return;
        }
        
        const subtotal = services.reduce((sum, service) => sum + service.amount, 0);
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + tax;
        
        const bill = {
            id: 'B' + Date.now().toString(),
            billNumber: 'BILL-' + Date.now().toString().slice(-6),
            patientId: patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            date: billDate,
            services: services,
            subtotal: subtotal,
            tax: tax,
            total: total,
            generatedBy: this.currentUser.name,
            generatedAt: new Date().toISOString()
        };
        
        this.bills.push(bill);
        
        // Create corresponding payment record
        const payment = {
            id: 'P' + Date.now().toString(),
            billId: bill.id,
            billNo: bill.billNumber,
            patientId: patientId,
            amount: total,
            status: 'pending',
            paymentMethod: paymentMethod,
            date: billDate,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        // Initialize payments array if it doesn't exist
        if (!this.payments) {
            this.payments = [];
        }
        
        this.payments.push(payment);
        
        this.saveData();
        this.updateDashboardStats();
        this.addRecentActivity(`Generated bill ${bill.billNumber} for ${bill.patientName} - ₹${total.toFixed(2)}`, 'billing');
        
        this.showBillModal(bill);
        this.clearBillingForm();
    }

    getServicesFromForm() {
        const services = [];
        const serviceRows = document.querySelectorAll('.service-row');
        
        serviceRows.forEach(row => {
            const name = row.querySelector('.service-name').value;
            const quantity = parseInt(row.querySelector('.service-quantity').value);
            const rate = parseFloat(row.querySelector('.service-rate').value);
            
            if (name && quantity && rate) {
                services.push({
                    name: name,
                    quantity: quantity,
                    rate: rate,
                    amount: quantity * rate
                });
            }
        });
        
        return services;
    }

    calculateServiceAmount(input) {
        const row = input.closest('.service-row');
        const quantity = parseFloat(row.querySelector('.service-quantity').value) || 0;
        const rate = parseFloat(row.querySelector('.service-rate').value) || 0;
        const amount = quantity * rate;
        
        row.querySelector('.service-amount').value = amount.toFixed(2);
        this.calculateBillTotal();
    }

    calculateBillTotal() {
        const services = this.getServicesFromForm();
        const subtotal = services.reduce((sum, service) => sum + service.amount, 0);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;
        
        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
    }

    addService() {
        const container = document.getElementById('servicesContainer');
        const serviceRow = document.createElement('div');
        serviceRow.className = 'service-row';
        serviceRow.innerHTML = `
            <input type="text" placeholder="Service/Item" class="service-name" required>
            <input type="number" placeholder="Quantity" class="service-quantity" min="1" value="1" required>
            <input type="number" placeholder="Rate" class="service-rate" min="0" step="0.01" required>
            <input type="number" placeholder="Amount" class="service-amount" readonly>
            <button type="button" class="btn btn-danger" onclick="receptionistDashboard.removeService(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(serviceRow);
    }

    addPredefinedService(serviceName, rate) {
        const container = document.getElementById('servicesContainer');
        const serviceRow = document.createElement('div');
        serviceRow.className = 'service-row';
        serviceRow.innerHTML = `
            <input type="text" placeholder="Service/Item" class="service-name" value="${serviceName}" required>
            <input type="number" placeholder="Quantity" class="service-quantity" min="1" value="1" required>
            <input type="number" placeholder="Rate" class="service-rate" min="0" step="0.01" value="${rate}" required>
            <input type="number" placeholder="Amount" class="service-amount" value="${rate}" readonly>
            <button type="button" class="btn btn-danger" onclick="receptionistDashboard.removeService(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(serviceRow);
        
        // Set up event listeners for the new row
        const quantityInput = serviceRow.querySelector('.service-quantity');
        const rateInput = serviceRow.querySelector('.service-rate');
        const amountInput = serviceRow.querySelector('.service-amount');
        
        const updateAmount = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            amountInput.value = (quantity * rate).toFixed(2);
            this.calculateBillTotal();
        };
        
        quantityInput.addEventListener('input', updateAmount);
        rateInput.addEventListener('input', updateAmount);
        
        this.calculateBillTotal();
    }

    removeService(button) {
        button.closest('.service-row').remove();
        this.calculateBillTotal();
    }

    showBillModal(bill) {
        const modal = document.getElementById('billModal');
        const billPrint = document.getElementById('billPrint');
        
        let servicesHTML = '';
        bill.services.forEach(service => {
            servicesHTML += `
                <tr>
                    <td>${service.name}</td>
                    <td>${service.quantity}</td>
                    <td>₹${service.rate.toFixed(2)}</td>
                    <td>₹${service.amount.toFixed(2)}</td>
                </tr>
            `;
        });
        
        billPrint.innerHTML = `
            <div class="bill-receipt">
                <h2>HealthCare Clinic</h2>
                <p>Bill No: ${bill.billNumber}</p>
                <p>Patient: ${bill.patientName}</p>
                <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
                <hr>
                <table class="bill-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesHTML}
                    </tbody>
                </table>
                <hr>
                <div class="bill-summary">
                    <p>Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
                    <p>Tax (18%): ₹${bill.tax.toFixed(2)}</p>
                    <p><strong>Total: ₹${bill.total.toFixed(2)}</strong></p>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    clearBillingForm() {
        document.getElementById('billingForm').reset();
        document.getElementById('servicesContainer').innerHTML = `
            <div class="service-row">
                <input type="text" placeholder="Service/Item" class="service-name" required>
                <input type="number" placeholder="Quantity" class="service-quantity" min="1" value="1" required>
                <input type="number" placeholder="Rate" class="service-rate" min="0" step="0.01" required>
                <input type="number" placeholder="Amount" class="service-amount" readonly>
                <button type="button" class="btn btn-danger" onclick="receptionistDashboard.removeService(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        this.calculateBillTotal();
    }

    initializeReportsTab() {
        // Set default date range (last 7 days)
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const startDateInput = document.getElementById('reportStartDate');
        const endDateInput = document.getElementById('reportEndDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = weekAgo.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
        
        // Generate default report
        this.generateDefaultReport();
    }

    generateDefaultReport() {
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Filter data for last 30 days
        const reportPatients = this.patients.filter(p => {
            const regDate = new Date(p.registrationDate);
            return regDate >= monthAgo && regDate <= today;
        });
        
        const reportBills = this.bills.filter(b => {
            const billDate = new Date(b.date);
            return billDate >= monthAgo && billDate <= today;
        });
        
        const reportTokens = this.tokens.filter(t => {
            const tokenDate = new Date(t.date);
            return tokenDate >= monthAgo && tokenDate <= today;
        });
        
        // Calculate statistics
        const totalRevenue = reportBills.reduce((sum, bill) => sum + bill.total, 0);
        const avgBill = reportBills.length > 0 ? totalRevenue / reportBills.length : 0;
        const highestBill = reportBills.length > 0 ? Math.max(...reportBills.map(b => b.total)) : 0;
        const followUps = reportTokens.filter(t => t.tokenType === 'follow-up').length;
        
        // Update report display
        document.getElementById('reportTotalPatients').textContent = reportPatients.length;
        document.getElementById('reportNewPatients').textContent = reportPatients.length;
        document.getElementById('reportFollowUps').textContent = followUps;
        document.getElementById('reportTotalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
        document.getElementById('reportAvgBill').textContent = `₹${avgBill.toFixed(2)}`;
        document.getElementById('reportHighestBill').textContent = `₹${highestBill.toFixed(2)}`;
        
        // Generate charts if available
        this.generateCharts(reportPatients, reportBills);
    }

    generateReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        if (!startDate || !endDate) {
            this.showNotification('Please select start and end dates', 'error');
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Filter data by date range
        const reportPatients = this.patients.filter(p => {
            const regDate = new Date(p.registrationDate);
            return regDate >= start && regDate <= end;
        });
        
        const reportBills = this.bills.filter(b => {
            const billDate = new Date(b.date);
            return billDate >= start && billDate <= end;
        });
        
        const reportTokens = this.tokens.filter(t => {
            const tokenDate = new Date(t.date);
            return tokenDate >= start && tokenDate <= end;
        });
        
        // Calculate statistics
        const totalRevenue = reportBills.reduce((sum, bill) => sum + bill.total, 0);
        const avgBill = reportBills.length > 0 ? totalRevenue / reportBills.length : 0;
        const highestBill = reportBills.length > 0 ? Math.max(...reportBills.map(b => b.total)) : 0;
        const followUps = reportTokens.filter(t => t.tokenType === 'follow-up').length;
        
        // Total patients is all patients that have been registered
        const totalPatientsEver = this.patients.length;
        
        // Update report display
        document.getElementById('reportTotalPatients').textContent = totalPatientsEver;
        document.getElementById('reportNewPatients').textContent = reportPatients.length;
        document.getElementById('reportFollowUps').textContent = followUps;
        document.getElementById('reportTotalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
        document.getElementById('reportAvgBill').textContent = `₹${avgBill.toFixed(2)}`;
        document.getElementById('reportHighestBill').textContent = `₹${highestBill.toFixed(2)}`;
        
        // Generate charts
        this.generateCharts(reportPatients, reportBills);
    }

    generateCharts(patients, bills) {
        // Patient chart
        const patientCtx = document.getElementById('patientChart').getContext('2d');
        new Chart(patientCtx, {
            type: 'line',
            data: {
                labels: this.getDateLabels(patients),
                datasets: [{
                    label: 'Patients',
                    data: this.getPatientCounts(patients),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Revenue chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: this.getDateLabels(bills),
                datasets: [{
                    label: 'Revenue',
                    data: this.getRevenueCounts(bills),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getDateLabels(data) {
        const dates = [...new Set(data.map(item => 
            new Date(item.registrationDate || item.date).toLocaleDateString()
        ))];
        return dates.sort();
    }

    getPatientCounts(patients) {
        const counts = {};
        patients.forEach(patient => {
            const date = new Date(patient.registrationDate).toLocaleDateString();
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.values(counts);
    }

    getRevenueCounts(bills) {
        const counts = {};
        bills.forEach(bill => {
            const date = new Date(bill.date).toLocaleDateString();
            counts[date] = (counts[date] || 0) + bill.total;
        });
        return Object.values(counts);
    }

    addRecentActivity(activity, type = 'general') {
        const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        activities.unshift({
            activity: activity,
            type: type,
            timestamp: new Date().toISOString(),
            user: this.currentUser.name
        });
        
        // Keep only last 10 activities
        activities.splice(10);
        localStorage.setItem('recentActivities', JSON.stringify(activities));
        this.loadRecentActivities();
    }

    loadRecentActivities() {
        const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        const container = document.getElementById('recentActivities');
        
        container.innerHTML = '';
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-activities">No recent activities</div>';
            return;
        }
        
        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-item';
            activityDiv.setAttribute('data-type', activity.type || 'general');
            activityDiv.innerHTML = `
                <div class="activity-text">${activity.activity}</div>
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
            `;
            container.appendChild(activityDiv);
        });
    }

    updateNotificationPanel() {
        const notificationsList = document.getElementById('recentNotifications');
        if (!notificationsList) return;
        
        // Initialize notifications array if it doesn't exist
        if (!this.notifications) {
            this.notifications = [];
        }
        
        // Get recent notifications (last 10)
        const recentNotifications = this.notifications
            .slice(-10)
            .reverse();
        
        if (recentNotifications.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications">No recent notifications</div>';
            return;
        }
        
        notificationsList.innerHTML = recentNotifications.map(notification => `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-type ${notification.type}">
                        <i class="fas fa-${notification.type === 'email' ? 'envelope' : 'sms'}"></i>
                        ${notification.type.toUpperCase()}
                    </div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-recipient">To: ${notification.recipient}</div>
                    <span class="notification-status ${notification.status}">${notification.status}</span>
                </div>
                <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
        
        // Add notification stats
        const emailCount = this.notifications.filter(n => n.type === 'email').length;
        const smsCount = this.notifications.filter(n => n.type === 'sms').length;
        const todayCount = this.notifications.filter(n => 
            new Date(n.timestamp).toDateString() === new Date().toDateString()
        ).length;
        
        const statsHtml = `
            <div class="notification-stats">
                <div class="notification-stat">
                    <div class="notification-stat-value">${emailCount}</div>
                    <div class="notification-stat-label">Emails</div>
                </div>
                <div class="notification-stat">
                    <div class="notification-stat-value">${smsCount}</div>
                    <div class="notification-stat-label">SMS</div>
                </div>
                <div class="notification-stat">
                    <div class="notification-stat-value">${todayCount}</div>
                    <div class="notification-stat-label">Today</div>
                </div>
            </div>
        `;
        
        notificationsList.innerHTML += statsHtml;
    }

    resetTokens() {
        // Confirm with user before resetting
        if (confirm('Are you sure you want to reset today\'s tokens? This action cannot be undone.')) {
            const today = new Date().toDateString();
            
            // Remove today's tokens
            this.tokens = this.tokens.filter(token => 
                new Date(token.date).toDateString() !== today
            );
            
            // Reset token counter to 1
            this.currentTokenNumber = 1;
            
            // Save data
            this.saveData();
            
            // Update UI
            this.updateTokenStats();
            this.updateTokensList();
            this.updateDashboardStats();
            
            // Add activity log
            this.addRecentActivity('Reset today\'s tokens', 'system');
            
            // Show success message
            this.showNotification('Today\'s tokens have been reset successfully', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    createBillFromToken(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (!token) {
            this.showNotification('Token not found', 'error');
            return;
        }

        // Pre-fill billing form with token data
        const patient = this.patients.find(p => p.id === token.patientId);
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }

        // Switch to billing tab
        this.switchTab('billing');

        // Fill the form
        setTimeout(() => {
            const patientSelect = document.getElementById('bill-patient');
            const billDate = document.getElementById('bill-date');
            
            if (patientSelect) {
                patientSelect.value = patient.id;
            }
            
            if (billDate) {
                billDate.value = new Date().toISOString().split('T')[0];
            }

            // Add consultation service based on token type
            const serviceType = token.type === 'emergency' ? 'Emergency Consultation' : 
                              token.type === 'regular' ? 'Regular Consultation' : 
                              'Consultation';
            
            const serviceRate = token.type === 'emergency' ? 1000 : 500;
            
            // Add service to billing
            this.addPredefinedService(serviceType, serviceRate);
            
            this.showNotification('Bill form pre-filled with token data', 'success');
        }, 100);
    }

    printToken(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (!token) {
            this.showNotification('Token not found', 'error');
            return;
        }

        // Show token modal first
        this.showTokenModal(token);
        
        // Print after a short delay
        setTimeout(() => {
            window.print();
        }, 500);
    }

    sendPaymentReminder() {
        // Get the payment ID from the payment details modal
        const paymentId = document.getElementById('payment-id')?.textContent;
        if (!paymentId) {
            this.showNotification('Please select a payment first', 'error');
            return;
        }

        const payment = this.payments.find(p => p.id === paymentId);
        if (!payment) {
            this.showNotification('Payment not found', 'error');
            return;
        }

        const patient = this.patients.find(p => p.id === payment.patientId);
        if (!patient) {
            this.showNotification('Patient not found', 'error');
            return;
        }

        // Send reminder (simulated)
        const reminderMessage = `Dear ${patient.firstName} ${patient.lastName}, this is a reminder that your payment of ₹${payment.amount} is ${payment.status === 'pending' ? 'pending' : 'overdue'}. Please make payment at your earliest convenience.`;
        
        // Add notification record
        this.addNotificationRecord('payment_reminder', patient.email || patient.phone, payment, reminderMessage);
        
        // Update payment with reminder sent
        payment.lastReminderSent = new Date().toISOString();
        payment.reminderCount = (payment.reminderCount || 0) + 1;
        
        // Save data
        this.saveData();
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Show success message
        this.showNotification(`Payment reminder sent to ${patient.firstName} ${patient.lastName}`, 'success');
        
        // Close payment modal
        this.closePaymentModal();
    }

    loadPaymentHistory() {
        // Load payment history for the payments tab
        try {
            // Initialize payments array if it doesn't exist
            if (!this.payments) {
                this.payments = [];
            }
            
            // Update payment statistics
            this.updatePaymentStats();
            
            // Load payment table
            this.loadPaymentTable();
            
            console.log('Payment history loaded successfully');
        } catch (error) {
            console.error('Error loading payment history:', error);
            this.showNotification('Error loading payment history', 'error');
        }
    }

    updatePaymentStats() {
        // Calculate payment statistics
        const totalPayments = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const pendingPayments = this.payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
        const overduePayments = this.payments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);
        const collectionRate = totalPayments > 0 ? ((totalPayments - pendingPayments - overduePayments) / totalPayments * 100).toFixed(0) : 0;

        // Update payment stats in UI
        const statsElements = {
            'totalPayments': `₹${totalPayments.toFixed(2)}`,
            'pendingPayments': `₹${pendingPayments.toFixed(2)}`,
            'overduePayments': `₹${overduePayments.toFixed(2)}`,
            'collectionRate': `${collectionRate}%`
        };

        Object.entries(statsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    loadPaymentTable() {
        // Load payment table with existing payment data
        const paymentTableBody = document.getElementById('paymentsTableBody');
        if (!paymentTableBody) return;

        paymentTableBody.innerHTML = '';

        if (this.payments.length === 0) {
            paymentTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payment records found</td></tr>';
            return;
        }

        this.payments.forEach(payment => {
            const patient = this.patients.find(p => p.id === payment.patientId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.billNo}</td>
                <td>${patient ? patient.name : 'Unknown Patient'}</td>
                <td>₹${payment.amount.toFixed(2)}</td>
                <td>${payment.paymentMethod || 'Cash'}</td>
                <td><span class="badge ${payment.status === 'paid' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${payment.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showPaymentDetails('${payment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            paymentTableBody.appendChild(row);
        });
    }

    filterPayments() {
        // Get filter values
        const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';
        const fromDate = document.getElementById('paymentFromDate')?.value;
        const toDate = document.getElementById('paymentToDate')?.value;
        
        // Filter payments based on criteria
        let filteredPayments = [...this.payments];
        
        // Filter by status
        if (statusFilter !== 'all') {
            filteredPayments = filteredPayments.filter(payment => payment.status === statusFilter);
        }
        
        // Filter by date range
        if (fromDate) {
            filteredPayments = filteredPayments.filter(payment => 
                new Date(payment.date) >= new Date(fromDate)
            );
        }
        
        if (toDate) {
            filteredPayments = filteredPayments.filter(payment => 
                new Date(payment.date) <= new Date(toDate)
            );
        }
        
        // Update the payment table with filtered results
        this.displayFilteredPayments(filteredPayments);
        
        // Show notification about filter results
        this.showNotification(`Found ${filteredPayments.length} payment(s) matching your criteria`, 'info');
    }
    
    displayFilteredPayments(payments) {
        const paymentTableBody = document.getElementById('paymentsTableBody');
        if (!paymentTableBody) return;

        paymentTableBody.innerHTML = '';

        if (payments.length === 0) {
            paymentTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found matching the filter criteria</td></tr>';
            return;
        }

        payments.forEach(payment => {
            const patient = this.patients.find(p => p.id === payment.patientId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.billNo}</td>
                <td>${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}</td>
                <td>₹${payment.amount.toFixed(2)}</td>
                <td>${payment.paymentMethod || 'Cash'}</td>
                <td><span class="badge ${payment.status === 'paid' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${payment.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showPaymentDetails('${payment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            paymentTableBody.appendChild(row);
        });
    }

    searchPayments() {
        // Get search query
        const searchQuery = document.getElementById('paymentSearch')?.value.toLowerCase().trim() || '';
        
        if (!searchQuery) {
            // If no search query, show all payments
            this.loadPaymentTable();
            return;
        }
        
        // Search through payments
        const filteredPayments = this.payments.filter(payment => {
            const patient = this.patients.find(p => p.id === payment.patientId);
            const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
            const billNo = payment.billNo.toLowerCase();
            const paymentMethod = (payment.paymentMethod || '').toLowerCase();
            const status = payment.status.toLowerCase();
            
            return patientName.includes(searchQuery) || 
                   billNo.includes(searchQuery) || 
                   paymentMethod.includes(searchQuery) || 
                   status.includes(searchQuery);
        });
        
        // Display filtered results
        this.displayFilteredPayments(filteredPayments);
        
        // Show notification about search results
        this.showNotification(`Found ${filteredPayments.length} payment(s) matching "${searchQuery}"`, 'info');
    }
    
    exportPaymentHistory() {
        try {
            // Get current date for filename
            const today = new Date().toISOString().split('T')[0];
            
            // Prepare CSV data
            const csvData = [];
            csvData.push(['Date', 'Bill No.', 'Patient', 'Amount', 'Payment Method', 'Status']);
            
            // Add payment data
            this.payments.forEach(payment => {
                const patient = this.patients.find(p => p.id === payment.patientId);
                csvData.push([
                    new Date(payment.date).toLocaleDateString(),
                    payment.billNo,
                    patient ? patient.name : 'Unknown Patient',
                    payment.amount.toFixed(2),
                    payment.paymentMethod || 'Cash',
                    payment.status
                ]);
            });
            
            // Convert to CSV string
            const csvString = csvData.map(row => row.join(',')).join('\n');
            
            // Create and download file
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payment-history-${today}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Show success message
            this.showNotification('Payment history exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting payment history:', error);
            this.showNotification('Error exporting payment history', 'error');
        }
    }

    closePaymentModal() {
        // Close payment details modal
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
            paymentModal.style.display = 'none';
        }
        
        // Clear any modal data
        const paymentId = document.getElementById('payment-id');
        if (paymentId) {
            paymentId.textContent = '';
        }
    }

    updatePaymentStatus() {
        // Get the payment ID from the modal
        const paymentId = document.getElementById('payment-id')?.textContent;
        if (!paymentId) {
            this.showNotification('Please select a payment first', 'error');
            return;
        }
        
        // Get the new status from the modal
        const newStatus = document.getElementById('payment-status-select')?.value;
        if (!newStatus) {
            this.showNotification('Please select a status', 'error');
            return;
        }
        
        // Find and update the payment
        const payment = this.payments.find(p => p.id === paymentId);
        if (!payment) {
            this.showNotification('Payment not found', 'error');
            return;
        }
        
        // Update payment status
        const oldStatus = payment.status;
        payment.status = newStatus;
        payment.lastUpdated = new Date().toISOString();
        
        // Save data
        this.saveData();
        
        // Update UI
        this.loadPaymentTable();
        this.updatePaymentStats();
        this.updateDashboardStats();
        
        // Add activity log
        const patient = this.patients.find(p => p.id === payment.patientId);
        const patientName = patient ? patient.name : 'Unknown Patient';
        this.addRecentActivity(`Payment status updated: ${patientName} - ${oldStatus} → ${newStatus}`, 'payment');
        
        // Show success message
        this.showNotification(`Payment status updated to ${newStatus}`, 'success');
        
        // Close modal
        this.closePaymentModal();
    }

    // ...existing code...
}

// Global functions for HTML onclick events
function switchTab(tabName) {
    if (receptionistDashboard) {
        receptionistDashboard.switchTab(tabName);
    } else {
        console.error('Dashboard not initialized');
        // Try to initialize if not already done
        setTimeout(() => {
            if (receptionistDashboard) {
                receptionistDashboard.switchTab(tabName);
            } else {
                alert('Dashboard not ready. Please refresh the page.');
            }
        }, 100);
    }
}

function generateToken() {
    if (receptionistDashboard) {
        receptionistDashboard.generateToken();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function clearRegistrationForm() {
    if (receptionistDashboard) {
        receptionistDashboard.clearRegistrationForm();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function generateNewToken() {
    if (receptionistDashboard) {
        receptionistDashboard.switchTab('tokens');
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function resetTokens() {
    if (receptionistDashboard) {
        receptionistDashboard.resetTokens();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function addService() {
    if (receptionistDashboard) {
        receptionistDashboard.addService();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function clearBillingForm() {
    if (receptionistDashboard) {
        receptionistDashboard.clearBillingForm();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function generateReport() {
    if (receptionistDashboard) {
        receptionistDashboard.generateReport();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function closeTokenModal() {
    document.getElementById('tokenModal').style.display = 'none';
}

function closeBillModal() {
    document.getElementById('billModal').style.display = 'none';
}

function printToken() {
    window.print();
}

function printBill() {
    window.print();
}

function updatePaymentStatus() {
    if (receptionistDashboard) {
        receptionistDashboard.updatePaymentStatus();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function closePaymentModal() {
    if (receptionistDashboard) {
        receptionistDashboard.closePaymentModal();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function filterPayments() {
    if (receptionistDashboard) {
        receptionistDashboard.filterPayments();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function exportPaymentHistory() {
    if (receptionistDashboard) {
        receptionistDashboard.exportPaymentHistory();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function sendPaymentReminder() {
    if (receptionistDashboard) {
        receptionistDashboard.sendPaymentReminder();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

function searchPayments() {
    if (receptionistDashboard) {
        receptionistDashboard.searchPayments();
    } else {
        console.error('Dashboard not initialized');
        alert('Dashboard not ready. Please try again.');
    }
}

// Initialize dashboard when page loads
let receptionistDashboard;
let dashboardReady = false;

document.addEventListener('DOMContentLoaded', function() {
    try {
        receptionistDashboard = new ReceptionistDashboard();
        dashboardReady = true;
        
        // Make dashboard globally accessible for debugging
        window.receptionistDashboard = receptionistDashboard;
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error initializing dashboard. Please refresh the page.');
    }
});
