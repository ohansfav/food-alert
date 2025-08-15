// Futuristic Profile JavaScript
class FuturisticProfile {
    constructor() {
        this.userData = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.startAnimations();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.getAttribute('href'));
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Floating action button
        document.getElementById('fab-edit')?.addEventListener('click', () => {
            this.openEditModal();
        });

        // Achievement badges
        document.querySelectorAll('.achievement-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                this.showAchievementDetails(badge);
            });
        });
    }

    async loadUserData() {
        this.showLoading();
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock user data
            this.userData = {
                id: 1,
                username: 'CyberFoodie',
                email: 'cyber@foodalert.com',
                level: 42,
                avatar: 'CF',
                stats: {
                    foodShared: 247,
                    foodClaimed: 89,
                    communityScore: 1567,
                    wastePrevented: 456
                },
                achievements: [
                    { id: 1, name: 'Food Guardian', description: 'Shared 100+ food items', icon: '🛡️' },
                    { id: 2, name: 'Waste Warrior', description: 'Prevented 500kg of waste', icon: '⚔️' },
                    { id: 3, name: 'Community Champion', description: 'Helped 50+ people', icon: '👑' },
                    { id: 4, name: 'Eco Hero', description: 'Reduced carbon footprint', icon: '🌱' }
                ],
                recentActivity: [
                    { type: 'shared', title: 'Shared Fresh Vegetables', time: '2 hours ago', impact: '5kg waste prevented' },
                    { type: 'claimed', title: 'Claimed Bakery Items', time: '1 day ago', impact: '2kg waste prevented' },
                    { type: 'achievement', title: 'Unlocked Food Guardian', time: '2 days ago', impact: 'Level up!' }
                ],
                preferences: ['Vegetables', 'Fruits', 'Bakery'],
                location: { lat: 6.5244, lng: 3.3792 }
            };
            
            this.renderUserData();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Failed to load profile data');
        }
    }

    renderUserData() {
        if (!this.userData) return;

        // Update user info
        document.getElementById('username').textContent = this.userData.username;
        document.getElementById('user-level').textContent = `Level ${this.userData.level}`;
        document.getElementById('user-avatar').textContent = this.userData.avatar;

        // Update stats
        document.getElementById('food-shared').textContent = this.userData.stats.foodShared;
        document.getElementById('food-claimed').textContent = this.userData.stats.foodClaimed;
        document.getElementById('community-score').textContent = this.userData.stats.communityScore;
        document.getElementById('waste-prevented').textContent = this.userData.stats.wastePrevented;

        // Render achievements
        this.renderAchievements();
        
        // Render activity timeline
        this.renderActivityTimeline();
        
        // Update progress bars
        this.updateProgressBars();
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        if (!container) return;

        container.innerHTML = '';
        
        this.userData.achievements.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = 'achievement-badge';
            badge.innerHTML = `
                <span>${achievement.icon}</span>
                <span>${achievement.name}</span>
            `;
            badge.title = achievement.description;
            container.appendChild(badge);
        });
    }

    renderActivityTimeline() {
        const container = document.getElementById('activity-timeline');
        if (!container) return;

        container.innerHTML = '';
        
        this.userData.recentActivity.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            const icon = this.getActivityIcon(activity.type);
            const color = this.getActivityColor(activity.type);
            
            item.innerHTML = `
                <div class="timeline-icon" style="background: ${color}">
                    ${icon}
                </div>
                <div class="timeline-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.time} • ${activity.impact}</p>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    getActivityIcon(type) {
        const icons = {
            shared: '📤',
            claimed: '📥',
            achievement: '🏆'
        };
        return icons[type] || '📋';
    }

    getActivityColor(type) {
        const colors = {
            shared: '#00ffff',
            claimed: '#ff00ff',
            achievement: '#39ff14'
        };
        return colors[type] || '#ffffff';
    }

    updateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const value = bar.getAttribute('data-value');
            if (value) {
                bar.style.width = `${value}%`;
            }
        });
    }

    startAnimations() {
        // Animate stats on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.stat-item, .dashboard-card').forEach(el => {
            observer.observe(el);
        });

        // Animate numbers
        this.animateNumbers();
    }

    animateNumbers() {
        const numbers = document.querySelectorAll('.stat-number');
        numbers.forEach(number => {
            const finalValue = parseInt(number.textContent);
            let currentValue = 0;
            const increment = finalValue / 50;
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    number.textContent = finalValue;
                    clearInterval(timer);
                } else {
                    number.textContent = Math.floor(currentValue);
                }
            }, 30);
        });
    }

    setupRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.updateLiveStats();
        }, 5000);
    }

    updateLiveStats() {
        // Simulate live updates
        const elements = document.querySelectorAll('.live-stat');
        elements.forEach(el => {
            const current = parseInt(el.textContent);
            const change = Math.floor(Math.random() * 3) - 1;
            const newValue = Math.max(0, current + change);
            el.textContent = newValue;
        });
    }

    handleNavigation(href) {
        // Handle navigation between sections
        const sections = document.querySelectorAll('.profile-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(href.replace('#', ''));
        if (targetSection) {
            targetSection.style.display = 'block';
            this.addSectionAnimation(targetSection);
        }
    }

    addSectionAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }
    }

    openEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) {
            modal.style.display = 'block';
            this.populateEditForm();
        }
    }

    populateEditForm() {
        if (!this.userData) return;
        
        const form = document.getElementById('edit-profile-form');
        if (form) {
            form.username.value = this.userData.username;
            form.email.value = this.userData.email;
            form.preferences.value = this.userData.preferences.join(', ');
        }
    }

    saveProfile() {
        const form = document.getElementById('edit-profile-form');
        if (!form) return;

        const updatedData = {
            username: form.username.value,
            email: form.email.value,
            preferences: form.preferences.value.split(',').map(p => p.trim())
        };

        // Simulate API call
        this.showNotification('Profile updated successfully!', 'success');
        this.closeEditModal();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLoading() {
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'none';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Utility methods
    formatNumber(num) {
        return num.toLocaleString();
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    // Chart initialization
    initCharts() {
        // Placeholder for chart initialization
        console.log('Charts initialized');
    }

    // Real-time data simulation
    simulateRealTimeData() {
        setInterval(() => {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const current = parseInt(stat.textContent);
                const change = Math.floor(Math.random() * 5) - 2;
                stat.textContent = Math.max(0, current + change);
            });
        }, 10000);
    }
}

// Initialize the profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const profile = new FuturisticProfile();
    
    // Add some interactive elements
    document.addEventListener('mousemove', (e) => {
        const cursor = document.querySelector('.cursor-glow');
        if (cursor) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });
});

// Export for use in other modules
window.FuturisticProfile = FuturisticProfile;
