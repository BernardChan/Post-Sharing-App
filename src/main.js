import API from './api.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// frontend: python3 -m http.server
// backend: python3 run.py 

// This url may need to change depending on what port your backend is running
// on.
const api = new API('http://localhost:5000');
// global variable for feed position
var currPost, postsLoaded

// Example usage of makeAPIRequest method.

api.makeAPIRequest('dummy/user')
    .then(r => console.log(r));

// Login Button
document.getElementById('loginButton').addEventListener('click', () => {
    // user details 
    const password1 = document.getElementById('password').value;
    const password2 = document.getElementById('password_conf').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const registerDetails = document.getElementById('registerDetails');

    if (password1 != password2) {
        document.getElementById('modal').style.display = 'block'
        document.getElementById('modal-text').innerText = "Passwords do not match!"
    }
    else if (registerDetails.style.display === 'block') {
        register(username, password1, email, name);
    }
    else {
        login(username, password1);
    }
});

// Signup Button
document.getElementById('registerButton').addEventListener('click', () => {
    document.getElementById('register').style.display = 'none';
    document.getElementById('registerDetails').style.display = 'block';
})

// close pop-up
document.getElementById('close').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none'
    document.getElementById('modal-text').textContent = ''
})
//////////////////////////////
/////// main functions ///////
//////////////////////////////

/////// LOGIN ///////
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
            popupText.innerText = "Invalid Username or Password"
        }
        else if (response.status === 400) {
            popup.style.display = 'block'
            popupText.innerText = "Missing Username or Password"
        }
        else if (response.status === 200) { 
            response.json().then(login => {
                // user's login details
                const user_token = login.token;
                document.getElementById('login').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
                document.getElementById('registerDetails').style.display = 'none';
                document.getElementById('currentUser').innerText = username;
                showFeed(user_token);
            })
        }
    }).catch(error => {
        console.log('Error: ', error);
    });
}

/////// REGISTER ///////
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
        // pop up for errors
        const popup = document.getElementById('modal');
        const popupText = document.getElementById('modal-text');

        if (response.status === 400) {
            popup.style.display = 'block'
            popupText.innerText = "Missing Username or Password"
        }
        else if (response.status === 409) {
            popup.style.display = 'block'
            popupText.innerText = "Username has been taken"  
        }
        else if (response.status === 200) { 
            response.json().then(login => {
                // user details
                const user_token = login.token;
                document.getElementById('login').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
                document.getElementById('currentUser').innerText = username;
                showFeed(user_token);
            })
        }
    }).catch(error => {
        console.log('Error: ', error);
    });
}

/////// SHOW YOUR FEED ///////
function showFeed(token) {
    // feed wipe
    const feed = document.getElementById('feed')
    feed.innerText = ''

    // create post button
    feed.appendChild(createPost(token))

    // view your profile
    const viewOwnProfile = document.createElement('button')
    viewOwnProfile.style.display = 'block'
    viewOwnProfile.innerText = "View your Profile"
    feed.appendChild(viewOwnProfile)
    viewOwnProfile.addEventListener('click', () => {
        viewProfile(token, document.getElementById('currentUser').innerText)
    })

    // update user details
    const updateButton = document.createElement('button')
    updateButton.innerText = "Update Profile"
    updateButton.style.display = 'block'
    feed.appendChild(updateButton)
    updateButton.addEventListener('click', () => {
        // show the user details to update
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('login').style.display = 'block';
        document.getElementById('registerDetails').style.display = 'block';
        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('register').style.display = 'none';

        // update button
        const updateProfile = document.createElement('button')
        updateProfile.innerText = "Update Details"
        updateProfile.style.display = 'block'
        document.getElementById('login').appendChild(updateProfile)
        updateProfile.addEventListener('click', () => {
            // details to update
            const email = document.getElementById('email').value
            const name = document.getElementById('name').value
            const password = document.getElementById('password').value
            const password_conf = document.getElementById('password_conf').value

            // error pop up
            const popup = document.getElementById('modal');
            const popupText = document.getElementById('modal-text');

            // check if passwords match
            if (password != password_conf) {
                popup.style.display = 'block'
                popupText.innerText = "Passwords do not match"
            }
            // test if at least 1 char of non-whitespace
            else if (!password.trim()) {
                popup.style.display = 'block'
                popupText.innerText = "Password can not be empty"
            }
            else {
                // updates user details
                const updateBody = {
                    "email": email,
                    "name": name,
                    "password": password
                }
                fetch(`http://localhost:5000/user/`, {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Token ' + token 
                    },
                    body: JSON.stringify(updateBody),
                })
                .then (response => {
                    if (response.status === 200) {
                        popup.style.display = 'block'
                        popupText.innerText = "Successfully updated profile!"
                    }
                    else if (response.status === 400) {
                        popup.style.display = 'block'
                        popupText.innerText = "Malformed user object"
                    }
                    else if (response.status === 403) {
                        popup.style.display = 'block'
                        popupText.innerText = "Invalid Authorization Token"
                    }
                })
                .catch(error => {
                    console.log('Error: ', error)
                })
            }
        })

        // return to your feed button
        const backButton = document.createElement('button')
        backButton.innerText = "Back to Your Feed"
        document.getElementById('login').appendChild(backButton)
        backButton.addEventListener('click', () => {
            // changes what is visible in DOM to show feed
            document.getElementById('loginPage').style.display = 'block';
            document.getElementById('login').style.display = 'none';
            document.getElementById('registerDetails').style.display = 'none';
            document.getElementById('loginButton').style.display = 'block';
            document.getElementById('register').style.display = 'block';
            // remove additional buttons
            updateProfile.remove()
            backButton.remove()
        })
    })

    // get user details
    fetch('http://localhost:5000/user/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token 
        },
    })
    .then (response => {
        if (response.status === 200) {
            response.json().then(data => {
                // search a profile button
                document.getElementById('userSearchButton').addEventListener('click', () => {
                    const username = document.getElementById('userSearch')
                    if (username.value != '') viewProfile(token, username.value)
                    username.value = ''
                })
                // update inputs in registerDetails div for update profile purposes
                document.getElementById('email').value = data.email
                document.getElementById('name').value = data.name
            })
        }
        else {
            userErrors(response.status)
        }
    })
    .catch(error => {
        console.log('Error: ', error)
    })
    
    // infinite scroll implementation

    // global variable assignment for how many posts to load
    currPost = 0, postsLoaded = 5
    // initial load
    printFeed(token, currPost, postsLoaded)

    const addScroll = () => {
        const {scrollTop, scrollHeight, clientHeight} = document.documentElement;
        // when scroll reaches bottom of page, load new posts
        if (scrollTop + clientHeight >= scrollHeight - 1) {
            currPost = currPost + postsLoaded
            printFeed(token, currPost, postsLoaded)
        }
    }
    window.addEventListener('scroll', addScroll)
}   

/////// PRINT POSTS TO FEED ///////
function printFeed (token, currPost, postsLoaded) {
    fetch(`http://localhost:5000/user/feed?p=${currPost}&n=${postsLoaded}`, {
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
            popupText.innerText = "Invalid Auth Token"
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

/////// VIEW ANOTHER PROFILE ///////
function viewProfile(userToken, profileUsername) {
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
                // reset feed
                const feed = document.getElementById('feed')
                feed.innerText = ''

                // button to return to main profile
                const backButton = document.createElement('button')
                backButton.innerText = "Back to Your Feed"
                backButton.addEventListener('click', () => {
                    feed.innerText = ''
                    showFeed(userToken)
                })
                feed.appendChild(backButton)

                // show current profiles details
                feed.appendChild(UserDetailsList(data))

                // follower button
                const followListButton = document.createElement('button')
                followListButton.innerText = "Show Following"
                followListButton.style.display = 'block'
                
                followListButton.addEventListener ('click', () => {
                    // following list
                    document.getElementById('modal').style.display = 'block'
                    const followingList = displayListHead ("Following: ");            
                    
                    // get the array
                    const followingIDs = data.following 
                    followingIDs.forEach(userID => {
                        fetch(`http://localhost:5000/user?id=${userID}`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': 'Token ' + userToken 
                            },
                        })
                        .then(response => {
                            if (response.status === 200) {
                                response.json().then(data => {
                                    const following = document.createElement('li')
                                    following.innerText = data.name
                                    followingList.appendChild(following)
                                })
                            }
                        })
                        .catch(error => {
                            console.log('Error: ', error);
                        })
                    })
                })
                feed.appendChild(followListButton)

                // follow the user button
                const currentUser = document.getElementById('currentUser').innerText
                // if you are not viewing your own profile
                if (currentUser != profileUsername) {
                    const followButton = document.createElement('button')     
                    const profileID = data.id

                    // find out if user is following or not
                    fetch(`http://localhost:5000/user/`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Token ' + userToken 
                        },
                    })
                    .then(response => {
                        if (response.status === 200) {
                            response.json().then(data => {
                                const user_follows = data.following
                                // logged in user follows profile page
                                if (user_follows.includes(profileID)) {
                                    followButton.innerText = 'Unfollow'
                                    followButton.addEventListener('click', () => {
                                        FollowOrUnfollow(userToken,'unfollow', profileUsername)
                                    })
                                }
                                // logged in user doesn't follow profile page
                                else {
                                    followButton.innerText = 'Follow'
                                    followButton.addEventListener('click', () => {
                                        FollowOrUnfollow(userToken,'follow', profileUsername)
                                    })
                                }
                            })
                        }
                    })
                    .catch(error => {
                        console.log('Error: ', error);
                    })
                    feed.appendChild(followButton)
                }

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
    // set currPost to largest possible int to prevent eventListener showing feed
    currPost = 9007199254740991
}

// show posts used for feed and profile posts
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

    // allow for update and delete if on current users profile
    const currentUser = document.getElementById('currentUser')
    if (currentUser.innerText === post.meta.author) {
        // edit post
        const edit = document.createElement('button')
        edit.innerText = "Edit Post"
        
        edit.addEventListener('click',() => {
            // popup to edit post
            document.getElementById('modal').style.display = 'block'
            const postPopUp = document.getElementById('modal-text')
    
            const writePost = document.createElement('div')
            writePost.innerText = "Edit Post: "
            postPopUp.appendChild(writePost)
    
            const postBox = document.createElement('textarea')
            postBox.style.width = '90%'
            postBox.style.height = '100px'
            postBox.value = post.meta.description_text
            postPopUp.appendChild(postBox)

            const postButton = document.createElement('button')
            postButton.innerText = 'Save'
            postPopUp.appendChild(postButton)

            const message = document.createElement('div')
            postPopUp.appendChild(message)

            postButton.addEventListener('click', () => {
                // new post text
                const postBody = {
                    "description_text": `${postBox.value}`,
                    "src": ""
                }
                fetch(`http://localhost:5000/post?id=${post.id}`, {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Token ' + token 
                    },
                    body: JSON.stringify(postBody),
                })
                .then(response => {
                    if (response.status === 200) {
                        message.innerText = "Post edited successfully!"
                    }
                    else if (response.status === 400) {
                        message.innerText = "Malformed Request"
                    }
                    else if (response.status === 403) {
                        message.innerText = "Invalid Auth Token"
                    }
                    else if (response.status === 404) {
                        message.innerText = "Page Not Found"
                    }
                })
                .catch(error => {
                    console.log('Error: ', error);
                })
            })            
        })
        feedPost.appendChild(edit)

        // delete post 
        const del = document.createElement('button')
        del.innerText = "Delete Post"
        feedPost.appendChild(del)  
        del.addEventListener('click', () => {
            fetch(`http://localhost:5000/post?id=${post.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Token ' + token 
                }
            })
            .then(response => {
                if (response.status === 200) {
                    const popup = document.getElementById('modal');
                    const popupText = document.getElementById('modal-text');
                    popup.style.display = 'block'
                    popupText.innerText = "Successfully Deleted!"
                }
                else postErrors(response.status)
            })
            .catch(error => {
                console.log('Error: ', error)
            })
        })
    }

    // image by 'src'
    const image = document.createElement('img');
    image.style.display = 'block'
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
        document.getElementById('modal-text').style.display = 'block'
        const likeList = displayListHead ("Likes: ");

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
                        const like = document.createElement('button')
                        like.style.display = 'block'
                        like.innerText = `${data.username}`
                        like.addEventListener('click', () => {
                            viewProfile(token, data.username)
                            document.getElementById('modal').style.display = 'none'
                        })
                        likeList.appendChild(like)
                    })
                }
            }).catch(error => {
                console.log('Error: ', error);
            })
        })
    });

    // condition for like button
    const numLikes = post.meta.likes.length;
    if (numLikes === 1) {
        likesButton.innerText = `${numLikes} Like`;
    } else {
        likesButton.innerText = `${numLikes} Likes`;
    }
    feedPost.appendChild(likesButton);

    // button of 'comments'
    const commentsButton = document.createElement('button');
    var clicked = false
    commentsButton.addEventListener('click', () => {
        //document.getElementById('modal').style.display = 'block'
        // Comment list
        const commentList = displayListHead ("Comments: ");

        // create list of comments
        const comments = post['comments'];
        comments.forEach(comments => {
            const fullComment = document.createElement('div')
            const commentText = document.createElement('span')
            commentText.innerText = `"${comments.comment}" by `
            fullComment.appendChild(commentText)

            const comment = document.createElement('button')
            comment.innerText = comments.author
            comment.addEventListener('click', () => {
                viewProfile(token, comments.author)
                document.getElementById('modal').style.display = 'none'
            })
            fullComment.appendChild(comment)
            if (clicked === false) {
                feedPost.appendChild(fullComment)
            }
        })
        clicked = true
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
            // whether or not the current user is is in the list of likes
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

    // write a comment
    const commentBox = document.createElement('textarea')
    feedPost.appendChild(commentBox)

    const writeCommentButton = document.createElement('button')
    writeCommentButton.innerText = "Comment"
    writeCommentButton.style.display = 'block'
    feedPost.appendChild(writeCommentButton)
    writeCommentButton.addEventListener('click', () => {
        const commentBody = {
            "comment": commentBox.value
        }
        fetch(`http://localhost:5000/post/comment?id=${post.id}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify(commentBody),
        })
        .then(response => {
            if (response.status === 200) {
                commentBox.value = ""
                const success = document.createElement('div')
                success.innerText = "Commented Successfully!"
                feedPost.appendChild(success)
            }
            else {
                postErrors(response.status)
            }
        })
        .catch(error => {
            console.log('Error: ', error);
        })
        pageReset()
    })
    
    // add to feed       
    const feed = document.getElementById('feed');
    feed.appendChild(feedPost);
}

function createPost (token) {
    const postButton = document.createElement('button')
    postButton.innerText = "Create Post"
    postButton.addEventListener('click', () => {
        // html of modal to post
        document.getElementById('modal').style.display = 'block'
        const postPopUp = document.getElementById('modal-text')

        const writePost = document.createElement('div')
        writePost.innerText = "Write Post: "
        postPopUp.appendChild(writePost)

        const postBox = document.createElement('textarea')
        postBox.style.width = '90%'
        postBox.style.height = '100px'
        postPopUp.appendChild(postBox)

        const image = document.createElement('span')
        image.innerText = "Image Link: "
        postPopUp.append(image)

        const imageSource = document.createElement('input')
        imageSource.type = 'file'
        imageSource.accept = 'image/*'
        postPopUp.append(imageSource)

        const createPostButton = document.createElement('button')
        createPostButton.style.display = 'block'
        createPostButton.innerText = "Post"
        postPopUp.appendChild(createPostButton)

        const message = document.createElement('div')
        postPopUp.appendChild(message)

        // allow user to post
        createPostButton.addEventListener('click', () => {
            const postText = postBox.value
            const file = document.querySelector('input[type="file"]').files[0];
            const data = Promise.resolve(fileToDataUrl(file))
            data.then(value => {
                // replace metadata
                let imageLink = ''
                if (value.includes("image/jpeg")) 
                    imageLink = value.replace("data:image/jpeg;base64,", "")
                else if (value.includes("image/png"))
                    imageLink = value.replace("data:image/png;base64,", "")
                else if (value.includes("image/jpg"))
                    imageLink = value.replace("data:image/jpg;base64,", "")

                const postBody = {
                    "description_text": postText,
                    "src": imageLink
                };
                fetch('http://localhost:5000/post/', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Token ' + token 
                    },
                    body: JSON.stringify(postBody),
                })
                .then (response => {
                    if (response.status === 200) {
                        message.innerText = "Post created successfully!"
                    }
                    else if (response.status === 400) {
                        message.innerText = "Malformed Request: Image could not be processed"
                    }
                    else if (response.status === 403) {
                        message.innerText = "Invalid Auth Token"
                    }
                })
                .catch(error => {
                    console.log('Error: ', error);
                })
            })

        })
    })
    return postButton
}

////////////////////////////////
/////// helper functions ///////
////////////////////////////////

// depending on if user is following or not, will follow or unfollow
function FollowOrUnfollow (token, request, username) {
    fetch(`http://localhost:5000/user/${request}?username=${username}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token 
        },
    })
    .then(response => {
        if (status != 200) userErrors(response.status)
    })
    .catch(error => {
        console.log('Error: ', error);
    })
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

// list popup on modal
function displayListHead (innerText) {
    const List = document.createElement('ul');
    List.innerText = innerText;
    document.getElementById('modal-text').innerText = ""
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

