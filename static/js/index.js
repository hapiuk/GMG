document.addEventListener('DOMContentLoaded', () => {
    let currentSection = 0;
    const sections = document.querySelectorAll('.section');
    const navbar = document.getElementById('navbar');
    const welcomeSection = document.getElementById('welcome-section');
    const consentModal = document.getElementById('consentModal');
    const trailerVideo = document.getElementById('trailer-video');

    // Show consent modal on page load if not previously accepted
    if (!localStorage.getItem('trackingAccepted')) {
        consentModal.style.display = 'block';
    }

    // Handle tracking consent
    document.getElementById('acceptTracking').addEventListener('click', function () {
        localStorage.setItem('trackingAccepted', 'true');
        consentModal.style.display = 'none';

        // Attach tracking to wishlist buttons
        trackWishlistClicks(true);  // Consent given
    });

    document.getElementById('declineTracking').addEventListener('click', function () {
        consentModal.style.display = 'none';
        localStorage.setItem('trackingAccepted', 'false');

        // Attach tracking to wishlist buttons without location
        trackWishlistClicks(false);  // Consent not given
    });

    function trackWishlistClicks(consent) {
        const wishlistButtons = document.querySelectorAll('.steam-wishlist-button');

        wishlistButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();

                const targetUrl = button.href;

                if (consent) {
                    // Fetch the user's IP address if consent is given
                    $.getJSON('https://api.ipify.org?format=json', function(data) {
                        const ipAddress = data.ip;

                        // Send the IP address to the server as JSON
                        $.ajax({
                            url: '/track-wishlist-click',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ ip: ipAddress, consent: true }),
                            success: function() {
                                console.log('Wishlist click tracked successfully with location');
                                window.open(targetUrl, '_blank');  // Open the Steam page in a new tab
                            },
                            error: function(xhr, status, error) {
                                console.error('Error:', xhr.responseText);  // Log server error message
                                window.open(targetUrl, '_blank');  // Open the Steam page in a new tab even if tracking fails
                            }
                        });
                    });
                } else {
                    // Send click tracking without IP if consent is not given
                    $.ajax({
                        url: '/track-wishlist-click',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ consent: false }),  // No IP address
                        success: function() {
                            console.log('Wishlist click tracked successfully without location');
                            window.open(targetUrl, '_blank');  // Open the Steam page in a new tab
                        },
                        error: function(xhr, status, error) {
                            console.error('Error:', xhr.responseText);  // Log server error message
                            window.open(targetUrl, '_blank');  // Open the Steam page in a new tab even if tracking fails
                        }
                    });
                }
            });
        });
    }

    // Attach tracking if consent was already given
    if (localStorage.getItem('trackingAccepted') === 'true') {
        trackWishlistClicks(true);  // Consent given
    } else if (localStorage.getItem('trackingAccepted') === 'false') {
        trackWishlistClicks(false);  // Consent not given
    }

    const scrollToSection = (sectionIndex) => {
        const targetScroll = sections[sectionIndex].offsetTop;
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    };

    const toggleNavbar = () => {
        const welcomeBottom = welcomeSection.getBoundingClientRect().bottom;
        if (welcomeBottom <= 0) {
            navbar.classList.add('show-navbar');
        } else {
            navbar.classList.remove('show-navbar');
        }
    };

    const handleWheelEvent = (event) => {
        event.preventDefault();
        const delta = event.deltaY;
        if (delta > 0 && currentSection < sections.length - 1) {
            currentSection++;
        } else if (delta < 0 && currentSection > 0) {
            currentSection--;
        }
        scrollToSection(currentSection);
    };

    document.addEventListener('wheel', handleWheelEvent, { passive: false });
    document.addEventListener('scroll', toggleNavbar);

    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (event) => {
        touchStartY = event.touches[0].clientY;
    };

    const handleTouchMove = (event) => {
        touchEndY = event.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        if (touchStartY - touchEndY > 50 && currentSection < sections.length - 1) {
            currentSection++;
            scrollToSection(currentSection);
        } else if (touchEndY - touchStartY > 50 && currentSection > 0) {
            currentSection--;
            scrollToSection(currentSection);
        }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    const soundToggleButton = document.querySelector('.sound-toggle-btn');

    if (soundToggleButton) {
        soundToggleButton.addEventListener('touchstart', (event) => {
            event.stopPropagation();
            soundToggleButton.classList.add('no-scroll');
        });

        soundToggleButton.addEventListener('touchend', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent scrolling
            toggleMute('trailer-video');
            setTimeout(() => {
                soundToggleButton.classList.remove('no-scroll');
            }, 100);
        });
    }

    function toggleMute(videoId) {
        const video = document.getElementById(videoId);

        if (!video) {
            return;
        }

        const button = document.querySelector('.sound-toggle-btn');

        if (video.muted) {
            video.muted = false;
            button.textContent = '🔊';
        } else {
            video.muted = true;
            button.textContent = '🔇';
        }
    }

    // Handle the form buttons as before
    const formButtons = document.querySelectorAll('#contact-form button, .post-navigation .nav-btn');

    formButtons.forEach(button => {
        button.addEventListener('touchstart', (event) => {
            event.stopPropagation();
            button.classList.add('no-scroll');
        });

        button.addEventListener('touchend', (event) => {
            event.stopPropagation();
            setTimeout(() => {
                button.classList.remove('no-scroll');
            }, 100);
        });
    });

    let currentPostIndex = 0;
    const postsData = typeof posts !== 'undefined' ? posts : [];

    function navigatePost(direction) {
        currentPostIndex += direction;

        if (currentPostIndex < 0) {
            currentPostIndex = 0;
        } else if (currentPostIndex >= postsData.length) {
            currentPostIndex = postsData.length - 1;
        }

        document.getElementById('post-title').textContent = postsData[currentPostIndex].title;
        document.getElementById('post-content').textContent = postsData[currentPostIndex].content;

        const mediaContainer = document.querySelector('.media-content');
        mediaContainer.innerHTML = '';

        postsData[currentPostIndex].media.forEach(media => {
            if (media.media_type === 'image') {
                const img = document.createElement('img');
                img.src = `/uploads/${media.media_url.split('/').pop()}`;
                img.className = 'post-image img-thumbnail';
                img.alt = 'Post Image';
                mediaContainer.appendChild(img);
            } else if (media.media_type === 'video') {
                const video = document.createElement('video');
                video.controls = true;
                const source = document.createElement('source');
                source.src = `/uploads/${media.media_url.split('/').pop()}`;
                source.type = 'video/mp4';
                video.appendChild(source);
                video.className = 'post-video';
                mediaContainer.appendChild(video);
            }
        });

        document.getElementById('prev-post').disabled = currentPostIndex === 0;
        document.getElementById('next-post').disabled = currentPostIndex === postsData.length - 1;
    }

    document.getElementById('prev-post').addEventListener('click', () => {
        navigatePost(-1);
    });
    document.getElementById('next-post').addEventListener('click', () => {
        navigatePost(1);
    });

    document.getElementById('prev-post').disabled = true;
    document.getElementById('next-post').disabled = postsData.length <= 1;

    // AJAX form submission for the contact form
    $('#contact-form').on('submit', function (event) {
        event.preventDefault();
        
        $.ajax({
            url: '/contact',
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                console.log(response); // Log the response to see what is returned
                if (response.success) {
                    $('#flash-messages').html('<div class="alert alert-success">' + response.message + '</div>');
                    $('#contact-form')[0].reset();
                } else {
                    $('#flash-messages').html('<div class="alert alert-danger">An error occurred: ' + response.message + '</div>');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error); // Log the error
                console.error('Response:', xhr.responseText); // Log the response text
                $('#flash-messages').html('<div class="alert alert-danger">There was an error processing your request. Refresh the page and please try again.</div>');
            }
        });
    });

    const hamburger = document.querySelector('.hamburger-menu');
    const navRight = document.querySelector('.nav-right');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navRight.classList.toggle('show');
        });
    }
});
