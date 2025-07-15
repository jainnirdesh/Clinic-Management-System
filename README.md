# Clinic Management System

A comprehensive clinic management system with separate dashboards for receptionists and doctors, featuring real-time notifications, billing management, and patient token tracking.

## Features

### Receptionist Dashboard
- **Patient Registration**: Register new patients with complete medical information
- **Token Management**: Generate and manage patient tokens for consultations
- **Billing System**: Create bills with service dropdown and automatic rate calculation
- **Payment Tracking**: Track payment status and generate payment reminders
- **Real-time Notifications**: Email notifications for token generation and payment reminders

### Doctor Dashboard
- **Patient Queue**: View waiting patients and their token information
- **Consultation Management**: Start consultations and update patient status
- **Prescription System**: Create and manage prescriptions with medicine details
- **Patient History**: Access patient medical history and previous consultations

### Notification System
- **Email Integration**: Real email notifications using EmailJS
- **SMS Support**: SMS notification capability (configurable)
- **WhatsApp Integration**: WhatsApp Business API support (configurable)
- **Notification History**: View recent notifications with status tracking

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with modern design patterns
- **Charts**: Chart.js for analytics and reporting
- **Email Service**: EmailJS for real email notifications
- **Storage**: LocalStorage for data persistence

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <https://github.com/jainnirdesh/Clinic-Management-System>
cd clinic-management-system
```

### 2. Install Dependencies (Optional)
```bash
npm install
```

### 3. Configure Email Notifications
1. Create an account on [EmailJS](https://www.emailjs.com/)
2. Set up your email service (Gmail, Outlook, etc.)
3. Create email templates for:
   - Token generation notifications
   - Payment reminders
4. Update the configuration in `assets/js/notification-service.js`

### 4. Run Locally
```bash
npm start
# or simply open index.html in a web browser
```

## Deployment

### Deploy to Vercel
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy the project:
```bash
vercel --prod
```

### Manual Deployment
The project is a static website and can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## Usage

### Default Login Credentials
- **Receptionist**: 
  - Username: `receptionist`
  - Password: `password123`
- **Doctor**: 
  - Username: `doctor`
  - Password: `password123`

### Key Workflows
1. **Patient Registration**: Receptionist registers patient → System generates unique patient ID
2. **Token Generation**: Receptionist creates token → Email notification sent to patient
3. **Consultation**: Doctor views queue → Starts consultation → Creates prescription
4. **Billing**: Receptionist generates bill → Tracks payment status → Sends reminders

## File Structure
```
clinic-management-system/
├── index.html                          # Login page
├── receptionist-dashboard.html         # Receptionist interface
├── doctor-dashboard.html              # Doctor interface
├── assets/
│   ├── css/
│   │   ├── styles.css                 # Main styles
│   │   ├── dashboard.css              # Dashboard specific styles
│   │   └── dashboard-clean.css        # Clean dashboard theme
│   └── js/
│       ├── app.js                     # Main application logic
│       ├── auth.js                    # Authentication handling
│       ├── receptionist-dashboard.js  # Receptionist functionality
│       ├── doctor-dashboard.js        # Doctor functionality
│       └── notification-service.js    # Notification system
├── package.json                       # Project configuration
├── vercel.json                        # Vercel deployment config
└── README.md                          # This file
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support and questions, please refer to the documentation or create an issue in the repository.
