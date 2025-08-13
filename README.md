# 🍽️ Food Alert - Share Food, Reduce Waste

A community-driven web application that connects people to share excess food and reduce waste through intelligent recommendations and real-time notifications.

## 🌟 Features

- **User Authentication**: Secure login and registration system
- **Food Sharing**: Post available food items with details, location, and availability
- **Smart Recommendations**: ML-powered food suggestions based on user preferences and location
- **Real-time Notifications**: Instant alerts for new food postings and claims using WebSockets
- **Interactive Maps**: Location-based food discovery with Leaflet integration
- **Food Claiming**: Easy claim system with optional messaging
- **Responsive Design**: Mobile-friendly interface built with Bootstrap

## 🛠️ Technology Stack

### Backend
- **Python** with **Flask** web framework
- **SQLAlchemy** for database ORM (SQLite)
- **Flask-SocketIO** for real-time communication
- **scikit-learn** for machine learning recommendations
- **geopy** for location services and distance calculations

### Frontend
- **HTML5**, **CSS3**, and **JavaScript**
- **Bootstrap 5** for responsive design
- **Leaflet** for interactive maps
- **Font Awesome** for icons
- **Socket.IO** for real-time updates

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the project files**
   ```
   Ensure all files are in the project directory:
   - app.py
   - main.py
   - requirements.txt
   - static/app.js
   - templates/index.html
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

4. **Access the application**
   - Open your web browser and go to `http://localhost:5000`
   - The application will start with a welcome screen showing login and registration options

## 📱 Usage Guide

### For Users

1. **Register an Account**
   - Click on the "Register" tab
   - Fill in your username, email, and password
   - Add food preferences (optional but recommended for better suggestions)
   - Allow location access for better local recommendations

2. **Login**
   - Use your username and password to login
   - Grant location permissions when prompted

3. **Share Food**
   - Navigate to "Share Food" section
   - Fill in food details (title, description, quantity)
   - Set availability time
   - Confirm your location
   - Post your food for the community

4. **Find Food**
   - Browse "Available Food" section for nearby postings
   - Check "For You" section for personalized recommendations
   - Use the interactive map to see food locations
   - Claim food items with optional messages

5. **Manage Profile**
   - View your activity in the Profile section
   - Track your contributions to reducing food waste

### Key Features Explained

- **Smart Recommendations**: The system uses machine learning to suggest food items based on your preferences and location
- **Real-time Updates**: Get instant notifications when new food is posted near you or someone claims your food
- **Location-based Discovery**: Find food within a 10km radius of your location
- **Food Categories**: Automatic categorization of food items (fruits, vegetables, grains, etc.)
- **Expiration Tracking**: All food postings include availability times to ensure freshness

## 🗂️ Project Structure

```
food alert/
├── app.py              # Main Flask application with API routes
├── main.py             # Entry point script
├── requirements.txt    # Python dependencies
├── static/
│   └── app.js         # Frontend JavaScript
└── templates/
    └── index.html     # Main HTML template
```

## 🔧 Configuration

### Default Settings
- **Database**: SQLite (food_alert.db)
- **Server**: Flask development server on localhost:5000
- **Location**: Defaults to Lagos, Nigeria (6.5244, 3.3792)
- **Search Radius**: 10km for food discovery
- **Cleanup**: Automatic cleanup of expired postings every 5 minutes

### Environment Variables (Optional)
You can modify these in `app.py`:
- `SECRET_KEY`: Flask secret key for session management
- `SQLALCHEMY_DATABASE_URI`: Database connection string

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Food Management
- `GET /api/food-postings` - Get nearby food postings
- `POST /api/food-postings` - Create new food posting
- `POST /api/claim-food` - Claim a food item

### User Features
- `GET /api/recommendations/<user_id>` - Get personalized recommendations
- `POST /api/update-location` - Update user location

## 🤝 Contributing

This is a demonstration project focused on reducing food waste and building community connections. The application showcases:
- Full-stack web development
- Real-time web applications
- Machine learning integration
- Location-based services
- Responsive web design

## 📝 Notes

- **Security**: Password hashing should be implemented for production use
- **Database**: SQLite is used for simplicity; consider PostgreSQL/MySQL for production
- **Scalability**: The application is designed for demonstration and community-scale usage
- **Location**: Geocoding uses Nominatim (OpenStreetMap) with rate limiting considerations

## 🎯 Impact

Food Alert aims to:
- Reduce food waste by connecting surplus with need
- Build stronger communities through sharing
- Provide access to food for those in need
- Raise awareness about food sustainability
- Create a platform for community engagement

---

**Made with ❤️ by ohansfav for communities and the environment**
