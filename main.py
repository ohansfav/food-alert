#!/usr/bin/env python3
"""
Food Alert Application - Main Entry Point
A web application to connect communities and reduce food waste through food sharing.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, init_db

if __name__ == '__main__':
    print("🍽️  Starting Food Alert Application...")
    print("📍 Location: Food Sharing Platform")
    print("🌍 Goal: Reduce food waste, build community")
    print("-" * 50)
    
    # Initialize the database
    print("📊 Initializing database...")
    init_db()
    print("✅ Database initialized successfully!")
    
    # Start the application
    print("🚀 Starting server on http://localhost:5000")
    print("💡 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Food Alert server stopped. Thank you for making a difference!")
