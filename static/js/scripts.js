document.addEventListener('DOMContentLoaded', () => {
    let currentSection = 0;
    const sections = document.querySelectorAll('.section');
    const navbar = document.getElementById('navbar');
    const welcomeSection = document.getElementById('welcome-section');
    const signupForm = document.getElementById('signup-form');
    const signupMessage = document.getElementById('signup-message');

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

    const scrollToAboutButton = document.getElementById('scroll-to-about');
    if (scrollToAboutButton) {
        scrollToAboutButton.addEventListener('click', () => {
            currentSection = 1;
            scrollToSection(currentSection);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            signupMessage.textContent = `Thank you for signing up, ${email}!`;
            signupForm.reset();
        });
    }

    let currentImageIndex = 0;
    const gamesSection = document.getElementById('games-section');
    const gameTitleImage = document.getElementById('game-title-image');
    const gameDescription = document.getElementById('game-description').querySelector('p');
    const gameLink = document.getElementById('steam-link');

    const updateGallery = () => {
        const currentGame = galleryImages[currentImageIndex];
        console.log(`Updating gallery to image index ${currentImageIndex}:`, currentGame);

        // Fade out elements before updating
        gameTitleImage.style.opacity = 0;
        gameDescription.style.opacity = 0;

        setTimeout(() => {
            // Directly set the background image for the games section
            gamesSection.style.backgroundImage = `url(${currentGame.image})`;
            console.log(`Background image src: ${currentGame.image}`);

            // Update game title image directly
            gameTitleImage.src = currentGame.titleImage;
            console.log(`Title image src: ${gameTitleImage.src}`);

            // Update description and link
            gameDescription.textContent = currentGame.description;
            gameLink.href = currentGame.link;

            // Fade in elements after updating
            setTimeout(() => {
                gameTitleImage.style.opacity = 1;
                gameDescription.style.opacity = 1;
            }, 100); // Small delay to ensure the fade-in happens
        }, 1000); // Match the timeout duration with CSS transition duration
    };

    // Set the initial background image and description
    updateGallery();

    // Auto-change gallery image every 5 seconds
    setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        console.log(`Auto-change. New image index: ${currentImageIndex}`);
        updateGallery();
    }, 5000);

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
});
