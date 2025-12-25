// MrCharlie - Core JS
console.log("Cyber Tiger Systems Online...");

const PRODUCTS_URL = 'data/products.json';

async function fetchAndRenderHero() {
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error("Failed to load products");

        const data = await response.json();
        const products = data.products || [];

        // Get the first product (feature product)
        const app = products[0];
        if (!app) return;

        // Render to DOM
        const headline = document.getElementById('hero-headline');
        const description = document.getElementById('hero-description');
        const image = document.getElementById('hero-image');
        const cta = document.getElementById('hero-cta');

        if (headline) {
            headline.innerHTML = `App <span class="highlight-orange">${app.name}</span><br> ${app.usage}`;
        }

        if (description) {
            description.innerHTML = app.goodFor
                ? `Phù hợp cho: ${app.goodFor}`
                : app.usage;
        }

        if (image) {
            image.src = app.icon;
            image.style.display = 'block';
        }

        if (cta) {
            cta.href = app.link;
            cta.innerHTML = `👉 Tải App Ngay`;
            // Or use dynamic text if we add a 'ctaText' field later. 
            // For now, keep it generic or specific to the context.
            // Let's make it a bit more flexible based on the link.
            if (app.link.includes('zalo')) {
                cta.innerHTML = `👉 Vào nhóm Zalo lấy App`;
            }
            cta.style.display = 'inline-flex';
        }

    } catch (error) {
        console.error("Error loading app data:", error);
        // Fallback or leave as Loading...
        document.getElementById('hero-headline').innerText = "Đang bảo trì...";
    }
}

// Simple Parallax Effect for Hero
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    const heroVisual = document.querySelector('.tiger-circle');
    if (heroVisual) {
        heroVisual.style.transform = `translate(-${mouseX * 20}px, -${mouseY * 20}px)`;
    }
});

// Init
document.addEventListener('DOMContentLoaded', fetchAndRenderHero);
