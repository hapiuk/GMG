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

    // Post navigation functionality
    let currentPostIndex = 0;
    const postsData = typeof posts !== 'undefined' ? posts : []; // Check if posts is defined

    function navigatePost(direction) {
        currentPostIndex += direction;

        if (currentPostIndex < 0 || currentPostIndex >= postsData.length) {
            return; // Do nothing if out of bounds
        }

        // Update the post content
        document.getElementById('post-title').textContent = postsData[currentPostIndex].title;
        document.getElementById('post-content').textContent = postsData[currentPostIndex].content;

        // Update media content
        const mediaContainer = document.querySelector('.media-content');
        mediaContainer.innerHTML = ''; // Clear existing media

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

        // Disable or enable buttons based on the current post index
        document.getElementById('prev-post').disabled = currentPostIndex === 0;
        document.getElementById('next-post').disabled = currentPostIndex === postsData.length - 1;
    }

    // Initialize post navigation buttons
    document.getElementById('prev-post').addEventListener('click', () => navigatePost(-1));
    document.getElementById('next-post').addEventListener('click', () => navigatePost(1));

    // Initial button state
    document.getElementById('prev-post').disabled = true;
    if (postsData.length <= 1) {
        document.getElementById('next-post').disabled = true;
    }

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
            return response.json();
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

    // Display flash messages
    function displayFlashMessage(message, category) {
        const alertBox = document.createElement('div');
        alertBox.className = `alert alert-${category} alert-dismissible fade show`;
        alertBox.role = 'alert';
        alertBox.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        document.getElementById('flash-message-container').appendChild(alertBox);

        setTimeout(() => {
            $(alertBox).alert('close');
        }, 5000); // Auto close after 5 seconds
    }

    // Check if there's a flash message in the session
    const flashMessage = "{{ get_flashed_messages(with_categories=true) }}";
    if (flashMessage) {
        const [category, message] = flashMessage.split('|');
        displayFlashMessage(message, category);
    }
});
