// MrCharlie - Core JS
console.log("Cyber Tiger Systems Online...");

const PRODUCTS_URL = 'data/products.json';

let allProducts = [];

async function fetchAndRenderHero() {
    try {
        // Cache Busting: Add timestamp to force fresh data load
        const response = await fetch(PRODUCTS_URL + '?v=' + new Date().getTime());
        if (!response.ok) throw new Error("Failed to load products");

        const data = await response.json();
        allProducts = data.products || [];

        if (allProducts.length === 0) return;

        // Render Initial (First Product)
        switchApp(0);

        // Render Switcher (Will auto-hide if only 1 product)
        renderSwitcher();

    } catch (error) {
        console.error("Error loading app data:", error);
        document.getElementById('hero-headline').innerText = "Đang bảo trì...";
    }
}

function switchApp(index) {
    const app = allProducts[index];
    if (!app) return;

    // Render to DOM
    const headline = document.getElementById('hero-headline');
    const description = document.getElementById('hero-description');
    const image = document.getElementById('hero-image');
    const cta = document.getElementById('hero-cta');
    const note = document.getElementById('hero-note'); // New element

    if (headline) {
        // Use 'usage' as the main catchy headline (Squeeze Style) 
        // fallback to Name if usage is empty
        headline.innerHTML = app.usage || app.name;
    }

    if (description) {
        // Use 'goodFor' as the humble description
        description.innerHTML = app.goodFor || "";
    }

    if (image) {
        // Fix path: remove leading slash if present to make it relative
        let iconPath = app.icon;
        if (iconPath && iconPath.startsWith('/') && !iconPath.startsWith('http')) {
            iconPath = iconPath.substring(1);
        }
        image.src = iconPath;
        image.style.display = 'block';
    }

    if (cta) {
        cta.href = app.link;
        // Default Strategy: Always "Download Windows App"
        cta.innerHTML = `👉 TẢI APP WINDOWS`;
        cta.style.display = 'inline-flex';
    }

    if (note) {
        // Use 'badFor' field for the Note (Repurposing existing field)
        if (app.badFor) {
            note.innerHTML = `(* ${app.badFor})`;
            note.style.display = 'block';
            note.style.fontSize = '0.9rem';
            note.style.marginTop = '10px';
            note.style.fontStyle = 'italic';
            note.style.opacity = '0.7';
        } else {
            note.style.display = 'none';
        }
    }

    // Update Active Link State
    const links = document.querySelectorAll('.switcher-btn');
    links.forEach(link => link.classList.remove('active'));

    const activeLink = document.getElementById(`switch-${index}`);
    if (activeLink) activeLink.classList.add('active');
}

function renderSwitcher() {
    const container = document.getElementById('app-switcher');
    if (!container) return;

    // Squeeze Logic: If only 1 app, hide the switcher entirely
    if (allProducts.length <= 1) {
        container.style.display = 'none';
        return;
    } else {
        container.style.display = 'block'; // Show if multiple apps
    }

    let html = `<span style="color:#666; margin-right:10px; font-size:0.9rem;">LAB projects:</span>`;

    allProducts.forEach((prod, index) => {
        html += `<button id="switch-${index}" class="switcher-btn" onclick="switchApp(${index})">[ ${prod.name} ]</button>`;
    });

    container.innerHTML = html;
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
