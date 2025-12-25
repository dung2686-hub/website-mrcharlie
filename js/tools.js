// URL file JSON
const PRODUCTS_URL = 'data/products.json';
const TOOLS_URL = 'data/tools.json';

// Global Data Storage
let allProducts = [];
let allTools = [];

function createCardHTML(item) {
    // Kiểm tra icon là Ảnh (URL/Path) hay Emoji
    const isImage = item.icon && (item.icon.includes('/') || item.icon.includes('http'));
    // Nếu là ảnh, dùng thẻ img. Nếu không, dùng text (emoji)
    const iconHtml = isImage
        ? `<img src="${item.icon}" alt="${item.name}" class="icon-img">`
        : (item.icon || '🚀'); // Fallback icon

    return `
    <div class="glass-card tool-card-detailed">
        <div class="tool-header">
            <div class="card-icon">${iconHtml}</div>
            <h3>${item.name}</h3>
        </div>
        
        <div class="tool-body">
            <div class="info-group">
                <p class="label">🛠 Dùng để:</p>
                <p class="content">${item.usage || ''}</p>
            </div>
            
            <div class="info-group">
                <p class="label highlight-green">✅ Hợp với:</p>
                <p class="content">${item.goodFor || ''}</p>
            </div>

            <div class="info-group">
                <p class="label highlight-red">❌ Chưa hợp:</p>
                <p class="content">${item.badFor || ''}</p>
            </div>

            <a href="${item.link || '#'}" class="btn-tiger btn-full" target="_blank">Xem Chi Tiết</a>
        </div>
    </div>
    `;
}

function renderGrid(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Nếu là arsenal, cần tìm .grid-container con của nó (hoặc sửa lại HTML để ID trỏ thẳng vào grid)
    // Ở logic cũ: const toolsContainer = arsenalSection.querySelector('.grid-container');
    // Để đơn giản, ta sẽ query selector linh hoạt

    let grid = document.getElementById(containerId);
    // Nếu containerId là 'arsenal', target là grid-container bên trong nó
    if (containerId === 'arsenal') {
        const section = document.getElementById('arsenal');
        if (section) grid = section.querySelector('.grid-container');
    }

    if (grid) {
        if (data.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:#888; width:100%;">Không tìm thấy kết quả nào.</p>';
        } else {
            grid.innerHTML = data.map(item => createCardHTML(item)).join('');
        }
    }
}

async function fetchAndRender() {
    try {
        // 1. Fetch & Store Sản Phẩm
        const productsResponse = await fetch(PRODUCTS_URL);
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            allProducts = productsData.products || [];
            renderGrid('products-grid', allProducts);
        }

        // 2. Fetch & Store Công Cụ
        const toolsResponse = await fetch(TOOLS_URL);
        if (toolsResponse.ok) {
            const toolsData = await toolsResponse.json();
            allTools = toolsData.tools || [];
            renderGrid('arsenal', allTools);
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    // Filter Products
    const filteredProducts = allProducts.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.usage && item.usage.toLowerCase().includes(query)) ||
        (item.goodFor && item.goodFor.toLowerCase().includes(query))
    );
    renderGrid('products-grid', filteredProducts);

    // Filter Tools
    const filteredTools = allTools.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.usage && item.usage.toLowerCase().includes(query)) ||
        (item.goodFor && item.goodFor.toLowerCase().includes(query))
    );
    renderGrid('arsenal', filteredTools);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRender();

    // Attach Search Event
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});
