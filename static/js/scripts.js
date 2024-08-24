document.addEventListener('DOMContentLoaded', () => {
    let currentSection = 0;
    const sections = document.querySelectorAll('.section');
    const navbar = document.getElementById('navbar');
    const welcomeSection = document.getElementById('welcome-section');

    // Scroll to a specific section
    const scrollToSection = (sectionIndex) => {
        const targetScroll = sections[sectionIndex].offsetTop;
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    };

    // Toggle navbar visibility based on scroll position
    const toggleNavbar = () => {
        const welcomeBottom = welcomeSection.getBoundingClientRect().bottom;
        if (welcomeBottom <= 0) {
            navbar.classList.add('show-navbar');
        } else {
            navbar.classList.remove('show-navbar');
        }
    };

    // Handle wheel events for smooth scrolling between sections
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

    // Touch event handlers for mobile devices
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

    // Sound toggle function
    function toggleMute(videoId) {
        const video = document.getElementById(videoId);

        if (!video) {
            console.error(`No video element found with ID: ${videoId}`);
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

    // Ensure the sound toggle button works
    document.querySelector('.sound-toggle-btn').addEventListener('click', function () {
        toggleMute('trailer-video');
    });

    // Form submission handling with AJAX
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const csrfToken = document.querySelector('input[name="csrf_token"]').value;

        console.log("Form submitted with the following data:");
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        fetch(contactForm.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            console.log("Received response:");
            console.log(response);
            return response.json(); // Expecting a JSON response
        })
        .then(data => {
            console.log("Parsed JSON data:");
            console.log(data);
            if (data.success) {
                displayFlashMessage(data.message, 'success');
            } else {
                displayFlashMessage(data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error during form submission:', error);
            displayFlashMessage('An error occurred. Please try again.', 'danger');
        });
    });


    // Post navigation functionality
    let currentPostIndex = 0;
    const postsData = typeof posts !== 'undefined' ? posts : []; // Ensure posts are available

    console.log('Initial postsData:', postsData); // Log the initial posts data
    console.log('Initial currentPostIndex:', currentPostIndex); // Log the initial post index

    function navigatePost(direction) {
        console.log('navigatePost called with direction:', direction); // Log when navigatePost is called

        currentPostIndex += direction;
        console.log('Updated currentPostIndex:', currentPostIndex); // Log the updated post index

        // Check bounds and update post index
        if (currentPostIndex < 0) {
            console.log('currentPostIndex is less than 0, resetting to 0');
            currentPostIndex = 0;
        } else if (currentPostIndex >= postsData.length) {
            console.log('currentPostIndex is greater than or equal to postsData.length, resetting to last post');
            currentPostIndex = postsData.length - 1;
        }

        // Log the post data being used
        console.log('Displaying post:', postsData[currentPostIndex]);

        // Update the post content
        document.getElementById('post-title').textContent = postsData[currentPostIndex].title;
        document.getElementById('post-content').textContent = postsData[currentPostIndex].content;

        // Update media content
        const mediaContainer = document.querySelector('.media-content');
        mediaContainer.innerHTML = ''; // Clear existing media

        postsData[currentPostIndex].media.forEach(media => {
            console.log('Adding media:', media); // Log each media being added
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

        // Disable or enable buttons based on the current post index
        document.getElementById('prev-post').disabled = currentPostIndex === 0;
        document.getElementById('next-post').disabled = currentPostIndex === postsData.length - 1;

        console.log('prev-post disabled:', document.getElementById('prev-post').disabled);
        console.log('next-post disabled:', document.getElementById('next-post').disabled);
    }

    // Initialize post navigation buttons
    document.getElementById('prev-post').addEventListener('click', () => {
        console.log('Prev button clicked');
        navigatePost(-1);
    });
    document.getElementById('next-post').addEventListener('click', () => {
        console.log('Next button clicked');
        navigatePost(1);
    });

    // Initial button state setup
    document.getElementById('prev-post').disabled = true;
    document.getElementById('next-post').disabled = postsData.length <= 1;

    console.log('Initial prev-post disabled:', document.getElementById('prev-post').disabled);
    console.log('Initial next-post disabled:', document.getElementById('next-post').disabled);


    // Initial flash message state setup
    function displayFlashMessage(message, category) {
        const flashContainer = document.getElementById('flash-messages');
        
        if (!flashContainer) {
            console.error('Flash messages container not found.');
            return;
        }
    
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${category}`;
        alertDiv.role = 'alert';
        alertDiv.textContent = message;
        flashContainer.appendChild(alertDiv);
        
        console.log('Flash message added:', message, category);
    }    
    
});
