document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupEventListeners();
});

const API_URL = 'https://jsonplaceholder.typicode.com';

function setupEventListeners() {
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    title,
                    body: content,
                    userId: 1
                })
            });

            if (!response.ok) throw new Error('Failed to create post');

            const post = await response.json();
            addPostToDOM({
                id: post.id,
                title: post.title,
                content: post.body,
                created_at: new Date().toISOString()
            });
            e.target.reset();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    });
}

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts?_limit=10&_sort=id&_order=desc`);
        if (!response.ok) throw new Error('Failed to load posts');

        const posts = await response.json();
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '';
        
        posts.forEach(post => addPostToDOM({
            id: post.id,
            title: post.title,
            content: post.body,
            created_at: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error loading posts:', error);
        alert('Failed to load posts. Please refresh the page.');
    }
}

function addPostToDOM(post) {
    const template = document.getElementById('post-template');
    const postElement = template.content.cloneNode(true);
    
    postElement.querySelector('.post-title').textContent = post.title;
    postElement.querySelector('.post-date').textContent = formatDate(post.created_at);
    postElement.querySelector('.post-content').textContent = post.content;

    const commentsList = postElement.querySelector('.comments-list');
    post.comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
    });

    const commentForm = postElement.querySelector('.comment-form');
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = e.target.querySelector('textarea');
        const content = textarea.value;

        try {
            const response = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error('Failed to add comment');

            const comment = await response.json();
            const commentElement = createCommentElement(comment);
            commentsList.insertBefore(commentElement, commentsList.firstChild);
            textarea.value = '';
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    });

    const postsContainer = document.getElementById('posts');
    postsContainer.insertBefore(postElement, postsContainer.firstChild);
}

function createCommentElement(comment) {
    const template = document.getElementById('comment-template');
    const commentElement = template.content.cloneNode(true);
    
    commentElement.querySelector('.comment-content').textContent = comment.content;
    commentElement.querySelector('.comment-date').textContent = formatDate(comment.created_at);
    
    return commentElement;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 