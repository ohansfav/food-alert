// Utility function to format time
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(date - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Tomorrow';
    } else if (diffDays <= 7) {
        return `In ${diffDays} days`;
    } else {
        return date.toLocaleDateString();
    }
}

// Global variables
let currentUser = null;
let currentLocation = { lat: 6.5244, lng: 3.3792 }; // Default to Lagos, Nigeria
let map = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    getCurrentLocation();
    initializeChatbot();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }

    // Initialize map
    initializeMap();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });

    // Share food form
    document.getElementById('shareFoodForm').addEventListener('submit', function(e) {
        e.preventDefault();
        shareFood();
    });
}

function initializeMap() {
    map = L.map('map').setView([currentLocation.lat, currentLocation.lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add user location marker
    L.marker([currentLocation.lat, currentLocation.lng])
        .addTo(map)
        .bindPopup('Your Location')
        .openPopup();
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                if (map) {
                    map.setView([currentLocation.lat, currentLocation.lng], 13);
                }

                // Update user location if logged in
                if (currentUser) {
                    updateUserLocation();
                }
            },
            function(error) {
                console.log('Error getting location:', error);
                showNotification('Unable to get your location. Using default location.', 'warning');
            }
        );
    } else {
        showNotification('Geolocation is not supported by this browser.', 'warning');
    }
}

function updateUserLocation() {
    fetch('/api/update-location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log('Location updated successfully');
        }
    })
    .catch(error => {
        console.error('Error updating location:', error);
    });
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
            showNotification('Login successful!', 'success');
            loadFoodPostings();
            updateStats();
        } else {
            showNotification(data.error, 'danger');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'danger');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const preferences = document.getElementById('registerPreferences').value
        .split(',').map(p => p.trim()).filter(p => p);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                preferences,
                latitude: currentLocation.lat,
                longitude: currentLocation.lng
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
            showNotification('Registration successful!', 'success');
            loadFoodPostings();
            updateStats();
        } else {
            showNotification(data.error, 'danger');
        }
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'danger');
    }
}

function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    showSection('home');
    updateProfileInfo();
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionName + '-section');
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Load section-specific data
    switch(sectionName) {
        case 'home':
            updateStats();
            loadMapData();
            break;
        case 'postings':
            loadFoodPostings();
            break;
        case 'recommendations':
            loadRecommendations();
            break;
        case 'profile':
            loadUserActivity();
            break;
    }
}

async function loadFoodPostings() {
    const container = document.getElementById('foodPostingsList');
    const spinner = container.querySelector('.loading-spinner');
    
    spinner.classList.add('show');

    try {
        const response = await fetch(`/api/food-postings?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=10`);
        const postings = await response.json();

        spinner.classList.remove('show');

        if (postings.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No food postings available near you.</p></div>';
            return;
        }

        const postingsHTML = postings.map(posting => `
            <div class="col-md-6 col-lg-4">
                <div class="card food-card fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${posting.title}</h5>
                            <span class="food-type-badge">${posting.food_type}</span>
                        </div>
                        <p class="card-text">${posting.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted"><i class="fas fa-weight"></i> ${posting.quantity}</small>
                            <span class="distance-badge">${posting.distance.toFixed(1)} km</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <small class="text-muted"><i class="fas fa-user"></i> ${posting.username}</small>
                            <small class="text-muted"><i class="fas fa-clock"></i> ${formatTime(posting.available_until)}</small>
                        </div>
                        <button class="btn btn-success w-100" onclick="claimFood(${posting.id})">
                            <i class="fas fa-hand-holding-heart"></i> Claim Food
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = postingsHTML;
    } catch (error) {
        spinner.classList.remove('show');
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading food postings.</p></div>';
    }
}

async function loadRecommendations() {
    const container = document.getElementById('recommendationsList');
    const spinner = container.querySelector('.loading-spinner');
    
    spinner.classList.add('show');

    try {
        const response = await fetch(`/api/recommendations/${currentUser.id}`);
        const recommendations = await response.json();

        spinner.classList.remove('show');

        if (recommendations.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No recommendations available. Set your food preferences in profile!</p></div>';
            return;
        }

        const recommendationsHTML = recommendations.map(rec => `
            <div class="col-md-6 col-lg-4">
                <div class="card food-card fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${rec.posting.title}</h5>
                            <span class="food-type-badge">${rec.posting.food_type}</span>
                        </div>
                        <p class="card-text">${rec.posting.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted"><i class="fas fa-weight"></i> ${rec.posting.quantity}</small>
                            <span class="distance-badge">${rec.distance.toFixed(1)} km</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <small class="text-muted"><i class="fas fa-star"></i> ${(rec.similarity_score * 100).toFixed(0)}% match</small>
                            <small class="text-muted"><i class="fas fa-user"></i> ${rec.posting.username}</small>
                        </div>
                        <button class="btn btn-success w-100" onclick="claimFood(${rec.posting.id})">
                            <i class="fas fa-hand-holding-heart"></i> Claim Food
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = recommendationsHTML;
    } catch (error) {
        spinner.classList.remove('show');
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading recommendations.</p></div>';
    }
}

async function shareFood() {
    const title = document.getElementById('foodTitle').value;
    const description = document.getElementById('foodDescription').value;
    const quantity = document.getElementById('foodQuantity').value;
    const availableUntil = document.getElementById('availableUntil').value;

    try {
        const response = await fetch('/api/food-postings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                title,
                description,
                quantity,
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                available_until: availableUntil
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Food posted successfully!', 'success');
            document.getElementById('shareFoodForm').reset();
            showSection('postings');
        } else {
            showNotification('Error posting food. Please try again.', 'danger');
        }
    } catch (error) {
        showNotification('Error posting food. Please try again.', 'danger');
    }
}

async function claimFood(postingId) {
    const message = prompt('Would you like to add a message for the food provider? (Optional)');
    
    try {
        const response = await fetch('/api/claim-food', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                posting_id: postingId,
                claimer_id: currentUser.id,
                message: message || ''
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Food claimed successfully! The provider will contact you.', 'success');
            loadFoodPostings();
        } else {
            showNotification('Error claiming food. Please try again.', 'danger');
        }
    } catch (error) {
        showNotification('Error claiming food. Please try again.', 'danger');
    }
}

function updateStats() {
    // Simulated stats - in a real app, these would come from the API
    document.getElementById('totalPostings').textContent = Math.floor(Math.random() * 50) + 10;
    document.getElementById('totalUsers').textContent = Math.floor(Math.random() * 200) + 50;
    document.getElementById('totalClaims').textContent = Math.floor(Math.random() * 30) + 5;
    document.getElementById('wasteSaved').textContent = Math.floor(Math.random() * 100) + 20;
}

function updateProfileInfo() {
    if (currentUser) {
        document.getElementById('profileUsername').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('memberSince').textContent = new Date(currentUser.created_at).toLocaleDateString();
    }
}

function loadUserActivity() {
    const container = document.getElementById('userActivity');
    // Simulated activity data
    const activities = [
        { type: 'posting', text: 'You posted "Fresh vegetables"', time: '2 hours ago' },
        { type: 'claim', text: 'You claimed "Homemade bread"', time: '1 day ago' },
        { type: 'registration', text: 'You joined Food Alert', time: '3 days ago' }
    ];

    const activityHTML = activities.map(activity => `
        <div class="d-flex align-items-center mb-3">
            <div class="me-3">
                <i class="fas fa-${getActivityIcon(activity.type)} text-primary"></i>
            </div>
            <div>
                <p class="mb-0">${activity.text}</p>
                <small class="text-muted">${activity.time}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = activityHTML;
}

function getActivityIcon(type) {
    switch(type) {
        case 'posting': return 'plus-circle';
        case 'claim': return 'hand-holding-heart';
        case 'registration': return 'user-plus';
        default: return 'circle';
    }
}

function loadMapData() {
    if (map && currentUser) {
        // Clear existing markers except user location
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && !layer.getPopup().getContent().includes('Your Location')) {
                map.removeLayer(layer);
            }
        });

        // Load food postings on map
        fetch(`/api/food-postings?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=10`)
            .then(response => response.json())
            .then(postings => {
                postings.forEach(posting => {
                    const marker = L.marker([posting.latitude, posting.longitude])
                        .addTo(map)
                        .bindPopup(`
                            <div>
                                <h6>${posting.title}</h6>
                                <p>${posting.description}</p>
                                <small><strong>Quantity:</strong> ${posting.quantity}</small><br>
                                <small><strong>Distance:</strong> ${posting.distance.toFixed(1)} km</small><br>
                                <small><strong>Available until:</strong> ${formatTime(posting.available_until)}</small>
                            </div>
                        `);
                });
            })
            .catch(error => {
                console.error('Error loading map data:', error);
            });
    }
}

function showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notifications');
    const notificationId = 'notification-' + Date.now();
    
    const notificationHTML = `
        <div id="${notificationId}" class="notification-content">
            <div class="d-flex align-items-center">
                <div class="me-2">
                    <i class="fas fa-${getNotificationIcon(type)} text-${type}"></i>
                </div>
                <div>
                    <p class="mb-0">${message}</p>
                </div>
                <button type="button" class="btn-close ms-auto" onclick="removeNotification('${notificationId}')"></button>
            </div>
        </div>
    `;
    
    notificationsContainer.insertAdjacentHTML('beforeend', notificationHTML);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeNotification(notificationId);
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'danger': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.remove();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    showNotification('Logged out successfully!', 'success');
}

async function alertNearbyUsers() {
    if (!currentUser) {
        showNotification('Please login to send alerts', 'warning');
        return;
    }

    // First, ask if user wants to take a picture
    const takePicture = confirm('Do you want to take a picture of the food item?');
    
    let imageData = null;
    let cameraUsed = false;
    
    if (takePicture) {
        // Open camera immediately after user says yes
        try {
            imageData = await captureWithCamera();
            cameraUsed = true;
            
            if (imageData) {
                showNotification('Picture captured successfully!', 'success');
            } else {
                showNotification('Camera access denied or not available', 'warning');
            }
        } catch (error) {
            showNotification('Error accessing camera: ' + error.message, 'danger');
        }
    }

    // Get custom message from user
    const customMessage = prompt('Enter a message to send to nearby users (optional):', 
        cameraUsed ? 'Food available nearby! I\'ve attached a picture.' : 'Food available nearby! Check the app for details.');
    
    if (customMessage === null) {
        return; // User cancelled
    }

    try {
        const response = await fetch('/api/alert-nearby-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                message: customMessage.trim() || 'Food available nearby! Check the app for details.',
                image_data: imageData,
                camera_used: cameraUsed,
                location: {
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(
                `Alert sent successfully to ${data.total_nearby_users} nearby users!`, 
                'success'
            );
            
            // Show details of who received the alert
            if (data.alerts_sent && data.alerts_sent.length > 0) {
                const recipientList = data.alerts_sent
                    .map(alert => `${alert.recipient_username} (${alert.distance.toFixed(1)}km away)`)
                    .join(', ');
                
                showNotification(
                    `Alert received by: ${recipientList}`, 
                    'info'
                );
            }
        } else {
            showNotification(data.error || 'Failed to send alert', 'danger');
        }
    } catch (error) {
        showNotification('Error sending alert. Please try again.', 'danger');
    }
}

async function captureWithCamera() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error('Camera not supported in this browser'));
            return;
        }

        // Create camera modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                <h3>Take a Picture</h3>
                <video id="cameraVideo" style="width: 100%; max-width: 400px; border-radius: 5px;" autoplay></video>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
                <div style="margin-top: 15px;">
                    <button id="captureBtn" class="btn btn-primary me-2">
                        <i class="fas fa-camera"></i> Capture
                    </button>
                    <button id="cancelBtn" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const video = modal.querySelector('#cameraVideo');
        const canvas = modal.querySelector('#cameraCanvas');
        const captureBtn = modal.querySelector('#captureBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        let stream = null;

        // Start camera
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then(s => {
            stream = s;
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing camera:', error);
            cleanup();
            reject(error);
        });

        // Capture button
        captureBtn.addEventListener('click', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            cleanup();
            resolve(imageData);
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        function cleanup() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            document.body.removeChild(modal);
        }
    });
}

// Chatbot Functions
function initializeChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Toggle chatbot window
    chatbotToggle.addEventListener('click', () => {
        const isVisible = chatbotWindow.style.display !== 'none';
        chatbotWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            chatbotInput.focus();
        }
    });

    // Close chatbot window
    chatbotClose.addEventListener('click', () => {
        chatbotWindow.style.display = 'none';
    });

    // Send message on button click
    chatbotSend.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addChatMessage(message, 'user');
        
        // Clear input
        chatbotInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        // Process message and get response
        setTimeout(() => {
            const response = generateChatbotResponse(message);
            removeTypingIndicator();
            addChatMessage(response, 'bot');
        }, 1000);
    }

    function addChatMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.style.cssText = sender === 'user' 
            ? 'background: var(--primary-color); color: white; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px; margin-left: auto; max-width: 80%; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'
            : 'background: white; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px; margin-right: auto; max-width: 80%; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';
        
        const prefix = sender === 'user' ? '👤 You:' : '🤖 Food Alert Assistant:';
        messageContent.innerHTML = `<strong>${prefix}</strong><br>${message}`;
        
        messageDiv.appendChild(messageContent);
        chatbotMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message bot-message';
        typingDiv.innerHTML = `
            <div style="background: white; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px; margin-right: auto; max-width: 80%; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <strong>🤖 Food Alert Assistant:</strong><br>
                <span style="color: #666;">Typing...</span>
            </div>
        `;
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

function generateChatbotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Greeting patterns
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hello! 👋 I'm here to help you with Food Alert. How can I assist you today?";
    }

    // Help patterns
    if (message.includes('help') || message.includes('assist') || message.includes('support')) {
        return "I can help you with:\n• Finding food near you\n• Posting food items\n• Using the camera feature\n• Navigating the app\n• Answering questions about food sharing\n\nWhat would you like help with?";
    }

    // Finding food patterns
    if (message.includes('find') && message.includes('food')) {
        if (currentUser) {
            return "To find food near you:\n1. Click on 'Available Food' in the navigation\n2. You'll see all food postings within 10km of your location\n3. Use the map to see locations visually\n4. Click 'Claim Food' on any item you're interested in\n\nWould you like me to show you the available food section?";
        } else {
            return "To find food near you, you'll need to login first. Please create an account or login to see available food postings in your area.";
        }
    }

    // Posting food patterns
    if (message.includes('post') && message.includes('food') || message.includes('share') && message.includes('food')) {
        if (currentUser) {
            return "To post food:\n1. Click on 'Share Food' in the navigation\n2. Fill in the food details (title, description, quantity)\n3. Set when the food will be available until\n4. Click 'Share Food'\n\nYour posting will be visible to nearby users immediately!";
        } else {
            return "To share food, you'll need to login first. Please create an account or login to start posting food items.";
        }
    }

    // Camera patterns
    if (message.includes('camera') || message.includes('picture') || message.includes('photo')) {
        return "The camera feature helps you share photos of food items:\n• Click 'Alert Nearby' to send alerts with photos\n• You can choose to take a picture when sending alerts\n• The app uses your device's camera for high-quality photos\n• Photos help other users see exactly what's available\n\nTry sending an alert with a photo next time!";
    }

    // Navigation patterns
    if (message.includes('navigate') || message.includes('menu') || message.includes('section')) {
        return "Here's how to navigate the app:\n• **Home**: Dashboard with stats and map\n• **Available Food**: Browse all food postings\n• **For You**: Personalized recommendations\n• **Share Food**: Post your own food items\n• **Profile**: View your account and activity\n\nUse the navigation menu at the top to switch between sections.";
    }

    // Alert patterns
    if (message.includes('alert') || message.includes('notify')) {
        if (currentUser) {
            return "To send alerts to nearby users:\n1. Click the red 'Alert Nearby' button\n2. Choose if you want to take a picture\n3. Add a custom message (optional)\n4. Send the alert\n\nYour alert will be sent to users within 5km of your location!";
        } else {
            return "To send alerts, you'll need to login first. The alert feature helps you quickly notify nearby users about available food.";
        }
    }

    // Account patterns
    if (message.includes('account') || message.includes('login') || message.includes('register') || message.includes('signup')) {
        return "For account management:\n• **Login**: Use your username and password\n• **Register**: Create a new account with email and preferences\n• **Profile**: View your activity and account details\n• Food preferences help us recommend better matches for you!";
    }

    // Location patterns
    if (message.includes('location') || message.includes('gps') || message.includes('map')) {
        return "The app uses your location to:\n• Find food near you\n• Show your position on the map\n• Calculate distances to food postings\n• Send alerts to nearby users\n\nMake sure to allow location access for the best experience!";
    }

    // Recommendation patterns
    if (message.includes('recommend') || message.includes('suggestion')) {
        if (currentUser) {
            return "Recommendations are personalized based on:\n• Your food preferences\n• Your location\n• Available items near you\n• Similarity matching algorithm\n\nCheck the 'For You' section to see personalized recommendations!";
        } else {
            return "Recommendations are available once you login and set your food preferences. The system learns what you like and suggests the best matches!";
        }
    }

    // Safety/quality patterns
    if (message.includes('safe') || message.includes('quality') || message.includes('fresh')) {
        return "Food safety is important!\n• Check food appearance before claiming\n• Communicate with the food provider\n• Follow the provider's availability timeline\n• Use your best judgment\n• Report any concerns through the app\n\nThe community relies on trust and respect!";
    }

    // Community patterns
    if (message.includes('community') || message.includes('waste') || message.includes('environment')) {
        return "Food Alert helps build community and reduce waste:\n• Connect neighbors through food sharing\n• Reduce food waste and environmental impact\n• Save money on food costs\n• Build local community relationships\n• Promote sustainable living\n\nEvery shared meal makes a difference!";
    }

    // Technical issues
    if (message.includes('problem') || message.includes('issue') || message.includes('error') || message.includes('bug')) {
        return "Having technical issues? Try:\n• Refresh the page\n• Check your internet connection\n• Allow location and camera permissions\n• Use a modern browser\n• Clear browser cache\n\nIf issues persist, the app might be undergoing maintenance.";
    }

    // Mobile app patterns
    if (message.includes('mobile') || message.includes('app') || message.includes('download')) {
        return "Food Alert is available as:\n• **Web App**: Use directly in your browser\n• **Mobile Apps**: Download for iOS and Android\n• Both versions have the same core features\n• Mobile apps offer better camera integration\n\nCheck the hero section for download links!";
    }

    // Time/availability patterns
    if (message.includes('time') || message.includes('available') || message.includes('until')) {
        return "Food availability is important:\n• Each posting shows when food is available until\n• Set realistic timeframes when posting\n• Check availability before claiming\n• Food providers can update availability\n• Expired postings are automatically removed\n\nFreshness and timing matter!";
    }

    // Default response
    return "I'm here to help with Food Alert! You can ask me about:\n• Finding food near you\n• Posting food items\n• Using camera features\n• Navigation and app usage\n• Account management\n• Safety and community guidelines\n• Technical support\n\nWhat specific question can I help you with?";
}

async function captureWithAR() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error('Camera not supported in this browser'));
            return;
        }

        // Create AR modal with enhanced features
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; position: relative;">
                <h3>AR Mode - Enhanced Capture</h3>
                <div style="position: relative; display: inline-block;">
                    <video id="arVideo" style="width: 100%; max-width: 400px; border-radius: 5px;" autoplay></video>
                    <canvas id="arCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                    <!-- AR Overlay Elements -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 3px solid #00ff00; border-radius: 10px; width: 200px; height: 200px; pointer-events: none;">
                        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #00ff00; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
                            Scan Item
                        </div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <button id="arCaptureBtn" class="btn btn-success me-2">
                        <i class="fas fa-camera"></i> AR Capture
                    </button>
                    <button id="arCancelBtn" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    <i class="fas fa-info-circle"></i> Position the food item within the green frame for best results
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const video = modal.querySelector('#arVideo');
        const canvas = modal.querySelector('#arCanvas');
        const captureBtn = modal.querySelector('#arCaptureBtn');
        const cancelBtn = modal.querySelector('#arCancelBtn');

        let stream = null;
        let arContext = null;

        // Start camera
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            
            // Setup AR canvas
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            arContext = canvas.getContext('2d');
            
            // Start AR overlay animation
            startAROverlay();
        })
        .catch(error => {
            console.error('Error accessing camera:', error);
            cleanup();
            reject(error);
        });

        function startAROverlay() {
            function animate() {
                if (!arContext) return;
                
                // Clear canvas
                arContext.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw AR grid overlay
                arContext.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                arContext.lineWidth = 1;
                
                const gridSize = 50;
                for (let x = 0; x < canvas.width; x += gridSize) {
                    arContext.beginPath();
                    arContext.moveTo(x, 0);
                    arContext.lineTo(x, canvas.height);
                    arContext.stroke();
                }
                
                for (let y = 0; y < canvas.height; y += gridSize) {
                    arContext.beginPath();
                    arContext.moveTo(0, y);
                    arContext.lineTo(canvas.width, y);
                    arContext.stroke();
                }
                
                // Draw corner markers
                const markerSize = 20;
                arContext.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                arContext.lineWidth = 3;
                
                // Top-left corner
                arContext.beginPath();
                arContext.moveTo(markerSize, 0);
                arContext.lineTo(0, 0);
                arContext.lineTo(0, markerSize);
                arContext.stroke();
                
                // Top-right corner
                arContext.beginPath();
                arContext.moveTo(canvas.width - markerSize, 0);
                arContext.lineTo(canvas.width, 0);
                arContext.lineTo(canvas.width, markerSize);
                arContext.stroke();
                
                // Bottom-left corner
                arContext.beginPath();
                arContext.moveTo(markerSize, canvas.height);
                arContext.lineTo(0, canvas.height);
                arContext.lineTo(0, canvas.height - markerSize);
                arContext.stroke();
                
                // Bottom-right corner
                arContext.beginPath();
                arContext.moveTo(canvas.width - markerSize, canvas.height);
                arContext.lineTo(canvas.width, canvas.height);
                arContext.lineTo(canvas.width, canvas.height - markerSize);
                arContext.stroke();
                
                requestAnimationFrame(animate);
            }
            
            animate();
        }

        // AR Capture button
        captureBtn.addEventListener('click', () => {
            // Create a temporary canvas for the final capture
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;
            const ctx = tempCanvas.getContext('2d');
            
            // Draw video frame
            ctx.drawImage(video, 0, 0);
            
            // Draw AR overlay on top
            ctx.drawImage(canvas, 0, 0);
            
            // Add timestamp and location info
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, tempCanvas.height - 60, 300, 50);
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(`AR Capture - ${new Date().toLocaleString()}`, 20, tempCanvas.height - 40);
            ctx.fillText(`Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`, 20, tempCanvas.height - 20);
            
            const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
            cleanup();
            resolve(imageData);
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        function cleanup() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}
