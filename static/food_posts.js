// Global variables
let currentUser = null;
let posts = [];
let currentLocation = { lat: 6.5244, lng: 3.3792 }; // Default to Lagos, Nigeria

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showFoodPostsContent();
        loadFoodPosts();
    } else {
        showAuthCheck();
    }
}

function setupEventListeners() {
    // Create post form submission is now handled by submitPost() function
    // Modal close event listener to reset form
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('createPostForm').reset();
        });
    }
}

// Function to open the create post modal
function openCreateModal() {
    const modal = new bootstrap.Modal(document.getElementById('createPostModal'));
    modal.show();
}

// Function to submit post from modal
function submitPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const foodType = document.getElementById('postFoodType').value;
    const rating = document.getElementById('postRating').value;
    const imageUrl = document.getElementById('postImageUrl').value;

    // Validate required fields
    if (!title || !content || !foodType) {
        showNotification('Please fill in all required fields.', 'warning');
        return;
    }

    createFoodPost();
}

function showAuthCheck() {
    document.getElementById('auth-check').style.display = 'block';
    document.getElementById('food-posts-content').style.display = 'none';
}

function showFoodPostsContent() {
    document.getElementById('auth-check').style.display = 'none';
    document.getElementById('food-posts-content').style.display = 'block';
}

async function loadFoodPosts() {
    const container = document.getElementById('postsFeed');
    const spinner = container.querySelector('.loading-spinner');
    
    spinner.classList.add('show');

    try {
        const response = await fetch(`/api/food-posts?current_user_id=${currentUser.id}`);
        const data = await response.json();

        spinner.classList.remove('show');

        if (data.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h5>No Food Posts Yet</h5>
                    <p>Be the first to share your food experience!</p>
                </div>
            `;
            return;
        }

        const postsHTML = data.posts.map(post => createPostHTML(post)).join('');
        container.innerHTML = postsHTML;

        // Add event listeners for like buttons and comment forms
        setupPostEventListeners();

    } catch (error) {
        spinner.classList.remove('show');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h5>Error Loading Posts</h5>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

function createPostHTML(post) {
    const timeAgo = formatTimeAgo(post.created_at);
    const ratingStars = post.rating > 0 ? generateRatingStars(post.rating) : '';
    
    return `
        <div class="food-post-card fade-in" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar">
                    ${post.username.charAt(0).toUpperCase()}
                </div>
                <div class="post-user-info">
                    <h6>${post.username}</h6>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
            
            <div class="post-content">
                ${post.title ? `<div class="post-title">${post.title}</div>` : ''}
                <div class="post-text">${post.content}</div>
                
                ${post.image_url ? `<img src="${post.image_url}" alt="Food image" class="post-image" onerror="this.style.display='none'">` : ''}
                
                <div class="post-meta">
                    <span class="food-type-badge">${post.food_type}</span>
                    ${ratingStars ? `<span class="rating">${ratingStars}</span>` : ''}
                </div>
            </div>
            
            <div class="post-actions">
                <button class="action-btn like-btn ${post.is_liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${post.likes_count}</span>
                </button>
                
                <button class="action-btn comment-btn" onclick="toggleComments(${post.id})">
                    <i class="fas fa-comment"></i>
                    <span class="comment-count">${post.comments_count}</span>
                </button>
                
                <button class="action-btn share-btn" onclick="sharePost(${post.id})">
                    <i class="fas fa-share"></i>
                    Share
                </button>
            </div>
            
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-list" id="comments-list-${post.id}">
                    <!-- Comments will be loaded here -->
                </div>
                <div class="add-comment">
                    <div class="input-group">
                        <textarea class="comment-input" id="comment-input-${post.id}" placeholder="Add a comment..." rows="2"></textarea>
                        <button class="btn btn-primary btn-sm" onclick="addComment(${post.id})" style="margin-left: 10px; align-self: flex-end;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '⭐';
        } else {
            stars += '☆';
        }
    }
    return stars;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function setupPostEventListeners() {
    // Event listeners are set up via onclick attributes in the HTML
}

async function createFoodPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const foodType = document.getElementById('postFoodType').value;
    const rating = document.getElementById('postRating').value;
    const imageUrl = document.getElementById('postImageUrl').value;

    try {
        const response = await fetch('/api/food-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                title,
                content,
                food_type: foodType,
                rating: rating ? parseInt(rating) : 0,
                image_url: imageUrl || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Food post created successfully!', 'success');
            document.getElementById('createPostForm').reset();
            loadFoodPosts(); // Reload posts to show the new one
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
            if (modal) {
                modal.hide();
            }
        } else {
            showNotification('Error creating post. Please try again.', 'danger');
        }
    } catch (error) {
        showNotification('Error creating post. Please try again.', 'danger');
    }
}

async function toggleLike(postId) {
    try {
        const response = await fetch(`/api/food-posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Update the UI
            const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
            const likeCount = likeBtn.querySelector('.like-count');
            
            likeCount.textContent = data.likes_count;
            
            if (data.action === 'liked') {
                likeBtn.classList.add('liked');
                showNotification('Post liked!', 'success');
            } else {
                likeBtn.classList.remove('liked');
                showNotification('Post unliked!', 'info');
            }
        } else {
            showNotification('Error updating like. Please try again.', 'danger');
        }
    } catch (error) {
        showNotification('Error updating like. Please try again.', 'danger');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (commentsSection.style.display === 'none') {
        // Load comments
        try {
            const response = await fetch(`/api/food-posts/${postId}/comments`);
            const data = await response.json();
            
            if (data.comments.length === 0) {
                commentsList.innerHTML = '<p class="text-muted text-center">No comments yet. Be the first to comment!</p>';
            } else {
                const commentsHTML = data.comments.map(comment => createCommentHTML(comment)).join('');
                commentsList.innerHTML = commentsHTML;
            }
            
            commentsSection.style.display = 'block';
        } catch (error) {
            showNotification('Error loading comments. Please try again.', 'danger');
        }
    } else {
        commentsSection.style.display = 'none';
    }
}

function createCommentHTML(comment) {
    const timeAgo = formatTimeAgo(comment.created_at);
    
    return `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-avatar">
                    ${comment.username.charAt(0).toUpperCase()}
                </div>
                <span class="comment-author">${comment.username}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <div class="comment-text">${comment.content}</div>
        </div>
    `;
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    
    if (!content) {
        showNotification('Please enter a comment.', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/food-posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                content
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear input
            commentInput.value = '';
            
            // Reload comments
            const commentsList = document.getElementById(`comments-list-${postId}`);
            const newComment = createCommentHTML(data.comment);
            
            if (commentsList.querySelector('.text-muted')) {
                // Remove "no comments" message
                commentsList.innerHTML = newComment;
            } else {
                commentsList.insertAdjacentHTML('beforeend', newComment);
            }
            
            // Update comment count
            const commentBtn = document.querySelector(`[data-post-id="${postId}"] .comment-btn`);
            const commentCount = commentBtn.querySelector('.comment-count');
            commentCount.textContent = data.comments_count;
            
            showNotification('Comment added successfully!', 'success');
        } else {
            showNotification('Error adding comment. Please try again.', 'danger');
        }
    } catch (error) {
        showNotification('Error adding comment. Please try again.', 'danger');
    }
}

function sharePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        // Create share text
        const shareText = `Check out this food post on Food Alert: ${post.title || 'Great food experience!'}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Food Alert Post',
                text: shareText,
                url: window.location.href
            }).catch(() => {
                // Fallback to copying to clipboard
                copyToClipboard(shareText);
            });
        } else {
            // Fallback to copying to clipboard
            copyToClipboard(shareText);
        }
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Post link copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Unable to copy link. Please copy manually.', 'warning');
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 350px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}
