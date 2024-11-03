const socket = io();
let authToken = null;
//navigation
function showSection(sectionId) {
    // Hide all sections
    document.getElementById("profile-section").style.display = 'none';
    document.getElementById("update-profile-section").style.display = 'none';
    // to show the requested section
    document.getElementById(sectionId).style.display = 'block';
}

function showLogin() {
    document.getElementById("signup-section").style.display = 'none';
    document.getElementById("forgot-password-section").style.display = 'none';
    document.getElementById("reset-password-section").style.display = 'none';
    document.getElementById("login-section").style.display = 'block';
}

function showSignup() {
    document.getElementById("login-section").style.display = 'none';
    document.getElementById("signup-section").style.display = 'block';
}

function showForgotPassword() {
    document.getElementById("login-section").style.display = 'none';
    document.getElementById("forgot-password-section").style.display = 'block';
}

function showResetPassword() {
    document.getElementById("forgot-password-section").style.display = 'none';
    document.getElementById("reset-password-section").style.display = 'block';
}

function logout() {
    authToken = null;
    localStorage.removeItem("authToken"); 
    document.getElementById("dashboard").style.display = 'none';
    showLogin(); // Redirect to login section or page
}
//Authentication
document.getElementById("signup-btn").addEventListener("click", signup);
document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("forgot-btn").addEventListener("click", forgotPassword);
document.getElementById("reset-btn").addEventListener("click", resetPassword);
document.getElementById("update-profile-btn").addEventListener("click", updateProfile);
document.getElementById("create-post-btn").addEventListener("click", submitPost);

async function forgotPassword() {
    const email = document.getElementById("forgot-email").value;
    const response = await fetch('/api/auth/forgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    document.getElementById("forgot-message").textContent = data.message;
    if (response.ok) {
        showResetPassword();
    }
}

async function resetPassword() {
    const email = document.getElementById("email").value;
    const otp = document.getElementById("otp").value;
    const newPassword = document.getElementById("new-password").value;
    const response = await fetch('/api/auth/resetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await response.json();
    document.getElementById("reset-message").textContent = data.message;
    if (response.ok) {
        showLogin();
    }
}

async function signup() {
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    document.getElementById("signup-message").textContent = data.message;
    if (response.ok) {
        showLogin();
    }
}
async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
        authToken = data.token;
        localStorage.setItem("authToken", authToken); // Save token to localStorage
        loadProfile();
        loadPosts();
        document.getElementById("login-section").style.display = 'none';
        document.getElementById("dashboard").style.display = 'flex';
    } else {
        document.getElementById("login-message").textContent = data.message;
    }
}

async function deactivateAccount() {
    try {
        const response = await fetch('/api/auth/deactivate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            }
        });
        const data = await response.json();
        if (response.ok) {
            alert("Account deactivated successfully.");
            showLogin();  // Redirect to login or handle the UI appropriately
        } else {
            alert(data.message || "Error deactivating account.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to deactivate account. Please try again.");
    }
}

async function deleteAccount() {
    try {
        const response = await fetch('/api/auth/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + authToken,  
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();

        if (response.ok) {
            alert("Account deleted successfully.");
            showLogin();  
        } else {
            alert(data.message || "Error deleting account.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to delete account. Please try again.");
    }
}

async function reactivateAccount() {
    try {
        const response = await fetch('/api/auth/reactivate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            }
        });
        const data = await response.json();
        if (response.ok) {
            alert("Account reactivated successfully.");
            loadProfile();  // Reload or redirect to the profile page
        } else {
            alert(data.message || "Error reactivating account.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to reactivate account. Please try again.");
    }
}

async function loadProfile() {
    const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const data = await response.json();
    if (response.ok) {
        document.getElementById("profile-username").textContent = data.username;
        document.getElementById("profile-email").textContent = data.email;
        document.getElementById("update-username").value = data.username; // Set current username for update
        document.getElementById("update-email").value = data.email; // Set current email for update
    } else {
        document.getElementById("profile-message").textContent = data.message;
    }
}

async function loadPosts() {
    await loadYourPosts();
    await loadTimelinePosts();
}

async function loadYourPosts() {
    const yourPostsContainer = document.getElementById('yourPostsContainer');
    yourPostsContainer.innerHTML = '<p>Loading posts...</p>'; // Loading message

    const response = await fetch('/api/posts/myposts', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + authToken }
    });

    const data = await response.json();
    yourPostsContainer.innerHTML = ''; // Clear loading message

    if (response.ok && data.posts) {
        data.posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                
                <p><strong>Posted by:</strong> ${post.userId.username || "Anonymous"}</p>
                <p><strong>Time:</strong> ${new Date(post.createdAt).toLocaleString() || "Just now"}</p>
                <p>${post.content}</p>
                <div class="media">
                    ${post.media.map(mediaPath => `
                        <img src="${mediaPath}" alt="Post Media" style="max-width: 100%; height: auto;" 
                             onerror="this.onerror=null; this.src='path/to/placeholder.jpg';" />
                    `).join('')}
                </div>
            <div class="actions">
            <span class="likes">${post.likeCount || 0} Likes</span>
            <button class="like-btn" onclick="likePost('${post._id}')"><i class="fas fa-thumbs-up"></i> <!-- Likeicon --></button>
            <button onclick="editPost('${post._id}')"><i class="fas fa-edit"></i> <!-- Update icon --></button>
            <button onclick="deletePost('${post._id}')"><i class="fas fa-trash-alt"></i> <!-- Delete icon --></button>
            </div>
            `;
            yourPostsContainer.appendChild(postElement);
        });
    } else {
        yourPostsContainer.innerHTML = '<p>No posts available.</p>';
    }
}

async function loadTimelinePosts() {
    const response = await fetch('/api/posts/timeline', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const data = await response.json();
    const timelinePostsContainer = document.getElementById('timelinePostsContainer');
    timelinePostsContainer.innerHTML = '';

    if (response.ok && data.timeline) {
        data.timeline.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                
                <p><strong>Posted by:</strong> ${post.userId.username || "Anonymous"}</p>
                <p><strong>Time:</strong> ${new Date(post.createdAt).toLocaleString() || "Just now"}</p>
                <p>${post.content}</p>
                <div class="media">
                    ${post.media.map(mediaPath => `
                        <img src="${mediaPath}" alt="Post Media" style="max-width: 100%; height: auto;" 
                             onerror="this.onerror=null; this.src='uploads/image8.jpg';margin-bottom: 5px" />
                    `).join('')}
                </div>
                <div class="actions">
                    <span class="likes">${post.likeCount || 0} Likes</span>
                <button class="like-btn" onclick="likePost('${post._id}')"><i class="fas fa-thumbs-up"></i> <!-- Like icon --></button>
                 <button onclick="editPost('${post._id}')"><i class="fas fa-edit"></i> <!-- Update icon --> </button>
                 <button onclick="deletePost('${post._id}')"><i class="fas fa-trash-alt"></i> <!-- Delete icon --></button>
                </div>
                <div class="comments">
                    <h4>Comments:</h4>
                    <div id="comments-${post._id}"></div>
                    <textarea placeholder="Add a comment" id="comment-input-${post._id}"></textarea>
                    <button onclick="addComment('${post._id}')"><i class="fas fa-comment"></i> Comment</button>
                </div>
            `;
            timelinePostsContainer.appendChild(postElement);
        });
    } else {
        timelinePostsContainer.innerHTML = '<p>No posts available.</p>';
    }
}


async function uploadCSV() {
    const csvFileInput = document.getElementById('csvFile');
    const formData = new FormData();
    formData.append('file', csvFileInput.files[0]);

    const response = await fetch('/api/posts/uploadcsv', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        body: formData
    });

    const data = await response.json();
    if (response.ok) {
        alert('CSV uploaded successfully!');
        loadYourPosts(); // Reload posts after upload
    } else {
        alert(data.message);
    }
}

async function submitPost() {
    const postContent = document.getElementById('postContent').value;
    const formData = new FormData();
    formData.append('content', postContent);
    const mediaInput = document.getElementById('media-input');
    Array.from(mediaInput.files).forEach(file => {
        formData.append('media', file);
    });

    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        body: formData
    });
    const data = await response.json();
    if (response.ok) {
        document.getElementById('postContent').value = '';
        mediaInput.value = ''; // Clear the input
        loadYourPosts();
        loadTimelinePosts();
    } else {
        alert(data.message);
    }
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const comment = commentInput.value;
    const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ content: comment })
    });
    const data = await response.json();
    if (response.ok) {
        commentInput.value = ''; // Clear the input
        loadComments(postId);
    } else {
        alert(data.message);
    }
}

async function loadComments(postId) {
    const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    });
    const data = await response.json();
    const commentsContainer = document.getElementById(`comments-${postId}`);
    commentsContainer.innerHTML = '';
    
    if (response.ok && data.comments) {
        data.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p>${comment.content}</p>
                <button onclick="deleteComment('${postId}', '${comment._id}')"><i class="fas fa-trash-alt"></i> Delete</button>
            `;
            commentsContainer.appendChild(commentElement);
        });
    } else {
        commentsContainer.innerHTML = '<p>No comments available.</p>';
    }
}

async function deleteComment(postId, commentId) {
    const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    });
    const data = await response.json();
    if (response.ok) {
        loadComments(postId);
    } else {
        alert(data.message);
    }
}

async function likePost(postId) {
    const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    });

    const data = await response.json();

    if (response.ok) {
        // Find the post element and update the like count and button style
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likesElement = postElement.querySelector('.likes');
            likesElement.textContent = `${data.likeCount} Likes`;

            // Update the button style to indicate it has been liked
            const likeButton = postElement.querySelector('button.like-btn');
            likeButton.style.color = 'blue'; // Example color change
            likeButton.disabled = true; // Disable to prevent multiple likes
        }
    } else {
        alert(data.message);
    }
}

async function deletePost(postId) {
    const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    });
    const data = await response.json();
    if (response.ok) {
        loadYourPosts();
        loadTimelinePosts();
    } else {
        alert(data.message);
    }
}

async function editPost(postId) {
    const newContent = prompt("Edit your post:");
    if (newContent) {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ content: newContent })
        });
        const data = await response.json();
        if (response.ok) {
            loadYourPosts();
            loadTimelinePosts();
        } else {
            alert(data.message);
        }
    }
}

async function updateProfile() {
    const newUsername = document.getElementById("update-username").value;
    const newEmail = document.getElementById("update-email").value;
    const newRole = document.getElementById("update-role").value;
    const response = await fetch('/api/auth/update', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ username: newUsername, email: newEmail })
    });
    const data = await response.json();
    if (response.ok) {
        loadProfile();
    } else { 
        alert(data.message);
    }
}
//  Chat Functionality Id's
const roomInput = document.getElementById('room-input');
const joinButton = document.getElementById('join-button');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');
const typingIndicator = document.getElementById('typing-indicator'); 

// Join Room
joinButton.addEventListener('click', () => {
    const room = roomInput.value;
    const user = { name: "User1", isAuthenticated: true }; // Replace with actual user data
    if (room) {
        socket.emit('join room', room, user);
    }
});

socket.on('authError', (message) => {
    alert(message);
});

// Send Message
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    const room = roomInput.value;
    if (room && message) {
        const data = { room, user: "User1", message }; // Replace "User1" as needed
        socket.emit('chat message', data); // Emit the chat message
        messageInput.value = ''; // Clear input field
        typingIndicator.innerText = '';
    }
});

// Display Previous Messages
socket.on('previousMessages', (messages) => {
    messagesContainer.innerHTML = ''; // Clear existing messages
    messages.forEach((msg) => displayMessage(msg)); // Display each message
});

// Display Incoming Messages
socket.on('chat message', (msg) => {
    displayMessage(msg); // Ensure this function is defined
});

// Typing Indicator
messageInput.addEventListener('input', () => {
    socket.emit('typing', roomInput.value);
    socket.emit('typing', room); // Emit typing event to the server
});

messageInput.addEventListener('blur', () => {
    socket.emit('stopTyping', roomInput.value);
    socket.emit('stopTyping', room);
});

socket.on('displayTyping', (status) => {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.innerText = status; 
});

// Add Reaction
function addReaction(messageId, emoji) {
    const room = roomInput.value;
    socket.emit('reactMessage', { room, messageId, emoji });
}
function displayMessage(msg) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${msg.user}: ${msg.message}`; // Format the message
    messagesContainer.appendChild(messageElement); // Append the new message
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to the bottom
}
function toggleChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = chatContainer.style.display === 'none' || chatContainer.style.display === '' ? 'block' : 'none';
}
