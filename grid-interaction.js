document.addEventListener('DOMContentLoaded', () => {
    // Define Wikimedia image mappings
    const wikimediaImages = {
        'Amsterdam, Netherlands': {
            path: 'places_wikimedia/amsterdam, netherlands wikimedia.jpg',
            attribution: 'Wikimedia Commons'
        },
        'Andean Highlands, Peru': {
            path: 'places_wikimedia/Andean Highlands, Peru, Wikimedia.jpg',
            attribution: 'Wikimedia Commons'
        },
        'Barcelona, Spain': {
            path: 'places_wikimedia/Barcelona, Spain, wikimedia.jpg',
            attribution: 'Wikimedia Commons'
        },
        'Atlas Mountains, Morocco': {
            path: 'places_wikimedia/Berber_architecture_near_the_Dades_gorges_in_the_Anti-Atlas_mountain_range,_Morocco.jpg',
            attribution: 'Wikimedia Commons'
        },
        'Kyoto, Japan': {
            path: 'places_wikimedia/kyoto, japan wikimedia.jpg',
            attribution: 'Wikimedia Commons'
        }
    };

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'comparison-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="image-comparison">
                <div class="ai-image">
                    <h3>AI Generated</h3>
                    <img src="" alt="AI Generated Image">
                    <div class="prompt"></div>
                </div>
                <div class="original-image">
                    <h3>Reference Image</h3>
                    <img src="" alt="Original Image">
                    <div class="image-attribution"></div>
                </div>
            </div>
            <div class="location-title"></div>
            <button class="close-modal">×</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle grid item clicks
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        item.addEventListener('click', () => {
            const aiImage = item.querySelector('img').src;
            const location = item.querySelector('.location-caption').textContent;
            
            // Show modal
            modal.classList.add('active');
            modal.querySelector('.ai-image img').src = aiImage;
            modal.querySelector('.location-title').textContent = location;
            
            // Get the prompt from the filename
            const promptText = aiImage.split('/').pop().replace(/_/g, ' ').replace('.jpg', '');
            modal.querySelector('.prompt').textContent = `Prompt: "${promptText}"`;
            
            // Set Wikimedia image if available
            const wikimediaData = wikimediaImages[location];
            if (wikimediaData) {
                modal.querySelector('.original-image img').src = wikimediaData.path;
                modal.querySelector('.image-attribution').textContent = wikimediaData.attribution;
            } else {
                modal.querySelector('.original-image img').src = '';
                modal.querySelector('.image-attribution').textContent = 'Reference image not available';
            }
        });
    });

    // Close modal handlers
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}); 