# SmartPresence-1 🏫

A comprehensive **School Attendance Management System** built with React, TypeScript, and Node.js. This system provides advanced attendance tracking with face recognition, QR code scanning, and real-time analytics.

## ✨ Features

### 🎯 Core Attendance Management
- **Multi-method Attendance Tracking**: Face recognition, QR code scanning, and manual entry
- **Real-time Status Updates**: Present, Late, Absent, and Excused status management
- **Dynamic Status Editing**: Change attendance status with immediate UI reflection
- **Daily Attendance Initialization**: Automatic setup for all students and employees
- **Time-based Status Logic**: Configurable attendance windows and late thresholds

### 👤 User Management
- **Student & Employee Management**: Complete CRUD operations for both user types
- **Photo Management**: Upload and manage user photos for face recognition
- **ID Card Generation**: Automatic QR code generation for each user
- **Role-based Access**: Admin and user role management

### 🔍 Face Recognition System
- **Real-time Face Detection**: Live camera feed with face detection
- **Face Enrollment**: Register new faces with confidence scoring
- **Recognition with Confidence**: Display confidence levels for recognized faces
- **Offline Capability**: Works without internet connection

### 📱 QR Code System
- **QR Code Generation**: Automatic generation for each user
- **Camera-based Scanning**: Real-time QR code scanning
- **Mobile-friendly**: Responsive design for mobile devices

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live attendance statistics and system health
- **Comprehensive Reports**: Detailed attendance reports with filtering
- **Export Functionality**: Export reports in various formats
- **Attendance Trends**: Visual analytics and trend analysis

### 🔧 System Features
- **Offline Support**: Works without internet connection
- **Data Synchronization**: Sync attendance data when connection is restored
- **System Health Monitoring**: Real-time system status and performance
- **Notification System**: Real-time notifications for system events

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with camera access
- SQLite (included)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pitso4u/SmartPresence-1.git
   cd SmartPresence-1
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Setup the database**
   ```bash
   cd server
   node add-updated-at-column.js
   npm run setup-db
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (in server directory)
   cd server
   npm run dev
   
   # Start frontend server (in new terminal, from root directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
SmartPresence-1/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── attendance/           # Attendance-specific components
│   │   ├── reports/              # Reporting components
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Main application pages
│   ├── services/                 # API service layer
│   └── types/                    # TypeScript type definitions
├── server/                       # Backend Node.js application
│   ├── src/
│   │   ├── controllers/          # API controllers
│   │   ├── services/             # Business logic services
│   │   ├── routes/               # API routes
│   │   └── db/                   # Database configuration
│   └── uploads/                  # File uploads (photos, QR codes)
└── public/                       # Static assets
```

## 🎮 Usage Guide

### Attendance Management

1. **Navigate to Attendance Page**
   - Click "Attendance" in the sidebar
   - View current attendance status for all users

2. **Log Attendance**
   - **Face Recognition**: Use the face recognition tab to scan faces
   - **QR Code**: Scan QR codes using the camera
   - **Manual Entry**: Manually select users and mark attendance

3. **Edit Attendance Status**
   - Click the edit button (✏️) next to any attendance record
   - Select new status: Present, Late, Absent, or Excused
   - Changes are immediately reflected in the UI

4. **View Reports**
   - Navigate to Reports page for detailed analytics
   - Filter by date range, user type, and status
   - Export reports as needed

### User Management

1. **Add New Users**
   - Navigate to Students or Employees page
   - Click "Add New" button
   - Fill in user details and upload photo
   - QR code is automatically generated

2. **Manage Existing Users**
   - Edit user information
   - Update photos for face recognition
   - Regenerate QR codes if needed

### Face Recognition Setup

1. **Enroll New Faces**
   - Navigate to Face Recognition Enrollment
   - Position face in camera view
   - Click "Enroll Face" to register

2. **Use Face Recognition**
   - Go to Attendance page
   - Select Face Recognition tab
   - System will detect and recognize faces automatically

## ⚙️ Configuration

### Attendance Settings
Configure attendance parameters in the database:

```sql
-- Example attendance settings
INSERT INTO settings (attendance_start_time, attendance_end_time, late_threshold_minutes)
VALUES ('08:00', '16:00', 15);
```

### Environment Variables
Create `.env` file in the server directory:

```env
PORT=3000
DB_PATH=./tlaleho_ya_nako_server.db
NODE_ENV=development
```

## 🔧 API Endpoints

### Attendance
- `POST /api/v1/attendance` - Log attendance
- `GET /api/v1/attendance` - Get attendance logs
- `PUT /api/v1/attendance/:id` - Update attendance status
- `DELETE /api/v1/attendance/:id` - Delete attendance record

### Users
- `GET /api/v1/students` - Get all students
- `POST /api/v1/students` - Create new student
- `GET /api/v1/employees` - Get all employees
- `POST /api/v1/employees` - Create new employee

### Reports
- `GET /api/v1/reports/attendance` - Get attendance summary
- `GET /api/v1/reports/face-recognition` - Get face recognition stats

## 🛠️ Development

### Running Tests
```bash
# Frontend tests
npm test

# Backend tests
cd server
npm test
```

### Building for Production
```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure browser has camera permissions
   - Check HTTPS requirement for camera access
   - Try refreshing the page

2. **Face recognition not detecting faces**
   - Ensure good lighting
   - Position face clearly in camera view
   - Check if face models are loaded

3. **QR scanner not working**
   - Ensure camera permissions are granted
   - Check if QR code is clear and well-lit
   - Try adjusting scanner settings

4. **Database connection issues**
   - Check if SQLite is properly installed
   - Verify database file permissions
   - Run database setup scripts

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Face-api.js** for face recognition capabilities
- **HTML5-QRCode** for QR code scanning
- **React** and **TypeScript** for the frontend framework
- **Node.js** and **Express** for the backend
- **SQLite** for the database

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the troubleshooting section above

---

**SmartPresence-1** - Making attendance management smart and efficient! 🎓✨
