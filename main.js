document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.querySelector('.post-form');
    const postsContainer = document.querySelector('.posts');
    const postTemplate = document.querySelector('#post-template');
    const commentTemplate = document.querySelector('#comment-template');

    const API_URL = 'https://jsonplaceholder.typicode.com';
    let localPosts = JSON.parse(localStorage.getItem('localPosts')) || [];
    let localComments = JSON.parse(localStorage.getItem('localComments')) || {};

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const createPost = async (title, content) => {
        try {
            const newPost = {
                id: Date.now(),
                title,
                body: content,
                userId: 1,
                date: new Date().toISOString()
            };
            
            localPosts.unshift(newPost);
            localStorage.setItem('localPosts', JSON.stringify(localPosts));
            
            await fetch(`${API_URL}/posts`, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body: content,
                    userId: 1
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });

            renderPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    };

    const createComment = async (postId, content) => {
        try {
            const newComment = {
                id: Date.now(),
                postId,
                body: content,
                email: 'user@example.com',
                name: 'User',
                date: new Date().toISOString()
            };

            if (!localComments[postId]) {
                localComments[postId] = [];
            }
            localComments[postId].push(newComment);
            localStorage.setItem('localComments', JSON.stringify(localComments));

            await fetch(`${API_URL}/comments`, {
                method: 'POST',
                body: JSON.stringify({
                    postId,
                    body: content,
                    email: 'user@example.com',
                    name: 'User'
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });

            renderPosts();
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Failed to create comment. Please try again.');
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_URL}/posts?_limit=10&_sort=id&_order=desc`);
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            const apiPosts = await response.json();
            return [...localPosts, ...apiPosts];
        } catch (error) {
            console.error('Error fetching posts:', error);
            return localPosts;
        }
    };

    const fetchComments = async (postId) => {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const apiComments = await response.json();
            return [...(localComments[postId] || []), ...apiComments];
        } catch (error) {
            console.error('Error fetching comments:', error);
            return localComments[postId] || [];
        }
    };

    const renderPosts = async () => {
        postsContainer.innerHTML = '';
        const posts = await fetchPosts();
        
        for (const post of posts) {
            const postElement = postTemplate.content.cloneNode(true);
            
            postElement.querySelector('.post-title').textContent = post.title;
            postElement.querySelector('.post-meta').textContent = formatDate(post.date || new Date());
            postElement.querySelector('.post-content').textContent = post.body;

            const commentForm = postElement.querySelector('.comment-form');
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const commentContent = commentForm.querySelector('textarea').value.trim();
                if (commentContent) {
                    createComment(post.id, commentContent);
                    commentForm.reset();
                }
            });

            const commentsList = postElement.querySelector('.comments-list');
            const comments = await fetchComments(post.id);
            comments.forEach(comment => {
                const commentElement = commentTemplate.content.cloneNode(true);
                commentElement.querySelector('.comment-meta').textContent = formatDate(comment.date || new Date());
                commentElement.querySelector('.comment-content').textContent = comment.body;
                commentsList.appendChild(commentElement);
            });

            postsContainer.appendChild(postElement);
        }
    };

    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = postForm.querySelector('input').value.trim();
        const content = postForm.querySelector('textarea').value.trim();
        
        if (title && content) {
            createPost(title, content);
            postForm.reset();
        }
    });

    renderPosts();
}); 