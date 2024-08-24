$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();  // Initialize tooltips

    function setupEditFunctionality(config) {
        const {
            modalId,
            editButtonId,
            saveButtonId,
            textInputId,
            imageInputId,
            currentImageId,
            galleryInputId,
            currentGalleryId
        } = config;

        const $modal = $(`#${modalId}`);
        const $editButton = $(`#${editButtonId}`);
        const $saveButton = $(`#${saveButtonId}`);
        const $textInput = $(`#${textInputId}`);
        const $imageInput = $(`#${imageInputId}`);
        const $currentImage = $(`#${currentImageId}`);
        const $galleryInput = $(`#${galleryInputId}`);
        const $currentGallery = $(`#${currentGalleryId}`);

        $editButton.on('click', function () {
            $textInput.prop('readonly', false);
            $imageInput.removeClass('d-none');
            $currentImage.addClass('d-none');

            if ($galleryInput.length && $currentGallery.length) {
                $galleryInput.removeClass('d-none');
                $currentGallery.addClass('d-none');
            }

            $saveButton.removeClass('d-none');
            $editButton.addClass('d-none');
        });

        $modal.on('hidden.bs.modal', function () {
            $textInput.prop('readonly', true);
            $imageInput.addClass('d-none');
            $currentImage.removeClass('d-none');

            if ($galleryInput.length && $currentGallery.length) {
                $galleryInput.addClass('d-none');
                $currentGallery.removeClass('d-none');
            }

            $saveButton.addClass('d-none');
            $editButton.removeClass('d-none');
            $imageInput.val('');
            if ($galleryInput.length) {
                $galleryInput.val('');
            }
        });
    }

    const sectionsConfig = [
        {
            modalId: 'editGameSection2Modal',
            editButtonId: 'edit-game-section-2-btn',
            saveButtonId: 'save-game-section-2-btn',
            textInputId: 'section_summary_text_2',
            imageInputId: 'section_header_image_2',
            currentImageId: 'current-section_header_image_2',
            galleryInputId: 'section_gallery_2',
            currentGalleryId: 'current-section_gallery_2'
        },
        {
            modalId: 'editGameSection3Modal',
            editButtonId: 'edit-game-section-3-btn',
            saveButtonId: 'save-game-section-3-btn',
            textInputId: 'section_summary_text_3',
            imageInputId: 'section_header_image_3',
            currentImageId: 'current-section_header_image_3',
            galleryInputId: 'section_gallery_3',
            currentGalleryId: 'current-section_gallery_3'
        },
        {
            modalId: 'editGameSection4Modal',
            editButtonId: 'edit-game-section-4-btn',
            saveButtonId: 'save-game-section-4-btn',
            textInputId: 'section_summary_text_4',
            imageInputId: 'section_header_image_4',
            currentImageId: 'current-section_header_image_4',
            galleryInputId: 'section_gallery_4',
            currentGalleryId: 'current-section_gallery_4'
        },
        {
            modalId: 'editAboutUsModal',
            editButtonId: 'edit-about-us-btn',
            saveButtonId: 'save-about-us-btn',
            textInputId: 'about_text',
            imageInputId: 'about_image',
            currentImageId: 'current-about_image'
        },
        {
            modalId: 'editMovieSectionModal',
            editButtonId: 'edit-movie-section-btn',
            saveButtonId: 'save-movie-section-btn',
            imageInputId: 'movie_video',
            currentImageId: 'current-movie_video'
        }
    ];

    sectionsConfig.forEach(config => setupEditFunctionality(config));

    // Open Website Stats Modal and update stats
    $('#website-stats-btn').on('click', function () {
        $('#websiteStatsModal').modal('show');
    });

    $('#websiteStatsModal').on('shown.bs.modal', function () {
        updateWebsiteStats();
    });
    

    // Function to update stats in the modal
    function updateWebsiteStats() {
        $.get('/get-wishlist-clicks', function(response) {
            const { total_clicks, clicks_by_country } = response;
    
            $('#wishlist-clicks').text(total_clicks);
    
            // Prepare data for the chart
            const countryLabels = Object.keys(clicks_by_country);
            const countryData = Object.values(clicks_by_country);
    
            // Check if the canvas element exists
            const ctx = document.getElementById('clicksByCountryChart');
            if (!ctx) {
                console.error("Canvas element with ID 'clicksByCountryChart' not found!");
                return;
            }
    
            const context = ctx.getContext('2d');
            if (!context) {
                console.error("Failed to get 2D context for 'clicksByCountryChart'!");
                return;
            }
    
            new Chart(context, {
                type: 'bar', // Change to 'pie' or 'line' if preferred
                data: {
                    labels: countryLabels,
                    datasets: [{
                        label: 'Clicks by Country',
                        data: countryData,
                        backgroundColor: countryLabels.map(() => randomColor()), // Random colors for each bar
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    title: {
                        display: true,
                        text: 'Wishlist Clicks by Country'
                    }
                }
            });
        });
    }    

    // Utility function to generate random colors for the chart
    function randomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});
