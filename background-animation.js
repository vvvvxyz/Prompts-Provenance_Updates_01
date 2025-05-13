document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const backgroundContainer = document.querySelector('.background-images');
    if (!backgroundContainer) {
        console.error('Background container not found');
        return;
    }
    
    // Define your images here
    const images = [
        'Andean Highlands, Peru Sacred Valley.jpg',
        'Atlas Mountains, Morocco (Berber Villages) Aït Benhaddou.jpg',
        'Atlas Mountains, Morocco Aït Benhaddou.jpg',
        'Barcelona, Spain (Eixample).jpg',
        'Amsterdam, Netherlands (Canal Belt)Prinsengracht.jpg',
        'Amazon Rainforest, Brazil Manaus region.jpg',
        'Berlin, Germany (Kreuzberg) Görlitzer Park.jpg',
        'Black Forest, Germany (Triberg area).jpg',
        'Canterbury, New Zealand (Plains)Lake Tekapo.jpg',
        'Addis Ababa, Ethiopia.jpg',
        'Cartagena, Colombia Monumento Torre del Reloj.jpg',
        'Copenhagen, Denmark_01.jpg',
        'Cusco, Peru Plaza Mayor de Cusco.jpg',
        'Ganvie, Benin Lake Village.jpg',
        'Georgetown, Malaysia (Heritage Zone) Armenian Street.jpg',
        'Hokkaido, Japan (Farm Region)Furano fields.jpg',
        'Isle of Skye, Scotland (Highland Region).jpg',
        'Jaipur, India Hawa Mahal.jpg',
        'Kerala Backwaters, India Alappuzha canals.jpg',
        'Kyoto, Japan (Gion District) Hanami-koji Street.jpg',
        'Luang Prabang, Laos Mount Phousi.jpg',
        'Medina of Fez, Morocco Bab Boujloud gate.jpg',
        'Mekong Delta, Vietnam Cai Rang floating market.jpg',
        'Melbourne, Australia (CBD) Flinders Street Station.jpg',
        'Montana,USA (Big Sky Country)Mountain Village.jpg',
        'Nova Scotia, Canada (Cape Breton)Cabot Trail.jpg',
        'Sapa Rice Terraces, Vietnam Muong Hoa Valley.jpg',
        'Stockholm, Sweden (Södermalm) Fotografiska area.jpg',
        'Tasmania, Australia (Central Highlands)Great Lake area.jpg',
        'Tuscany, Italy.jpg',
        'Venice, Italy St. Mark\'s Square.jpg',
        'Viñales Valley, Cuba Mogote.jpg'
    ];

    console.log(`Creating background with ${images.length} images`);

    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    backgroundContainer.appendChild(carouselContainer);

    let currentRotation = 0;
    const radius = 1200;
    const theta = 360 / images.length;
    const rotationSpeed = 0.25; // Positive value for bottom to top rotation

    function createImage(src, index) {
        const img = document.createElement('img');
        img.src = `Gen_Images_Animation/${src}`;
        img.alt = src.split('.')[0];
        img.className = 'carousel-image';
        
        const angle = theta * index;
        img.style.transform = `
            rotateX(${angle}deg) 
            translateZ(${radius}px)
        `;
        
        img.onerror = () => console.error(`Failed to load image: ${src}`);
        img.onload = () => console.log(`Successfully loaded image: ${src}`);
        
        return img;
    }

    // Initialize carousel with all images
    images.forEach((src, index) => {
        const img = createImage(src, index);
        carouselContainer.appendChild(img);
    });

    function animate() {
        currentRotation += rotationSpeed; // Changed to += for bottom to top
        carouselContainer.style.transform = `
            translateZ(-${radius}px) 
            rotateX(${currentRotation}deg)
        `;
        requestAnimationFrame(animate);
    }

    // Start the continuous animation
    requestAnimationFrame(animate);
}); 