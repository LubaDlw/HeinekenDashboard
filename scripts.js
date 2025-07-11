//Airtable Api = Keys 
const AIRTABLE_BASE_ID = 'app9idBivwbbn1Lvv';  //base of airtable
const AIRTABLE_TABLE_NAME = 'Testnews'; //Table to `get data from
const AIRTABLE_API_KEY = 'patj9lBJkIWbEADlo.4c3fde5392b514df755939390e0925654ebd105de24f403b032c5b02fdc175b7';  //api key 

let allArticles = [];
let filteredArticles = [];
let currentBrand = 'all';
let currentPage = 1;
const articlesPerPage = 12;  //number of articles per page. . 

// Hero `section carouselss
const carouselItems = [
  {
    type: 'image',
    src: './assets/we-brew-the-joy-of-true-togetherness.jpg',
    title: 'Heineken Excellence',
    description: 'Discover the world of premium brewing'
  },
  {
    type: 'image',
    src: './assets/Hunters original refreshment banner 1.jpg',
    title: 'Hunters Dry',
    description: 'Refreshing taste that never disappoints'
  },
  {
    type: 'video',
    src: './assets/Bernini-Mimosa-300ml.mp4',
    poster: './assets/we-brew-the-joy-of-true-togetherness.jpg',
    title: 'Bernini Sparkling',
    description: 'Experience the sparkle of celebration'
  },
  
];


// HERO CAROUSEL LOGIC 
let currentSlide = 0;
let carouselInterval;
let isPlaying = true;

async function loadData() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const container = document.getElementById('news-container');
    
    loading.style.display = 'block';
    error.style.display = 'none';
    container.innerHTML = '';

    try {
        if (AIRTABLE_API_KEY !== 'YOUR_AIRTABLE_API_KEY') {
            allArticles = await fetchAllRecords();
        } else {
            console.log('Data is not fetching');
            return
           // allArticles = mockData;
        }

        filteredArticles = allArticles;
        currentPage = 1; // Reset to first page
        updateStats();
        renderArticles();
        updatePagination();
        
    } catch (err) {
        console.error('Error loading data:', err);
        error.style.display = 'block';
        error.textContent = `Error loading data: ${err.message}. check data connection`;
        
        allArticles = mockData;
        filteredArticles = allArticles;
        currentPage = 1;
        updateStats();
        renderArticles();
        updatePagination();
    }
    
    loading.style.display = 'none';
}

async function fetchAllRecords() {
    let records = [];
    let offset = null;
    
    do {
        let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=desc&pageSize=100`;
        
        if (offset) {
            url += `&offset=${offset}`;
        }
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        records = records.concat(data.records);
        offset = data.offset;
        
        console.log(`Fetched ${data.records.length} records. Total so far: ${records.length}`);
        
    } while (offset);
    
    console.log(`Total records fetched: ${records.length}`);
    return records;
}

function updateStats() {
    const total = allArticles.length;
    const heineken = allArticles.filter(article => article.fields.Brand === 'Heineken').length;
    const hunters = allArticles.filter(article => article.fields.Brand === 'Hunters').length;
    const bernini = allArticles.filter(article => article.fields.Brand === 'Bernini').length;

    document.getElementById('total-articles').textContent = total;
    document.getElementById('heineken-count').textContent = heineken;
    document.getElementById('hunters-count').textContent = hunters;
    document.getElementById('bernini-count').textContent = bernini;
    
    console.log('Article counts:', { total, heineken, hunters, bernini });
}

function getCurrentPageArticles() {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return filteredArticles.slice(startIndex, endIndex);
}

function getTotalPages() {
    return Math.ceil(filteredArticles.length / articlesPerPage);
}

function renderArticles() {
    const container = document.getElementById('news-container');
    const currentArticles = getCurrentPageArticles();
    
    if (currentArticles.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon"></div>
                <h3>No articles found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }

    container.innerHTML = currentArticles.map(article => {
        const fields = article.fields;
        const brandClass = `brand-${fields.Brand?.toLowerCase() || 'unknown'}`;
        
      return `
    <div class="news-card">
        <div class="news-header" style="background-image: url('${fields.Thumbnail}'); background-size: cover; background-position: center;">
            <div class="news-header-overlay">
                <span class="brand-tag ${brandClass}">${fields.Brand || 'Unknown'}</span>
                <h3 class="news-title">${fields.Title || 'Untitled'}</h3>
                <div class="news-meta">
                    <span class="news-date">${formatDate(fields.Date)}</span>
                </div>
            </div>
        </div>
        <div class="news-content"></div>
        <div class="news-footer">
            <a href="${fields.Link || '#'}" target="_blank" class="read-more">Read More →</a>
        </div>
    </div>
`;
// Add description logic - onnce fix escription
    }).join('');
}

function updatePagination() {
    const totalPages = getTotalPages();
    const topPagination = document.getElementById('top-pagination');
    const bottomPagination = document.getElementById('bottom-pagination');
    
    if (totalPages <= 1) {
        topPagination.style.display = 'none';
        bottomPagination.style.display = 'none';
        return;
    }
    
    const paginationHTML = createPaginationHTML(totalPages);
    topPagination.innerHTML = paginationHTML;
    bottomPagination.innerHTML = paginationHTML;
    topPagination.style.display = 'flex';
    bottomPagination.style.display = 'flex';
    
    // Add event listeners to pagination buttons
    addPaginationListeners();
}

function createPaginationHTML(totalPages) {
    let html = `
        <div class="pagination-info">
            Showing ${((currentPage - 1) * articlesPerPage) + 1}-${Math.min(currentPage * articlesPerPage, filteredArticles.length)} of ${filteredArticles.length} articles
        </div>
        <div class="pagination-controls">
    `;
    
    // Previous button
    html += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            « Previous
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            Next »
        </button>
    `;
    
    html += `</div>`;
    return html;
}

function addPaginationListeners() {
    const paginationButtons = document.querySelectorAll('.pagination-btn:not(.disabled)');
    paginationButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                renderArticles();
                updatePagination();
                // Scroll to top of articles
                document.getElementById('news-container').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function filterArticles() {
    const searchTerm = document.querySelector('.search-box').value.toLowerCase();
    
    filteredArticles = allArticles.filter(article => {
        const fields = article.fields;
        const matchesBrand = currentBrand === 'all' || fields.Brand === currentBrand;
        const matchesSearch = searchTerm === '' || 
            (fields.Title && fields.Title.toLowerCase().includes(searchTerm)) ||
            (fields.Snippet && fields.Snippet.toLowerCase().includes(searchTerm)) ||
            (fields.Source && fields.Source.toLowerCase().includes(searchTerm));
        
        return matchesBrand && matchesSearch;
    });
    
    // Reset to first page when filtering
    currentPage = 1;
    renderArticles();
    updatePagination();
}

function initializeEventListeners() {
    // Brand filter buttons
    const brandButtons = document.querySelectorAll('.brand-btn');
    brandButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            brandButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentBrand = e.target.dataset.brand;
            filterArticles();
        });
    });

    // Search box
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('input', filterArticles);
    }

    // Refresh button
    const refreshButton = document.querySelector('.refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadData);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    initializeCarousel();
    initializeEventListeners();
    loadData();
});

// Carousel Functions
function initializeCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    
    // Create carousel items
    track.innerHTML = carouselItems.map((item, index) => {
        if (item.type === 'video') {
            return `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <video class="carousel-video" poster="${item.poster}" muted loop>
                        <source src="${item.src}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="carousel-content">
                        <h2 class="carousel-title">${item.title}</h2>
                        <p class="carousel-description">${item.description}</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img class="carousel-image" src="${item.src}" alt="${item.title}">
                    <div class="carousel-content">
                        <h2 class="carousel-title">${item.title}</h2>
                        <p class="carousel-description">${item.description}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Create indicators
    indicators.innerHTML = carouselItems.map((_, index) => 
        `<button class="indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>`
    ).join('');
    
    // Add event listeners
    document.getElementById('prev-btn').addEventListener('click', prevSlide);
    document.getElementById('next-btn').addEventListener('click', nextSlide);
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
    
    // Indicator click listeners
    indicators.querySelectorAll('.indicator').forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const slideIndex = parseInt(e.target.dataset.slide);
            goToSlide(slideIndex);
        });
    });
    
    // Start autoplay
    startCarousel();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % carouselItems.length;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    
    // Update carousel position
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active classes
    track.querySelectorAll('.carousel-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentSlide);
        
        // Handle video playback
        const video = item.querySelector('video');
        if (video) {
            if (index === currentSlide) {
                video.play().catch(e => console.log('Video autoplay prevented:', e));
            } else {
                video.pause();
            }
        }
    });
    
    // Update indicators
    indicators.querySelectorAll('.indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function togglePlayPause() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    
    if (isPlaying) {
        stopCarousel();
        playIcon.textContent = '▶';
        isPlaying = false;
    } else {
        startCarousel();
        playIcon.textContent = '⏸';
        isPlaying = true;
    }
}