# Brigade Management System

A modern, production-grade web application for managing student brigade assignments and venue information. Built with React, TypeScript, and Firebase.

## 🚀 Features

### Student Portal
- **Brigade Finder**: Students can search for their brigade details using their temporary roll number
- **Comprehensive Information**: View brigade number, lead contact, venue location, and additional contact information
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Search**: Instant results with Firebase integration

### Admin Dashboard
- **Secure Authentication**: Firebase-based admin login system
- **Analytics Dashboard**: Visual charts and statistics showing system overview
- **Data Management**: Complete CRUD operations for students and brigades
- **File Upload System**: Bulk upload students and brigades via Excel files
- **Real-time Updates**: Live data synchronization across all components

### Technical Features
- **Modern Tech Stack**: React 18, TypeScript, Tailwind CSS
- **Production Ready**: Optimized build, error handling, loading states
- **Responsive Design**: Mobile-first approach with beautiful animations
- **Type Safety**: Full TypeScript implementation
- **Real-time Database**: Firebase Firestore integration
- **File Processing**: Excel file parsing and validation
- **Toast Notifications**: User-friendly feedback system

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Recharts
- **File Processing**: SheetJS (xlsx)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brigade-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Copy your Firebase config and update `src/lib/firebase.ts`

4. **Create Admin User**
   - Go to Firebase Console > Authentication
   - Add a new user with email/password
   - Use these credentials to log into the admin panel

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Admin layout with sidebar
│   ├── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── FirebaseContext.tsx
├── lib/               # Utilities and configurations
│   └── firebase.ts    # Firebase configuration
├── pages/             # Application pages
│   ├── HomePage.tsx   # Student search interface
│   ├── AdminLogin.tsx # Admin authentication
│   ├── AdminDashboard.tsx # Analytics dashboard
│   ├── StudentUpload.tsx  # Student data upload
│   ├── BrigadeUpload.tsx  # Brigade data upload
│   └── DataManagement.tsx # Data viewing/deletion
└── App.tsx            # Main application component
```

## 📊 Database Schema

### Students Collection
```typescript
interface Student {
  stdroll: string;    // Unique roll number (document ID)
  stdname: string;    // Student name
  stdbg: string;      // Brigade number
}
```

### Brigades Collection
```typescript
interface Brigade {
  bnameno: string;    // Brigade number (document ID)
  blname: string;     // Brigade lead name
  blno: string;       // Brigade lead phone number
  venue: string;      // Venue location
}
```

## 📋 Excel File Formats

### Student Upload Format
| Column A | Column B | Column C |
|----------|----------|----------|
| Roll Number | Student Name | Brigade Number |
| 12345 | John Doe | BG001 |
| 12346 | Jane Smith | BG002 |

### Brigade Upload Format
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Brigade Number | Lead Name | Phone Number | Venue |
| BG001 | John Smith | 9876543210 | Hall A |
| BG002 | Jane Doe | 9876543211 | Hall B |

## 🔐 Security Features

- **Firebase Authentication**: Secure admin login system
- **Protected Routes**: Admin pages require authentication
- **Input Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error management
- **Data Sanitization**: Clean and validate all inputs

## 🎨 Design System

### Colors
- **Primary**: Blue tones for main actions and branding
- **Accent**: Green tones for success states and highlights
- **Neutral**: Gray scale for text and backgrounds
- **Semantic**: Red for errors, yellow for warnings

### Typography
- **Headings**: Montserrat font family
- **Body Text**: Poppins font family
- **Weights**: 300, 400, 500, 600, 700, 800

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Consistent styling with hover states
- **Forms**: Clean inputs with focus states
- **Tables**: Responsive with hover effects

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
1. Connect your repository to your hosting platform
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy!

### Environment Variables
No environment variables needed - Firebase config is included in the code.

## 📱 Usage Guide

### For Students
1. Visit the homepage
2. Enter your 5-digit temporary roll number
3. Click "Find Brigade" to view your details
4. Contact your brigade lead or the support number for venue clarification

### For Administrators
1. Navigate to `/admin/login`
2. Sign in with your admin credentials
3. Use the dashboard to:
   - View system analytics
   - Upload student data via Excel
   - Upload brigade information via Excel
   - Manage existing data
   - Delete records when needed

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for git history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with full functionality
- Student search interface
- Admin dashboard with analytics
- File upload system
- Data management tools
- Responsive design
- Firebase integration

---
