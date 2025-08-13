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

    // Get custom message from user
    const customMessage = prompt('Enter a message to send to nearby users (optional):', 
        'Food available nearby! Check the app for details.');
    
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
                message: customMessage.trim() || 'Food available nearby! Check the app for details.'
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
