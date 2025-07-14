// Receptionist Dashboard JavaScript
class ReceptionistDashboard {
    constructor() {
        this.currentUser = null;
        this.patients = [];
        this.doctors = [];
        this.tokens = [];
        this.bills = [];
        this.currentTokenNumber = 1;
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
        // Remove active class from all nav items and tab contents
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected nav item and tab content
        document.querySelector(`[data-tab="${tabName}"]`).parentElement.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Update content based on tab
        switch(tabName) {
            case 'tokens':
                this.updateTokensList();
                break;
            case 'reports':
                this.generateReport();
                break;
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
        
        this.showTokenModal(token);
        document.getElementById('tokenForm').reset();
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
        const tokensList = document.getElementById('tokensList');
        const today = new Date().toDateString();
        const todayTokens = this.tokens.filter(t => 
            new Date(t.date).toDateString() === today
        );
        
        tokensList.innerHTML = '';
        
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
                            Mark Served
                        </button>` : ''
                    }
                    <button class="btn btn-sm btn-primary" onclick="receptionistDashboard.printToken('${token.id}')">
                        Print
                    </button>
                </div>
            `;
            tokensList.appendChild(tokenCard);
        });
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
            </div>
        `;
        
        modal.style.display = 'block';
    }

    generateBill() {
        const patientId = document.getElementById('billPatient').value;
        const billDate = document.getElementById('billDate').value;
        
        if (!patientId || !billDate) {
            this.showNotification('Please select patient and bill date', 'error');
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
        
        // Update report display
        document.getElementById('reportTotalPatients').textContent = reportPatients.length;
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

    showNotification(message, type = 'info') {
        // Create notification element
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

    resetTokens() {
        this.currentTokenNumber = 1;
        this.tokens = [];
        this.saveData();
        this.updateTokenStats();
        this.updateTokensList();
        this.showNotification('Tokens reset successfully', 'success');
    }

    printToken(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (token) {
            this.showTokenModal(token);
        }
    }

    printBill(billId) {
        const bill = this.bills.find(b => b.id === billId);
        if (bill) {
            this.showBillModal(bill);
        }
    }

    getDoctorStats() {
        const today = new Date().toDateString();
        const todayTokens = this.tokens.filter(t => 
            new Date(t.date).toDateString() === today
        );
        
        const doctorStats = {};
        
        this.doctors.forEach(doctor => {
            const doctorTokens = todayTokens.filter(t => t.doctorId === doctor.doctorId);
            doctorStats[doctor.doctorId] = {
                name: doctor.name,
                specialization: doctor.specialization,
                totalTokens: doctorTokens.length,
                waitingTokens: doctorTokens.filter(t => t.status === 'waiting').length,
                servedTokens: doctorTokens.filter(t => t.status === 'served').length,
                revenue: doctorTokens.reduce((sum, token) => sum + (token.consultationFee || 500), 0)
            };
        });
        
        return doctorStats;
    }
}

// Global functions for HTML onclick events
function switchTab(tabName) {
    receptionistDashboard.switchTab(tabName);
}

function generateToken() {
    receptionistDashboard.generateToken();
}

function clearRegistrationForm() {
    receptionistDashboard.clearRegistrationForm();
}

function generateNewToken() {
    receptionistDashboard.switchTab('tokens');
}

function resetTokens() {
    receptionistDashboard.resetTokens();
}

function addService() {
    receptionistDashboard.addService();
}

function removeService(button) {
    receptionistDashboard.removeService(button);
}

function clearBillingForm() {
    receptionistDashboard.clearBillingForm();
}

function generateReport() {
    receptionistDashboard.generateReport();
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

// Initialize dashboard when page loads
let receptionistDashboard;
document.addEventListener('DOMContentLoaded', function() {
    receptionistDashboard = new ReceptionistDashboard();
});
