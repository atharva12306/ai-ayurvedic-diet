# 🍃 AiAyush - AI-Powered Ayurvedic Diet Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://reactjs.org/)

A comprehensive, cloud-based Ayurvedic diet management system for healthcare practitioners, leveraging modern web technologies and AI to provide personalized dietary recommendations based on Ayurvedic principles.

## ✨ Features

### 🏠 Homepage
- Modern hero section with **AiAyush** gradient branding (Heart + Zap logo)
- "🤖 AI-Powered Ayurvedic Intelligence" badge
- Doctor-patient review cards with star ratings
- Popup notification system for alerts
- Professional gradient color scheme (Green → Blue → Gold)
- Responsive navigation bar with smooth animations

### 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-ayurvedic-diet.git
   cd ai-ayurvedic-diet
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   - Create a `.env` file in the `server` directory with the following variables:
     ```
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     NODE_ENV=development
     ```

5. **Start the application**
   - From the project root, run:
     ```bash
     # Start backend server
     cd server
     npm run dev

     # In a new terminal, start the frontend
     cd ../client
     npm start
     ```

## 🛠️ Tech Stack

### Frontend
- React 18
- Redux for state management
- Material-UI for UI components
- Chart.js for data visualization
- Axios for API requests

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Express Validator for request validation
- Helmet for security

### Development Tools
- Nodemon for development
- ESLint & Prettier for code quality
- Git for version control

## 📊 Main Dashboard
- Patient management board with 8+ patient cards
- Quick stats: total patients, consultations, pending follow-ups
- Navigation tabs: Dashboard, Diet Generator, Food Database, Reports
- Patient selection interface with contact info, health profile, lifestyle details, appointments

### 🍽️ AI Diet Generator
- Patient constitution (Prakriti) selector: Vata, Pitta, Kapha dropdown
- Health condition input field
- Weekly diet chart generator (Monday-Sunday layout)
- Meal planning for breakfast, lunch, dinner, snacks
- Automatic recipe suggestions based on dosha type
- Save/export diet plan functionality

### 🥗 Food Database System
- Searchable recipe library with nutritional information
- Six taste categories: Sweet, Sour, Salty, Pungent, Bitter, Astringent
- Calorie tracking per recipe
- PCF (Protein, Carbs, Fat) breakdown in grams
- Digestibility classification: Light, Heavy, Medium
- Temperature suitability: Hot, Cold, Warm
- Dosha compatibility indicators
- Detailed nutritional information modal on recipe click

### 📈 Reports & Analytics
- Nutrition analytics with green (actual) vs red (target) calorie bars
- Weekly bar graph for calorie tracking
- Ayurvedic properties balance charts: Hot vs Cold, Heavy vs Light
- Patient progress tracking system
- Practice overview with monthly statistics
- Patient satisfaction ratings display
- Consultation tracking metrics

### 🤖 AI Chatbot Integration
- Natural language query processing for Ayurvedic questions
- Disclaimer: "Highly recommended not to follow AI blindly - consult Ayurvedic physician"
- Context-aware responses about diet and health
- Integration with patient data for personalized responses

## 🛠️ Technical Stack

### Frontend
- **React.js** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Chart.js** - Data visualization
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notification system

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ayurvedic-diet-management
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   # Update MONGODB_URI in server/.env
   ```

5. **Run the application**
   ```bash
   # From root directory
   npm run dev
   
   # Or run separately:
   # Terminal 1: npm run server
   # Terminal 2: npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
ayurvedic-diet-management/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new practitioner
- `POST /api/auth/login` - Login practitioner
- `GET /api/auth/verify` - Verify JWT token
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/stats/overview` - Get patient statistics

### Foods
- `GET /api/foods` - Get all foods with filtering
- `GET /api/foods/:id` - Get single food
- `GET /api/foods/dosha/:dosha` - Get foods by dosha
- `GET /api/foods/categories/list` - Get food categories
- `GET /api/foods/tastes/list` - Get taste categories

### Diet Plans
- `GET /api/diet-plans` - Get all diet plans
- `POST /api/diet-plans` - Create diet plan
- `POST /api/diet-plans/generate` - Generate AI diet plan
- `PUT /api/diet-plans/:id` - Update diet plan
- `DELETE /api/diet-plans/:id` - Delete diet plan

### Reports
- `GET /api/reports/overview` - Get practice overview
- `GET /api/reports/patient-progress` - Get patient progress
- `GET /api/reports/nutrition-analytics` - Get nutrition analytics
- `GET /api/reports/monthly-growth` - Get monthly growth data
- `GET /api/reports/export` - Export reports

### Chatbot
- `POST /api/chatbot/message` - Send message to AI
- `GET /api/chatbot/suggestions` - Get quick questions
- `POST /api/chatbot/feedback` - Submit feedback

## 🎨 Design Features

- **Clean, professional medical interface**
- **Indian healthcare color palette** (greens, blues, whites)
- **Intuitive navigation** with clear iconography
- **Data-rich dashboards** with charts and graphs
- **Mobile-responsive design**
- **Fast loading and smooth transitions**

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- Environment variable configuration

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🚀 Deployment

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- MongoDB Atlas account (for production database)
- Vercel account (for frontend deployment)
- Heroku/Railway account (for backend deployment)

### Frontend Deployment (Vercel)
1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. Configure environment variables
4. Deploy!

### Backend Deployment (Heroku/Railway)
1. Push your code to a GitHub repository
2. Connect the repository to your hosting platform
3. Set up environment variables
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Built with ❤️ for the Ayurvedic community


<div align="center">
  Made with ❤️ by [Your Name](https://github.com/your-username)
</div>

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `client/build` folder
3. Set environment variables for API URL

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Deploy the server folder
3. Configure MongoDB Atlas for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Real-time notifications
- Video consultation integration
- Mobile app development
- Advanced AI recommendations
- Multi-language support
- Integration with wearable devices
- Telemedicine features

## 🎨 AiAyush Brand Identity

### Logo & Colors
- **Primary Icon:** Heart (❤️) + Zap (⚡) - AI-powered care
- **Color Palette:**
  - Green: `#10b981` (Ayurvedic healing)
  - Blue: `#3b82f6` (Technology & trust)
  - Gold: `#f59e0b` (Premium & wisdom)
- **Gradient:** Green → Blue → Gold (AI + Ayurveda fusion)

### Login Credentials (Demo)
- **Email:** doctor@ayurcare.com
- **Password:** Test@123
- **Role:** Doctor
- **Specialization:** AI-Powered Ayurveda & Nutrition

---

**Built with ❤️ + 🤖 by the AiAyush Team for the Ayurvedic healthcare community**






