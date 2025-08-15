#!/usr/bin/env python3
"""
Food Alert Application - Main Flask Application
A web application to connect communities and reduce food waste through food sharing.
This version removes WebSocket dependencies for better compatibility.
"""

from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import func
from datetime import datetime, timedelta
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'food-alert-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///food_alert.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float, default=0.0)
    longitude = db.Column(db.Float, default=0.0)
    preferences = db.Column(db.Text, default='[]')  # JSON string of food preferences
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'preferences': json.loads(self.preferences) if self.preferences else [],
            'created_at': self.created_at.isoformat()
        }

class FoodPosting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    food_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    available_until = db.Column(db.DateTime, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('postings', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username,
            'title': self.title,
            'description': self.description,
            'food_type': self.food_type,
            'quantity': self.quantity,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'available_until': self.available_until.isoformat(),
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat()
        }

class FoodClaim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    posting_id = db.Column(db.Integer, db.ForeignKey('food_posting.id'), nullable=False)
    claimer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, completed
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    posting = db.relationship('FoodPosting', backref=db.backref('claims', lazy=True))
    claimer = db.relationship('User', backref=db.backref('claims', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'posting_id': self.posting_id,
            'claimer_id': self.claimer_id,
            'claimer_username': self.claimer.username,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat()
        }

class UserAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    distance = db.Column(db.Float, nullable=False)
    sender_location_lat = db.Column(db.Float, nullable=False)
    sender_location_lng = db.Column(db.Float, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref=db.backref('sent_alerts', lazy=True))
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref=db.backref('received_alerts', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_username': self.sender.username,
            'recipient_username': self.recipient.username,
            'message': self.message,
            'distance': self.distance,
            'sender_location': {
                'lat': self.sender_location_lat,
                'lng': self.sender_location_lng
            },
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }

class FoodPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    food_type = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.Text)  # URL to stored image
    rating = db.Column(db.Integer, default=0)  # 1-5 stars
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('food_posts', lazy=True))
    comments = db.relationship('FoodPostComment', backref='food_post', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('FoodPostLike', backref='food_post', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username,
            'title': self.title,
            'content': self.content,
            'food_type': self.food_type,
            'image_url': self.image_url,
            'rating': self.rating,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'created_at': self.created_at.isoformat(),
            'is_liked': False  # Will be set based on current user
        }

class FoodPostComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('food_post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('food_post_comments', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'username': self.user.username,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }

class FoodPostLike(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('food_post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can only like a post once
    __table_args__ = (db.UniqueConstraint('post_id', 'user_id'),)
    
    user = db.relationship('User', backref=db.backref('food_post_likes', lazy=True))

# Simple ML Components (without complex dependencies)
class FoodRecommendationEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.food_data = []
        self.food_vectors = None
        self.geolocator = Nominatim(user_agent="food_alert")
        
    def train(self, food_postings):
        """Train the recommendation engine with existing food postings"""
        if not food_postings:
            return
            
        self.food_data = food_postings
        food_descriptions = [
            f"{posting['title']} {posting['description']} {posting['food_type']}" 
            for posting in food_postings
        ]
        
        try:
            self.food_vectors = self.vectorizer.fit_transform(food_descriptions)
        except:
            self.food_vectors = None
    
    def get_recommendations(self, user_preferences, user_location, limit=5):
        """Get food recommendations based on user preferences and location"""
        if not self.food_vectors or not self.food_data:
            return []
        
        try:
            # Create user preference vector
            pref_text = ' '.join(user_preferences)
            user_vector = self.vectorizer.transform([pref_text])
            
            # Calculate similarity scores
            similarity_scores = cosine_similarity(user_vector, self.food_vectors).flatten()
            
            # Get recommendations with location filtering
            recommendations = []
            for i, score in enumerate(similarity_scores):
                posting = self.food_data[i]
                
                # Calculate distance
                food_location = (posting['latitude'], posting['longitude'])
                distance = geodesic(user_location, food_location).kilometers
                
                # Filter by distance (within 10km) and availability
                if distance <= 10 and posting['is_available']:
                    recommendations.append({
                        'posting': posting,
                        'similarity_score': score,
                        'distance': distance
                    })
            
            # Sort by similarity score and distance
            recommendations.sort(key=lambda x: (x['similarity_score'], x['distance']), reverse=True)
            
            return recommendations[:limit]
        except:
            return []
    
    def categorize_food(self, description):
        """Categorize food based on description using simple keyword matching"""
        food_categories = {
            'fruits': ['apple', 'banana', 'orange', 'fruit', 'berries', 'grape', 'mango'],
            'vegetables': ['carrot', 'broccoli', 'lettuce', 'vegetable', 'salad', 'tomato', 'cucumber'],
            'grains': ['bread', 'rice', 'pasta', 'cereal', 'grain', 'oats', 'quinoa'],
            'protein': ['chicken', 'beef', 'fish', 'eggs', 'meat', 'tofu', 'beans'],
            'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'dairy', 'cream'],
            'snacks': ['chips', 'cookies', 'crackers', 'nuts', 'snack', 'popcorn'],
            'beverages': ['water', 'juice', 'soda', 'coffee', 'tea', 'drink'],
            'prepared': ['pizza', 'sandwich', 'soup', 'stew', 'meal', 'leftovers']
        }
        
        desc_lower = description.lower()
        category_scores = {}
        
        for category, keywords in food_categories.items():
            score = sum(1 for keyword in keywords if keyword in desc_lower)
            if score > 0:
                category_scores[category] = score
        
        return max(category_scores, key=category_scores.get) if category_scores else 'other'

# Initialize ML engine
ml_engine = FoodRecommendationEngine()

# API Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/food-posts')
def food_posts():
    return render_template('food_posts.html')

@app.route('/profile')
def profile():
    return render_template('futuristic_profile.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password=data['password'],  # In production, use password hashing
        latitude=data.get('latitude', 0.0),
        longitude=data.get('longitude', 0.0),
        preferences=json.dumps(data.get('preferences', []))
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully', 'user': user.to_dict()})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.password == data['password']:  # In production, use password hashing
        return jsonify({'message': 'Login successful', 'user': user.to_dict()})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/food-postings', methods=['GET'])
def get_food_postings():
    lat = float(request.args.get('lat', 0))
    lng = float(request.args.get('lng', 0))
    radius = float(request.args.get('radius', 10))
    
    postings = FoodPosting.query.filter_by(is_available=True).all()
    user_location = (lat, lng)
    
    nearby_postings = []
    for posting in postings:
        food_location = (posting.latitude, posting.longitude)
        distance = geodesic(user_location, food_location).kilometers
        
        if distance <= radius:
            posting_dict = posting.to_dict()
            posting_dict['distance'] = distance
            nearby_postings.append(posting_dict)
    
    return jsonify(nearby_postings)

@app.route('/api/food-postings', methods=['POST'])
def create_food_posting():
    data = request.get_json()
    
    # Auto-categorize food using ML
    food_type = ml_engine.categorize_food(f"{data['title']} {data['description']}")
    
    posting = FoodPosting(
        user_id=data['user_id'],
        title=data['title'],
        description=data['description'],
        food_type=food_type,
        quantity=data['quantity'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        available_until=datetime.fromisoformat(data['available_until'])
    )
    
    db.session.add(posting)
    db.session.commit()
    
    # Retrain ML engine with new data
    update_ml_engine()
    
    return jsonify({'message': 'Food posting created successfully', 'posting': posting.to_dict()})

@app.route('/api/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    user = User.query.get_or_404(user_id)
    user_location = (user.latitude, user.longitude)
    user_preferences = json.loads(user.preferences) if user.preferences else []
    
    # Get all available postings for ML training
    postings = FoodPosting.query.filter_by(is_available=True).all()
    posting_data = [posting.to_dict() for posting in postings]
    
    # Train ML engine and get recommendations
    ml_engine.train(posting_data)
    recommendations = ml_engine.get_recommendations(user_preferences, user_location)
    
    return jsonify(recommendations)

@app.route('/api/claim-food', methods=['POST'])
def claim_food():
    data = request.get_json()
    
    claim = FoodClaim(
        posting_id=data['posting_id'],
        claimer_id=data['claimer_id'],
        message=data.get('message', '')
    )
    
    db.session.add(claim)
    db.session.commit()
    
    return jsonify({'message': 'Food claimed successfully', 'claim': claim.to_dict()})

@app.route('/api/update-location', methods=['POST'])
def update_location():
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if user:
        user.latitude = data['latitude']
        user.longitude = data['longitude']
        db.session.commit()
        
        return jsonify({'message': 'Location updated successfully'})
    
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/alert-nearby-users', methods=['POST'])
def alert_nearby_users():
    data = request.get_json()
    user_id = data.get('user_id')
    message = data.get('message', 'Food available nearby! Check the app for details.')
    image_data = data.get('image_data')
    camera_used = data.get('camera_used', False)
    location = data.get('location', {})
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    # Get the user sending the alert
    alert_sender = User.query.get(user_id)
    if not alert_sender:
        return jsonify({'error': 'User not found'}), 404
    
    # Update user location if provided
    if location:
        alert_sender.latitude = location.get('latitude', alert_sender.latitude)
        alert_sender.longitude = location.get('longitude', alert_sender.longitude)
    
    # Find nearby users (within 5km radius)
    sender_location = (alert_sender.latitude, alert_sender.longitude)
    nearby_users = []
    
    all_users = User.query.filter(User.id != user_id).all()
    
    for user in all_users:
        user_location = (user.latitude, user.longitude)
        distance = geodesic(sender_location, user_location).kilometers
        
        if distance <= 5:  # Within 5km radius
            nearby_users.append({
                'user': user,
                'distance': distance
            })
    
    # Create alert records and simulate sending notifications
    alerts_sent = []
    for nearby_user_data in nearby_users:
        nearby_user = nearby_user_data['user']
        distance = nearby_user_data['distance']
        
        # Enhance message if image was captured
        enhanced_message = message
        if camera_used:
            enhanced_message = f"📸 {message}"
        
        # In a real app, this would send push notifications, emails, or WebSocket messages
        # For now, we'll create alert records in the database
        alert = UserAlert(
            sender_id=user_id,
            recipient_id=nearby_user.id,
            message=enhanced_message,
            distance=distance,
            sender_location_lat=alert_sender.latitude,
            sender_location_lng=alert_sender.longitude
        )
        
        # Store image data if provided (in a real app, you'd save to cloud storage)
        if image_data:
            # For demo purposes, we'll store a reference that image was captured
            # In production, you'd save the actual image to a file storage service
            alert.message += f" [IMAGE_CAPTURED]"
        
        db.session.add(alert)
        alerts_sent.append({
            'recipient_username': nearby_user.username,
            'distance': distance,
            'message': enhanced_message,
            'image_captured': camera_used
        })
    
    db.session.commit()
    
    # Create a summary response
    response_message = f'Alert sent to {len(alerts_sent)} nearby users'
    if camera_used:
        response_message += ' with photo attachment'
    
    return jsonify({
        'message': response_message,
        'alerts_sent': alerts_sent,
        'total_nearby_users': len(nearby_users),
        'image_captured': camera_used,
        'sender_location': {
            'latitude': alert_sender.latitude,
            'longitude': alert_sender.longitude
        }
    })

# Food Posts API Routes (Twitter-like functionality)
@app.route('/api/food-posts', methods=['GET'])
def get_food_posts_list():
    """Get all food posts with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    user_id = request.args.get('user_id')  # Filter by user if provided
    
    query = FoodPost.query.order_by(FoodPost.created_at.desc())
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    posts = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Check if current user liked each post
    current_user_id = request.args.get('current_user_id')
    posts_data = []
    
    for post in posts.items:
        post_dict = post.to_dict()
        
        # Check if current user liked this post
        if current_user_id:
            like = FoodPostLike.query.filter_by(
                post_id=post.id, 
                user_id=current_user_id
            ).first()
            post_dict['is_liked'] = like is not None
        
        posts_data.append(post_dict)
    
    return jsonify({
        'posts': posts_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': posts.total,
            'pages': posts.pages
        }
    })

@app.route('/api/food-posts', methods=['POST'])
def create_food_post_item():
    """Create a new food post"""
    data = request.get_json()
    
    # Auto-categorize food using ML
    food_type = ml_engine.categorize_food(f"{data['title']} {data['content']}")
    
    post = FoodPost(
        user_id=data['user_id'],
        title=data['title'],
        content=data['content'],
        food_type=food_type,
        image_url=data.get('image_url'),
        rating=data.get('rating', 0)
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Food post created successfully', 
        'post': post.to_dict()
    })

@app.route('/api/food-posts/<int:post_id>', methods=['GET'])
def get_food_post(post_id):
    """Get a single food post with comments"""
    post = FoodPost.query.get_or_404(post_id)
    post_dict = post.to_dict()
    
    # Get comments for this post
    comments = FoodPostComment.query.filter_by(post_id=post_id).order_by(FoodPostComment.created_at.asc()).all()
    post_dict['comments'] = [comment.to_dict() for comment in comments]
    
    # Check if current user liked this post
    current_user_id = request.args.get('current_user_id')
    if current_user_id:
        like = FoodPostLike.query.filter_by(
            post_id=post_id, 
            user_id=current_user_id
        ).first()
        post_dict['is_liked'] = like is not None
    
    return jsonify({'post': post_dict})

@app.route('/api/food-posts/<int:post_id>', methods=['PUT'])
def update_food_post(post_id):
    """Update a food post"""
    data = request.get_json()
    post = FoodPost.query.get_or_404(post_id)
    
    # Check if user owns the post
    if post.user_id != data['user_id']:
        return jsonify({'error': 'Unauthorized to update this post'}), 403
    
    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    post.rating = data.get('rating', post.rating)
    post.image_url = data.get('image_url', post.image_url)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Food post updated successfully', 
        'post': post.to_dict()
    })

@app.route('/api/food-posts/<int:post_id>', methods=['DELETE'])
def delete_food_post(post_id):
    """Delete a food post"""
    data = request.get_json()
    post = FoodPost.query.get_or_404(post_id)
    
    # Check if user owns the post
    if post.user_id != data['user_id']:
        return jsonify({'error': 'Unauthorized to delete this post'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Food post deleted successfully'})

@app.route('/api/food-posts/<int:post_id>/like', methods=['POST'])
def like_food_post(post_id):
    """Like or unlike a food post"""
    data = request.get_json()
    user_id = data['user_id']
    
    # Check if like already exists
    existing_like = FoodPostLike.query.filter_by(
        post_id=post_id, 
        user_id=user_id
    ).first()
    
    post = FoodPost.query.get_or_404(post_id)
    
    if existing_like:
        # Unlike the post
        db.session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        action = 'unliked'
    else:
        # Like the post
        like = FoodPostLike(post_id=post_id, user_id=user_id)
        db.session.add(like)
        post.likes_count += 1
        action = 'liked'
    
    db.session.commit()
    
    return jsonify({
        'message': f'Post {action} successfully',
        'likes_count': post.likes_count,
        'action': action
    })

@app.route('/api/food-posts/<int:post_id>/comments', methods=['POST'])
def add_comment_to_post(post_id):
    """Add a comment to a food post"""
    data = request.get_json()
    
    comment = FoodPostComment(
        post_id=post_id,
        user_id=data['user_id'],
        content=data['content']
    )
    
    db.session.add(comment)
    
    # Update comments count
    post = FoodPost.query.get(post_id)
    post.comments_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Comment added successfully',
        'comment': comment.to_dict(),
        'comments_count': post.comments_count
    })

@app.route('/api/food-posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """Get all comments for a food post"""
    comments = FoodPostComment.query.filter_by(post_id=post_id).order_by(FoodPostComment.created_at.asc()).all()
    
    return jsonify({
        'comments': [comment.to_dict() for comment in comments]
    })

@app.route('/api/food-posts/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(post_id, comment_id):
    """Delete a comment from a food post"""
    data = request.get_json()
    comment = FoodPostComment.query.get_or_404(comment_id)
    
    # Check if user owns the comment
    if comment.user_id != data['user_id']:
        return jsonify({'error': 'Unauthorized to delete this comment'}), 403
    
    db.session.delete(comment)
    
    # Update comments count
    post = FoodPost.query.get(post_id)
    post.comments_count = max(0, post.comments_count - 1)
    
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted successfully'})

# Background task to clean up expired postings
def cleanup_expired_postings():
    while True:
        with app.app_context():
            expired_postings = FoodPosting.query.filter(
                FoodPosting.available_until < datetime.utcnow()
            ).all()
            
            for posting in expired_postings:
                posting.is_available = False
            
            db.session.commit()
        
        time.sleep(300)  # Check every 5 minutes

def update_ml_engine():
    """Update ML engine with current data"""
    with app.app_context():
        postings = FoodPosting.query.filter_by(is_available=True).all()
        posting_data = [posting.to_dict() for posting in postings]
        ml_engine.train(posting_data)

def init_db():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    init_db()
    
    # Start background thread for cleanup
    cleanup_thread = threading.Thread(target=cleanup_expired_postings, daemon=True)
    cleanup_thread.start()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
