import API from './api.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// frontend: python3 -m http.server
// backend: python3 run.py 


// This url may need to change depending on what port your backend is running
// on.
const api = new API('http://localhost:5000');


// Example usage of makeAPIRequest method.

api.makeAPIRequest('dummy/user')
    .then(r => console.log(r));

// Login 
document.getElementById('loginButton').addEventListener('click', () => {
    const password1 = document.getElementById('password').value;
    const password2 = document.getElementById('password_conf').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const registerDetails = document.getElementById('registerDetails');


    if (password1 != password2) {
        document.getElementById('modal').style.display = 'block'
        document.getElementById('modal-text').firstChild.nodeValue = "Passwords do not match!"
    }
    else if (registerDetails.style.display === 'block') {
        register(username, password1, email, name);
    }
    else {
        login(username, password1);
    }
});

// Signup
document.getElementById('registerButton').addEventListener('click', () => {
    document.getElementById('register').style.display = 'none';
    document.getElementById('registerDetails').style.display = 'block';
})

// close pop-up
document.getElementById('close').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none'
    document.getElementById('modal-text').textContent = ''
})

// main functions
function login(username, password) {
    const loginBody = {
        "username": username,
        "password": password
    };
    fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginBody),
    })
    .then(response => {
        const popup = document.getElementById('modal');
        const popupText = document.getElementById('modal-text');

        if (response.status === 403) {
            popup.style.display = 'block'
            popupText.firstChild.nodeValue = "Invalid Username or Password"
        }
        else if (response.status === 400) {
            popup.style.display = 'block'
            popupText.firstChild.nodeValue = "Missing Username or Password"
        }
        else if (response.status === 200) { 
            response.json().then(login => {
                const user_token = login.token;
                document.getElementById('login').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
                document.getElementById('registerDetails').style.display = 'none';
                showFeed(user_token);
            })
        }
    }).catch(error => {
        console.log('Error: ', error);
    });
}

function register(username, password, email, name) {
    const loginBody = {
        "username": username,
        "password": password,
        "email": email,
        "name": name
    };
    fetch('http://localhost:5000/auth/signup', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginBody),
    })
    .then(response => {
        const popup = document.getElementById('modal');
        const popupText = document.getElementById('modal-text');

        if (response.status === 400) {
            popup.style.display = 'block'
            popupText.firstChild.nodeValue = "Missing Username or Password"
        }
        else if (response.status === 409) {
            popup.style.display = 'block'
            popupText.firstChild.nodeValue = "Username has been taken"  
        }
        else if (response.status === 200) { 
            response.json().then(login => {
                const user_token = login.token;
                document.getElementById('login').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
                showFeed(user_token);
            })
        }
    }).catch(error => {
        console.log('Error: ', error);
    });
}

function showFeed(token) {
    fetch('http://localhost:5000/user/feed/?p=0&n=10', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token 
        },
    })
    .then(response => {
        const popup = document.getElementById('modal');
        const popupText = document.getElementById('modal-text');

        if (response.status === 403) {
            popup.style.display = 'block'
            popupText.firstChild.nodeValue = "Invalid Auth Token"
        }
        else if (response.status === 200) { 
            response.json().then(result => {
                const posts = result['posts'];
                posts.forEach(post => {
                    showPosts(post, token)
                })
            })
        }
    }).catch(error => {
        console.log('Error: ', error);
    });
}   

function viewProfile(userToken, profileUsername) {
    const feed = document.getElementById('feed')
    feed.innerText = ''

    // button to return to main profile
    const backButton = document.createElement('button')
    backButton.innerText = "Back to Your Profile"
    backButton.addEventListener('click', () => {
        feed.innerText = ''
        showFeed(userToken)
    })
    feed.appendChild(backButton)

    fetch(`http://localhost:5000/user?username=${profileUsername}`, {   
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + userToken 
        },
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                // show current profiles details
                feed.appendChild(UserDetailsList(data))

                // show current profiles posts
                const posts = data['posts']
                posts.forEach(postID => {
                    fetch(`http://localhost:5000/post?id=${postID}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Token ' + userToken
                        }
                    }).then(response => {
                        if (response.status === 200) {
                            response.json().then(result => {
                                showPosts(result, userToken)
                            })
                        }
                        else {
                            postErrors(response.status)
                        }
                    }).catch(error => {
                        console.log('Error: ', error)
                    })
                })
            }).catch(error => {
                console.log('Error: ', error)
            })
        }
        else {
            userErrors(response.status)
        }
    }).catch(error => {
        console.log('Error: ', error)
    })


    // ability to follow viewed user

    // show viewed profile feed

}

function UserDetailsList(userData) {
    // usernames profile - list head
    const listHead = document.createElement('ul')
    listHead.innerText = `${userData.username}'s Profile Details:`

    // name
    const name = document.createElement('li')
    name.innerText = `Name: ${userData.name}`
    listHead.appendChild(name)

    // id
    const id = document.createElement('li')
    id.innerText = `User ID: ${userData.id}`
    listHead.appendChild(id)

    // email
    const email = document.createElement('li')
    email.innerText = `Email: ${userData.email}`
    listHead.appendChild(email)

    // followers + following count 
    const FollowersAndFollowing = document.createElement('li')
    FollowersAndFollowing.innerText = `Followers: ${userData.followed_num}, Following: ${userData.following.length}`
    listHead.appendChild(FollowersAndFollowing)

    return listHead
}


// helper functions

function LikesOrCommentsList(innerText) {
    const List = document.createElement('ul');
    List.innerText = innerText;
    document.getElementById('modal-text').appendChild(List);
    return List;
}

function postErrors(status) {
    const popup = document.getElementById('modal');
    const popupText = document.getElementById('modal-text');

    if (status === 400) {
        popup.style.display = 'block'
        popupText.innerText = "Malformed Request"
    }
    else if (status === 403) {
        popup.style.display = 'block'
        popupText.innerText = "Invalid Auth Token"
    }
    else if (status === 404) {
        popup.style.display = 'block'
        popupText.innerText = "Post Not Found"
    }
}

function userErrors(status) {
    const popup = document.getElementById('modal');
    const popupText = document.getElementById('modal-text');

    if (status === 400) {
        popup.style.display = 'block'
        popupText.innerText = "Malformed Request"
    }
    else if (status === 403) {
        popup.style.display = 'block'
        popupText.innerText = "Invalid Auth Token"
    }
    else if (status === 404) {
        popup.style.display = 'block'
        popupText.innerText = "User Not Found"
    }
}

function likeOrUnlike (request, id, token) {
    fetch(`http://localhost:5000/post/${request}?id=${id}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token
        }
    }).then(response => {
        if (response.status != 200) {
            postErrors(response.status)
        }
    }).catch(error => {
        console.log('Error: ', error)
    })
}

function showPosts(post, token) {
    const feedPost = document.createElement('div');
    feedPost.className = 'postBox';

    // Post by 'author' at time 'published'
    const authorDiv = document.createElement('div');
    const date = new Date(post.meta.published * 1000).toISOString().substr(0,10) 
    const time = new Date(post.meta.published * 1000).toISOString().substr(11, 8);

    const postBy = document.createElement('span')
    postBy.innerText = 'Post by '
    authorDiv.appendChild(postBy)

    const author = document.createElement('button')
    author.innerText = `${post.meta.author}`
    author.addEventListener('click', () => {
        viewProfile(token, post.meta.author)
    })
    authorDiv.appendChild(author)

    const postDate = document.createElement('span')
    postDate.innerText = ` on ${date} at ${time}`
    authorDiv.appendChild(postDate)

    feedPost.appendChild(authorDiv);

    // image by 'src'
    const image = document.createElement('img');
    image.setAttribute('src', `data:image/jpeg;base64,${post.thumbnail}`);
    feedPost.appendChild(image);

    // content by 'description_text'
    const descriptionDiv = document.createElement('div');
    descriptionDiv.innerText = `${post.meta.description_text}`;
    feedPost.appendChild(descriptionDiv);
    
    // button of 'likes'
    const likesButton = document.createElement('button');
    likesButton.addEventListener('click', () => {   
        // Likes list
        document.getElementById('modal').style.display = 'block'
        const likeList = LikesOrCommentsList("Likes: ");

        // create list of likes
        const likes = post.meta['likes'];
        likes.forEach(userID => {
            fetch(`http://localhost:5000/user?id=${userID}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Token ' + token 
                },
            }).then(response => {
                if (response.status === 200) {
                        response.json().then(data => {
                        const like = document.createElement('li');
                        like.innerText = data.name;
                        likeList.appendChild(like);
                    })
                }
            }).catch(error => {
                console.log('Error: ', error);
            })
        })
    });
    const numLikes = post.meta.likes.length;
    if (numLikes === 1) {
        likesButton.innerText = `${numLikes} Like`;
    } else {
        likesButton.innerText = `${numLikes} Likes`;
    }
    feedPost.appendChild(likesButton);

    // button of 'comments'
    const commentsButton = document.createElement('button');
    commentsButton.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'block'
        // Comment list
        const commentList = LikesOrCommentsList("Comments: ");

        // create list of comments
        const comments = post['comments'];
        comments.forEach(comments => {
            const comment = document.createElement('li');
            comment.innerText = `"${comments.comment}" - ${comments.author}`
            commentList.appendChild(comment);
        })
    });
    const numComments = post.comments.length;
    if (numComments === 1) {
        commentsButton.innerText = `${numComments} Comment`;
    } else {
        commentsButton.innerText = `${numComments} Comments`;
    }
    feedPost.appendChild(commentsButton);

    // create user like button
    const likePostButton = document.createElement('button');
    likePostButton.style.display = "block"
    
    // user like button text + functionality            
    fetch(`http://localhost:5000/user/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token 
        },
    }).then(response => {
        response.json().then(data => {
            const listOflikes = post.meta.likes
            const userID = data.id 
            if (!listOflikes.includes(userID)) {
                likePostButton.innerText = "Like This Post"
            }
            else {
                likePostButton.innerText = "Unlike This Post"
                likePostButton.style.borderWidth = 'medium thick'
            }

            likePostButton.addEventListener('click', () => {
                if (!listOflikes.includes(userID)) {
                    likeOrUnlike('like', post.id, token)
                }
                else {
                    likeOrUnlike('unlike', post.id, token)
                }
            })
        })
    }).catch(error => {
        console.log('Error: ', error);
    })


    feedPost.appendChild(likePostButton);

    // add to feed       
    const feed = document.getElementById('feed');
    feed.appendChild(feedPost);
}