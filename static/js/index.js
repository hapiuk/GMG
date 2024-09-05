document.addEventListener('DOMContentLoaded', () => {
    // Initialize galleries by collecting images from the page
    const galleries = {};

    function initializeGalleries() {
        const gallerySections = document.querySelectorAll('.game-gallery-side');
        gallerySections.forEach((section, index) => {
            const sectionId = index + 2;  // Assuming sections start from ID 2
            const images = Array.from(section.querySelectorAll('.gallery-image')).map(img => img.src);
            galleries[`section-${sectionId}`] = { images: images, currentImageIndex: 0 };
        });
        console.log('Initialized galleries:', galleries);
    }

    // Function to display the full-size image
    function showFullImage(imageUrl, containerId, sectionId) {
        const galleryKey = `section-${sectionId}`;
        const gallery = galleries[galleryKey];

        if (!gallery) {
            console.error(`No gallery data available for section ${sectionId}.`);
            return;
        }

        const imageIndex = gallery.images.indexOf(imageUrl);
        if (imageIndex === -1) {
            console.error(`Image URL ${imageUrl} not found in gallery for section ${sectionId}. Available images:`, gallery.images);
            return;
        }

        gallery.currentImageIndex = imageIndex;

        const fullImage = document.getElementById(containerId).querySelector('img');
        fullImage.src = imageUrl;
        document.getElementById(containerId).style.display = 'flex';

        // Disable body scroll when gallery is open
        document.body.style.overflow = 'hidden';
    }

    // Function to navigate between images
    function navigateImage(direction, containerId, sectionId) {
        const galleryKey = `section-${sectionId}`;
        const gallery = galleries[galleryKey];

        if (!gallery || gallery.images.length === 0) {
            console.error(`No gallery data available for navigation in section ${sectionId}.`);
            return;
        }

        gallery.currentImageIndex += direction;

        if (gallery.currentImageIndex < 0) {
            gallery.currentImageIndex = gallery.images.length - 1;
        } else if (gallery.currentImageIndex >= gallery.images.length) {
            gallery.currentImageIndex = 0;
        }

        const fullImage = document.getElementById(containerId).querySelector('img');
        fullImage.src = gallery.images[gallery.currentImageIndex];
    }

    // Function to close the full-size image display
    function closeFullImage(containerId) {
        const galleryContainer = document.getElementById(containerId);
        galleryContainer.style.display = 'none';

        // Re-enable body scroll when gallery is closed
        document.body.style.overflow = '';
    }

    // Mute/Unmute toggle function
    function toggleMute(videoId) {
        const video = document.getElementById(videoId);

        if (!video) {
            return;
        }

        const button = document.querySelector('.sound-toggle-btn');

        if (video.muted) {
            video.muted = false;
            button.textContent = '🔊'; // Sound on icon
        } else {
            video.muted = true;
            button.textContent = '🔇'; // Sound off icon
        }
    }

    // Attach event listeners for the mute button
    const soundToggleButton = document.querySelector('.sound-toggle-btn');

    if (soundToggleButton) {
        soundToggleButton.addEventListener('clicked', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent scrolling
            toggleMute('trailer-video');
        });

        soundToggleButton.addEventListener('touchend', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent scrolling
            toggleMute('trailer-video');
        });
    }

    // Prevent default scroll on touch for gallery navigation and close buttons
    function preventScrollOnTouch(element) {
        element.addEventListener('touchstart', (event) => {
            event.stopPropagation();
            element.classList.add('no-scroll');
        });

        element.addEventListener('touchend', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent scrolling
            setTimeout(() => {
                element.classList.remove('no-scroll');
            }, 100);
        });
    }

    // Apply no-scroll behavior to gallery navigation and close buttons
    document.querySelectorAll('.nav-arrow, .close-button').forEach(preventScrollOnTouch);

    // Initialize galleries on page load
    initializeGalleries();

    // Attach click event to each gallery image
    document.querySelectorAll('.gallery-image').forEach((img) => {
        img.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent scrolling
            const sectionId = img.closest('.game-gallery-side').getAttribute('id').split('-').pop();
            showFullImage(img.src, `full-image-container-${sectionId}`, sectionId);
        });
    });

    // Expose functions to global scope for use in HTML attributes
    window.showFullImage = showFullImage;
    window.navigateImage = navigateImage;
    window.closeFullImage = closeFullImage;
    window.toggleMute = toggleMute;

    let currentSection = 0;
    const sections = document.querySelectorAll('.section');
    const navbar = document.getElementById('navbar');
    const welcomeSection = document.getElementById('welcome-section');
    const consentModal = document.getElementById('consentModal');

    // Show consent modal on page load if not previously accepted
    if (!localStorage.getItem('trackingAccepted')) {
        consentModal.style.display = 'block';
    }

    // Handle tracking consent
    document.getElementById('acceptTracking').addEventListener('click', function () {
        localStorage.setItem('trackingAccepted', 'true');
        consentModal.style.display = 'none';
        trackWishlistClicks(true);  // Consent given
    });

    document.getElementById('declineTracking').addEventListener('click', function () {
        consentModal.style.display = 'none';
        localStorage.setItem('trackingAccepted', 'false');
        trackWishlistClicks(false);  // Consent not given
    });

    function trackWishlistClicks(consent) {
        const wishlistButtons = document.querySelectorAll('.steam-wishlist-button');

        wishlistButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();

                const targetUrl = button.href;

                if (consent) {
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
            if (!navbar.classList.contains('show-navbar')) {
                navbar.classList.add('show-navbar');
                navbar.style.animation = 'slideIn 0.5s forwards'; // Slide in animation
            }
        } else {
            if (navbar.classList.contains('show-navbar')) {
                navbar.classList.remove('show-navbar');
                navbar.style.animation = 'slideOut 0.5s forwards'; // Slide out animation
            }
        }
    };
    
    document.addEventListener('scroll', toggleNavbar);

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
                console.error('Error:', error);  // Log the error
                console.error('Response:', xhr.responseText);  // Log the response text
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
