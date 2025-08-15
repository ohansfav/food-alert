# 🍽️ Food Alert - Share Food, Reduce Waste

A community-driven web application that connects people to share excess food and reduce waste through intelligent recommendations, real-time notifications, and social media-like food sharing experiences.

## 🌟 Features

### Core Features
- **User Authentication**: Secure login and registration system
- **Food Sharing**: Post available food items with details, location, and availability
- **Smart Recommendations**: ML-powered food suggestions based on user preferences and location
- **Real-time Notifications**: Instant alerts for new food postings and claims
- **Interactive Maps**: Location-based food discovery with Leaflet integration
- **Food Claiming**: Easy claim system with optional messaging
- **Responsive Design**: Mobile-friendly interface built with Bootstrap 5

### New Modern Features
- **Modern UI/UX**: Glassmorphism design with parallax effects and dark/light themes
- **Social Media Integration**: Twitter-like food posts with likes, comments, and shares
- **Enhanced Visual Experience**: Modern CSS animations and floating action buttons
- **Advanced Filtering**: Category-based food discovery and rating system
- **User Profiles**: Comprehensive user profiles with activity tracking
- **Image Support**: Upload and share food images with posts

## 🛠️ Technology Stack

### Backend
- **Python** with **Flask** web framework
- **SQLAlchemy** for database ORM (SQLite)
- **Flask-CORS** for cross-origin resource sharing
- **scikit-learn** for machine learning recommendations
- **geopy** for location services and distance calculations
- **NumPy** for numerical computations

### Frontend
- **HTML5**, **CSS3**, and **JavaScript**
- **Bootstrap 5** for responsive design
- **Leaflet** for interactive maps
- **Font Awesome** for icons
- **Modern CSS** with glassmorphism effects
- **Parallax scrolling** and animations

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the project files**
   ```
   Ensure all files are in the project directory:
   - app.py (main Flask application)
   - main.py (entry point)
   - requirements.txt
   - static/ (CSS, JS, images)
   - templates/ (HTML templates)
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
   - The application will start with a modern welcome screen

## 📱 Usage Guide

### For Users

1. **Register an Account**
   - Click on the "Register" tab
   - Fill in your username, email, and password
   - Add food preferences for better recommendations
   - Allow location access for local food discovery

2. **Login**
   - Use your username and password to login
   - Grant location permissions when prompted

3. **Share Food**
   - Navigate to "Share Food" section
   - Fill in food details with modern form interface
   - Upload food images (optional)
   - Set availability time and location
   - Post your food for the community

4. **Find Food**
   - Browse "Available Food" section for nearby postings
   - Check "Food Posts" for social media-style updates
   - Use interactive maps to see food locations
   - Filter by food type, distance, and ratings
   - Claim food items with optional messages

5. **Create Food Posts**
   - Share your food experiences like social media
   - Add images, descriptions, and ratings
   - Engage with likes and comments
   - Build your food sharing profile

## 🗂️ Project Structure

```
food-alert/
├── app.py                 # Main Flask application with all API routes
├── main.py               # Entry point script
├── requirements.txt      # Python dependencies
├── README.md            # Project documentation
├── instance/
│   └── food_alert.db    # SQLite database
├── static/
│   ├── app.js           # Main frontend JavaScript
│   ├── modern.css       # Modern UI styles
│   ├── modern.js        # Modern UI interactions
│   ├── food_posts.js    # Social media posts functionality
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker for PWA
│   └── images/         # Static images
└── templates/
    ├── index.html       # Main application template
    ├── modern_index.html # Modern UI template
    ├── food_posts.html  # Social media posts template
    └── food_posts.html  # Food posts interface
```

## 🔧 Configuration

### Default Settings
- **Database**: SQLite (food_alert.db)
- **Server**: Flask development server on localhost:5000
- **Location**: Defaults to Lagos, Nigeria (6.5244, 3.3792)
- **Search Radius**: 10km for food discovery
- **Cleanup**: Automatic cleanup every 5 minutes
- **Image Storage**: URL-based (cloud storage ready)

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Food Management
- `GET /api/food-postings` - Get nearby food postings
- `POST /api/food-postings` - Create new food posting
- `POST /api/claim-food` - Claim a food item
- `POST /api/update-location` - Update user location

### Social Features
- `GET /api/food-posts` - Get all food posts (paginated)
- `POST /api/food-posts` - Create new food post
- `GET /api/food-posts/<id>` - Get specific food post
- `POST /api/food-posts/<id>/like` - Like/unlike post
- `POST /api/food-posts/<id>/comments` - Add comment
- `GET /api/food-posts/<id>/comments` - Get comments

### Notifications
- `POST /api/alert-nearby-users` - Alert nearby users
- `GET /api/recommendations/<user_id>` - Get personalized recommendations

## 🤝 Contributing

This project demonstrates:
- Full-stack web development with modern practices
- Social media integration for community building
- Machine learning for intelligent recommendations
- Modern UI/UX design principles
- Progressive Web App capabilities
- Real-time web applications

## 📝 Notes

### Security Features
- Password hashing ready (implement bcrypt for production)
- Input validation and sanitization
- Rate limiting considerations
- XSS and CSRF protection

### Performance Optimizations
- Lazy loading for images
- Pagination for large datasets
- Background cleanup tasks
- Efficient database queries

### Scalability
- Designed for community-scale usage
- Cloud-ready architecture
- CDN support for static assets
- Database migration support

## 🎯 Impact

Food Alert aims to:
- Reduce food waste through community sharing
- Build stronger communities through food experiences
- Provide access to food for those in need
- Create a platform for sustainable living
- Foster community engagement and connections
- Promote food sustainability awareness

## 📊 Statistics Dashboard

The application tracks:
- Food items shared and claimed
- Community engagement metrics
- Waste reduction impact
- User activity and contributions
- Location-based food distribution

---

**Made with ❤️ by ohansfav for communities and the environment**

**Version 2.0 - Modern Food Sharing Platform**
