// Real Notification Service
class NotificationService {
    constructor() {
        this.emailjsConfigured = false;
        this.smsConfigured = false;
        this.initializeServices();
    }

    initializeServices() {
        // Initialize EmailJS
        this.initializeEmailJS();
        
        // Initialize SMS service
        this.initializeSMS();
    }

    initializeEmailJS() {
        try {
            // EmailJS Configuration - COMPLETE ✅
            // Service ID: service_ynknnb3 ✅
            // Public Key: V5F07DjM2XIug70Hk ✅
            // Template ID: template_jbkphqn ✅
            
            const EMAIL_CONFIG = {
                PUBLIC_KEY: 'V5F07DjM2XIug70Hk', // Your EmailJS public key
                SERVICE_ID: 'service_ynknnb3', // Your service ID
                TEMPLATE_ID: 'template_jbkphqn' // Your template ID
            };
            
            if (EMAIL_CONFIG.PUBLIC_KEY !== 'your_emailjs_public_key') {
                emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
                this.emailConfig = EMAIL_CONFIG;
                this.emailjsConfigured = true;
                console.log('✅ EmailJS initialized successfully with real configuration');
            } else {
                console.log('EmailJS not configured - using demo mode');
            }
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
        }
    }

    initializeSMS() {
        // For SMS, we'll use multiple options
        // Option 1: Twilio (requires backend)
        // Option 2: Web SMS API (browser-based, limited)
        // Option 3: WhatsApp API (requires setup)
        
        try {
            // Check if browser supports Web SMS
            if ('sms' in navigator) {
                this.smsConfigured = true;
                console.log('Browser SMS API available');
            } else {
                console.log('Browser SMS API not available - using demo mode');
            }
        } catch (error) {
            console.error('SMS initialization failed:', error);
        }
    }

    async sendEmail(to, subject, message, templateData = {}) {
        if (!this.emailjsConfigured) {
            console.log('Email Demo Mode:', { to, subject, message });
            return { success: false, demo: true, message: 'EmailJS not configured' };
        }

        try {
            const templateParams = {
                to_email: to,
                subject: subject,
                message: message,
                to_name: templateData.patientName || 'Patient',
                clinic_name: 'HealthCare Clinic',
                ...templateData
            };

            const result = await emailjs.send(
                this.emailConfig.SERVICE_ID,
                this.emailConfig.TEMPLATE_ID,
                templateParams
            );

            console.log('Email sent successfully:', result);
            return { success: true, result };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendSMS(to, message) {
        if (!this.smsConfigured) {
            console.log('SMS Demo Mode:', { to, message });
            return { success: false, demo: true, message: 'SMS service not configured' };
        }

        try {
            // Option 1: Browser Web SMS API (limited support)
            if ('sms' in navigator) {
                await navigator.sms.send(to, message);
                return { success: true, method: 'Web SMS API' };
            }
            
            // Option 2: Fallback to WhatsApp Web API
            const whatsappUrl = `https://wa.me/${to.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            return { success: true, method: 'WhatsApp Web', url: whatsappUrl };
            
        } catch (error) {
            console.error('SMS sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Send token notification
    async sendTokenNotification(patient, token) {
        const appointmentTime = token.appointmentTime || 'Walk-in';
        const message = `Dear ${patient.firstName}, your token #${token.tokenNumber} has been generated for consultation with ${token.doctorName} (${token.doctorSpecialization}). ${appointmentTime !== 'Walk-in' ? `Appointment time: ${appointmentTime}` : 'Please wait for your turn.'}. Fee: ₹${token.consultationFee}. Thank you!`;
        
        const results = {};
        
        // Send email if available
        if (patient.email) {
            results.email = await this.sendEmail(
                patient.email,
                'Token Generated - HealthCare Clinic',
                message,
                {
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    tokenNumber: token.tokenNumber,
                    doctorName: token.doctorName,
                    consultationFee: token.consultationFee
                }
            );
        }
        
        // Send SMS if available
        if (patient.phone) {
            results.sms = await this.sendSMS(patient.phone, message);
        }
        
        return results;
    }

    // Send payment reminder
    async sendPaymentReminder(patient, payment) {
        const message = `Dear ${patient.firstName} ${patient.lastName}, this is a reminder that your payment of ₹${payment.amount} is ${payment.status === 'pending' ? 'pending' : 'overdue'}. Please make payment at your earliest convenience. Bill No: ${payment.billNo}`;
        
        const results = {};
        
        // Send email if available
        if (patient.email) {
            results.email = await this.sendEmail(
                patient.email,
                'Payment Reminder - HealthCare Clinic',
                message,
                {
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    billNo: payment.billNo,
                    amount: payment.amount,
                    status: payment.status
                }
            );
        }
        
        // Send SMS if available
        if (patient.phone) {
            results.sms = await this.sendSMS(patient.phone, message);
        }
        
        return results;
    }

    // Send bill generated notification
    async sendBillNotification(patient, bill) {
        const message = `Dear ${patient.firstName} ${patient.lastName}, your bill (${bill.billNumber}) has been generated. Total amount: ₹${bill.total}. Payment status: ${bill.paymentStatus}. Thank you for visiting HealthCare Clinic!`;
        
        const results = {};
        
        // Send email if available
        if (patient.email) {
            results.email = await this.sendEmail(
                patient.email,
                'Bill Generated - HealthCare Clinic',
                message,
                {
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    billNumber: bill.billNumber,
                    total: bill.total,
                    paymentStatus: bill.paymentStatus
                }
            );
        }
        
        // Send SMS if available
        if (patient.phone) {
            results.sms = await this.sendSMS(patient.phone, message);
        }
        
        return results;
    }
}

// Initialize the service
const notificationService = new NotificationService();
