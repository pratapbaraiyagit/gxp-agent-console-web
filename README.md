# GXP Agent Console Web

A comprehensive React-based web application designed to serve as a centralized control and monitoring system for hotel kiosk devices and hospitality operations. This enterprise-grade solution streamlines hotel management processes by providing agents with comprehensive tools to manage guest services, financial transactions, and device operations through an integrated kiosk ecosystem.

## 🏨 Project Overview

**GXP Agent Console Web** is an intelligent hotel management platform that digitizes and automates traditional hospitality operations through kiosk device integration and real-time monitoring capabilities. It serves as the central nervous system for modern hotel operations, enabling staff to manage multiple aspects of hotel services from a single, intuitive interface.

## ✨ Key Features

### 🏠 Hotel Operations Management

- **Guest Lifecycle Management**: Complete check-in/check-out processes
- **Room Management**: Real-time room availability and status tracking
- **Booking System**: Reservation management and modification capabilities
- **Guest Services**: Special requests, amenities, and service delivery

### 🖥️ Kiosk Device Control Center

- **Multi-Device Management**: Monitor and control multiple kiosk locations
- **Real-time Device Communication**: MQTT-based live device status monitoring
- **Device Configuration**: Centralized settings and parameter management
- **Health Monitoring**: System status, connectivity, and performance tracking

### 💰 Financial Operations Hub

- **Cash Management**: Automated cash dispensing, collection, and recycling
- **Payment Processing**: Multiple payment method support
- **Transaction Management**: Complete financial transaction lifecycle
- **Audit Trail**: Comprehensive logging and reporting for all financial activities

### 🔐 Identity & Security Management

- **Document Processing**: OCR-based ID card scanning and verification
- **Biometric Integration**: Selfie capture and facial recognition
- **Access Control**: Key dispensing, encoding, and room access management
- **Multi-factor Authentication**: Enhanced security with OTP and device fingerprinting

### 📱 Smart Device Integration

- **Key Management Systems**: Automated key dispensing and encoding
- **Printing Services**: Receipt, document, and label printing
- **Cash Recyclers**: Automated cash handling and storage
- **ID Scanners**: Document verification and data extraction

## 🛠️ Technical Stack

### Frontend Technologies

- **React 18**: Modern component-based architecture with hooks
- **Redux Toolkit**: Centralized state management and data flow
- **Ant Design**: Enterprise-grade UI component library
- **SASS/SCSS**: Advanced styling with modular architecture
- **React Router**: Client-side routing and navigation

### Communication & Integration

- **MQTT Protocol**: Real-time device communication and monitoring
- **RESTful APIs**: Backend service integration and data management
- **WebSocket**: Bidirectional real-time communication
- **Axios**: HTTP client with interceptors and error handling

### Data Management

- **IndexedDB**: Offline data storage and synchronization
- **Local Storage**: Session management and user preferences
- **State Persistence**: Redux state hydration and persistence
- **Data Validation**: Comprehensive input validation and error handling

### Security & Authentication

- **JWT Authentication**: Secure token-based user sessions
- **Session Management**: Persistent user authentication
- **Device Fingerprinting**: Browser-based device identification
- **Role-based Access Control**: Granular permission management

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with ES6+ support

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gxp-agent-console-web-14-07-225
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   REACT_APP_API_URL=your_api_base_url_here
   REACT_APP_MQTT_BROKER_URL=your_mqtt_broker_url
   REACT_APP_ENVIRONMENT=development
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   The application will open at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- **`npm start`**: Runs the app in development mode
- **`npm test`**: Launches the test runner in interactive watch mode
- **`npm run build`**: Builds the app for production to the `build` folder
- **`npm run eject`**: Ejects from Create React App (one-way operation)

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Modal/          # Modal components for various operations
│   ├── Loader/         # Loading and spinner components
│   ├── Tabs/           # Tab-based interface components
│   └── theme/          # Theme context and styling
├── pages/              # Main application pages
│   ├── auth/           # Authentication and login pages
│   └── Terminal/       # Main terminal interface
├── redux/              # State management
│   ├── reducers/       # Redux reducers for different domains
│   └── store.js        # Redux store configuration
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── helpers/            # Helper functions and middleware
└── assets/             # Images, styles, and static assets
```

## 🔧 Configuration

### MQTT Configuration

The application uses MQTT for real-time device communication. Configure your MQTT broker settings in the environment variables and device configuration.

### Device Integration

Configure kiosk devices through the device management interface:

1. Add new kiosk devices
2. Configure device parameters
3. Set up communication protocols
4. Monitor device status

### Authentication Setup

1. Configure user roles and permissions
2. Set up OTP services for multi-factor authentication
3. Configure session timeout and security policies

## 📱 Device Integration

### Supported Devices

- **Kiosk Terminals**: Self-service check-in/check-out stations
- **Key Dispensers**: Automated key management systems
- **Cash Recyclers**: Automated cash handling devices
- **ID Scanners**: Document verification equipment
- **Printers**: Receipt and document printing devices

### Integration Process

1. **Device Registration**: Add devices to the system
2. **Configuration**: Set device-specific parameters
3. **Testing**: Verify device communication and functionality
4. **Monitoring**: Real-time status monitoring and alerts

## 🔒 Security Features

### Authentication & Authorization

- JWT-based token authentication
- Multi-factor authentication (OTP)
- Role-based access control
- Session management and timeout

### Data Protection

- Encrypted data transmission
- Secure storage practices
- Audit logging for all operations
- Device fingerprinting for security

## 📊 Monitoring & Analytics

### Real-time Monitoring

- Device status and health monitoring
- System performance metrics
- User activity tracking
- Error logging and alerting

### Reporting

- Transaction reports
- Device utilization statistics
- User activity analytics
- Operational performance metrics

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Ensure all required environment variables are set for production:

- API endpoints
- MQTT broker configuration
- Security keys and certificates
- Database connection strings

### Deployment Considerations

- SSL/TLS encryption
- Load balancing for high availability
- Database backup and recovery
- Monitoring and alerting systems

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

- Unit tests for components
- Integration tests for API calls
- End-to-end testing for user workflows
- Performance testing for real-time operations

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/login` - User authentication
- `POST /auth/otp` - OTP verification
- `POST /auth/logout` - User logout

### Device Management

- `GET /devices` - List all devices
- `POST /devices` - Add new device
- `PUT /devices/:id` - Update device configuration
- `DELETE /devices/:id` - Remove device

### Booking Management

- `GET /bookings` - List bookings
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking

## 🤝 Contributing

### Development Guidelines

1. Follow React best practices
2. Use TypeScript for type safety
3. Write comprehensive tests
4. Follow the established code style
5. Document new features and APIs

### Code Review Process

1. Create feature branches
2. Submit pull requests
3. Code review and testing
4. Merge after approval

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

### Documentation

- API documentation
- User guides
- Troubleshooting guides
- FAQ section

### Contact

- Technical support: [support@company.com]
- Development team: [dev@company.com]
- Project manager: [pm@company.com]

## 🔄 Version History

- **v1.1.8** - Current stable release
- **v1.1.7** - Bug fixes and performance improvements
- **v1.1.6** - New device integration features
- **v1.1.5** - Enhanced security features
- **v1.1.0** - Major feature release

## 🎯 Roadmap

### Upcoming Features

- Advanced analytics dashboard
- Mobile application support
- AI-powered guest recommendations
- Enhanced device integration
- Multi-language support expansion

### Long-term Goals

- Cloud-native architecture
- Microservices implementation
- Advanced machine learning integration
- Global deployment support

---

**GXP Agent Console Web** - Transforming hotel operations through intelligent automation and real-time device integration.
