// App State
let appState = {
    products: [],
    tools: [],
    shas: { products: null, tools: null },
    currentTab: 'products', // 'products' or 'tools'
    editingId: null, // Index of item being edited
    pendingIconFile: null // File object waiting to be uploaded on save
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const listView = document.getElementById('list-view');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const pageTitle = document.getElementById('page-title');

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Check Session
    const savedToken = sessionStorage.getItem('gh_token');
    const savedOwner = sessionStorage.getItem('gh_owner');
    const savedRepo = sessionStorage.getItem('gh_repo');

    if (savedToken && savedOwner && savedRepo) {
        document.getElementById('github-token').value = savedToken;
        document.getElementById('repo-owner').value = savedOwner;
        document.getElementById('repo-name').value = savedRepo;
        login(); // Auto login
    }

    // Search Listener
    document.getElementById('admin-search').addEventListener('input', (e) => handleSearch(e));

    // Login Listener
    document.getElementById('btn-login').addEventListener('click', () => login());
});

// --- Authentication ---
async function login() {
    const token = document.getElementById('github-token').value.trim();
    const owner = document.getElementById('repo-owner').value.trim();
    const repo = document.getElementById('repo-name').value.trim();
    const msg = document.getElementById('login-msg');

    if (!token || !owner || !repo) {
        msg.textContent = "Vui lòng nhập đủ thông tin!";
        return;
    }

    msg.textContent = "Đang kết nối...";
    ghClient.setCredentials(token, owner, repo);

    const result = await ghClient.verify();
    if (result.isValid) {
        // Save session
        sessionStorage.setItem('gh_token', token);
        sessionStorage.setItem('gh_owner', owner);
        sessionStorage.setItem('gh_repo', repo);
        sessionStorage.setItem('gh_branch', result.defaultBranch || 'main'); // Save branch

        loginScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');
        loadData();
    } else {
        msg.textContent = "Kết nối thất bại! Kiểm tra lại Token hoặc Tên Repo.";
    }
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

// --- Data Management ---
async function loadData() {
    listView.innerHTML = '<p style="color: white; text-align: center;">Đang tải dữ liệu...</p>';
    try {
        // Load Products
        const prodData = await ghClient.getFile('data/products.json');
        appState.products = prodData.content.products || [];
        appState.shas.products = prodData.sha;

        // Load Tools
        const toolData = await ghClient.getFile('data/tools.json');
        appState.tools = toolData.content.tools || [];

        appState.shas.tools = toolData.sha;

        renderList();
    } catch (e) {
        console.error(e);
        alert('Lỗi tải dữ liệu: ' + e.message);
    }
}

async function saveChanges() {
    const btn = document.getElementById('btn-save-all');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU...';
    btn.disabled = true;

    try {
        // Prepare Data
        const productsFileContent = { products: appState.products };
        const toolsFileContent = { tools: appState.tools };

        // Save Products
        const prodRes = await ghClient.updateFile(
            'data/products.json',
            productsFileContent,
            appState.shas.products,
            'Update Products via Cyber Admin'
        );
        appState.shas.products = prodRes.content.sha;

        // Save Tools
        const toolRes = await ghClient.updateFile(
            'data/tools.json',
            toolsFileContent,
            appState.shas.tools,
            'Update Tools via Cyber Admin'
        );
        appState.shas.tools = toolRes.content.sha;

        alert('✅ Đã lưu thành công lên GitHub! Web sẽ cập nhật sau 1-2 phút.');
    } catch (e) {
        alert('❌ Lỗi khi lưu: ' + e.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- UI Rendering ---
function switchTab(tab) {
    appState.currentTab = tab;
    // Update Menu Active State
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active'); // Needs 'event' passed or bound, simple trick uses global event

    // Update Title
    pageTitle.textContent = tab === 'products' ? 'Quản Lý Sản Phẩm' : 'Quản Lý Công Cụ';

    renderList();
}

// --- Helper Functions ---
// --- Helper Functions ---
function resolveImageUrl(path) {
    if (!path) return '';

    // 1. External URLs: Keep as is
    if (path.startsWith('http')) return path;

    // 2. Standardize Path: Ensure it starts with '/'
    let cleanPath = path.trim();
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(1);
    // Remove "assets/" prefix if it's already included in the base folder logic of some systems? No, keep it.
    // Ensure leading slash
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    // 3. Admin Optimization: Use Raw GitHub URL to bypass Pages cache
    const owner = sessionStorage.getItem('gh_owner');
    const repo = sessionStorage.getItem('gh_repo');
    const branch = sessionStorage.getItem('gh_branch') || 'main';

    if (owner && repo) {
        // Raw URL format: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path_without_leading_slash}
        const rawPath = cleanPath.substring(1); // Remove leading '/'
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rawPath}`;
    }

    return cleanPath; // Fallback
}

function renderList(filterText = '') {
    const data = appState.currentTab === 'products' ? appState.products : appState.tools;
    const query = filterText.toLowerCase();

    const filtered = data.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.usage && item.usage.toLowerCase().includes(query))
    );

    listView.innerHTML = filtered.map((item, index) => {
        // Find real index in main array for editing
        const realIndex = data.indexOf(item);

        const isImage = item.icon && (item.icon.includes('/') || item.icon.startsWith('http'));
        const iconSrc = isImage ? resolveImageUrl(item.icon) : '';

        const iconHtml = isImage
            ? `<img src="${iconSrc}" onerror="this.src='${item.icon}'" style="width:50px; height:50px; object-fit:contain; background:rgba(255,255,255,0.1); border-radius:5px;">`
            : `<div style="font-size:2rem;">${item.icon || '📦'}</div>`;

        return `
        <div class="glass-card tool-card-detailed admin-item" onclick="editItem(${realIndex})" style="display:flex; align-items:center; gap:20px; cursor:pointer;">
            <div class="item-icon">${iconHtml}</div>
            <div class="item-info" style="flex:1;">
                <h3 style="margin:0; color:var(--color-tiger-orange);">${item.name}</h3>
                <p style="margin:5px 0; font-size:0.9rem; color:#ccc;">${item.usage || 'Chưa có mô tả'}</p>
            </div>
            <div class="item-action">
                <i class="fa-solid fa-pen-to-square" style="color:var(--color-tiger-blue);"></i>
            </div>
        </div>
        `;
    }).join('');
}

function handleSearch(e) {
    renderList(e.target.value);
}

// --- Editor Logic ---
function newItem() {
    appState.editingId = null; // Create mode
    document.getElementById('modal-title').textContent = 'Thêm Mới';
    editForm.reset();
    document.getElementById('icon-preview').innerHTML = '';
    editModal.classList.remove('hidden');
}

function editItem(index) {
    appState.editingId = index;
    document.getElementById('modal-title').textContent = 'Chỉnh Sửa';

    const data = appState.currentTab === 'products' ? appState.products : appState.tools;
    const item = data[index];

    // Populate Form
    const inputs = editForm.elements;
    inputs['name'].value = item.name || '';
    inputs['icon'].value = item.icon || '';
    inputs['usage'].value = item.usage || '';
    inputs['goodFor'].value = item.goodFor || '';
    inputs['badFor'].value = item.badFor || '';
    inputs['link'].value = item.link || '';

    previewIcon(item.icon);

    editModal.classList.remove('hidden');
}

async function saveCurrentItem() {
    const inputs = editForm.elements;

    // Upload pending icon file if exists
    let iconPath = inputs['icon'].value.trim();
    if (appState.pendingIconFile) {
        try {
            // Show uploading indicator
            const saveBtn = document.querySelector('.modal-footer .btn-tiger:not(.btn-delete)');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '⏳ Đang upload ảnh...';
            saveBtn.disabled = true;

            // Upload to GitHub
            iconPath = await ghClient.uploadImage(appState.pendingIconFile);

            // Reset button
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;

            // Clear pending file
            appState.pendingIconFile = null;
        } catch (error) {
            console.error(error);
            alert('❌ Lỗi upload ảnh: ' + error.message);
            return; // Don't save if upload fails
        }
    } else {
        // Sanitize Icon Path: Ensure absolute path for consistency
        if (iconPath && !iconPath.startsWith('http') && !iconPath.startsWith('/')) {
            // If user typed "assets/...", make it "/assets/..."
            if (iconPath.startsWith('../')) {
                iconPath = iconPath.substring(2); // Convert "../assets" -> "/assets"
            } else {
                iconPath = '/' + iconPath;
            }
        }
    }

    const newItem = {
        name: inputs['name'].value,
        icon: iconPath,
        usage: inputs['usage'].value,
        goodFor: inputs['goodFor'].value,
        badFor: inputs['badFor'].value,
        link: inputs['link'].value
    };

    const targetArray = appState.currentTab === 'products' ? appState.products : appState.tools;

    if (appState.editingId === null) {
        // Add New
        targetArray.push(newItem);
    } else {
        // Update Existing
        targetArray[appState.editingId] = newItem;
    }

    closeModal();
    renderList();
}

function deleteCurrentItem() {
    if (appState.editingId === null) return;
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return;

    const targetArray = appState.currentTab === 'products' ? appState.products : appState.tools;
    targetArray.splice(appState.editingId, 1);

    closeModal();
    renderList();
}

function closeModal() {
    editModal.classList.add('hidden');
    appState.pendingIconFile = null; // Clear pending file
}

function previewIcon(val) {
    const preview = document.getElementById('icon-preview');
    if (val && (val.includes('/') || val.includes('http'))) {
        const src = resolveImageUrl(val);
        preview.innerHTML = `<img src="${src}" style="width:100%; height:100px; object-fit:contain;">`;
    } else {
        preview.innerHTML = `<div style="font-size:3rem; text-align:center;">${val}</div>`;
    }
}

function handleIconUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('⚠️ Vui lòng chỉ chọn file ảnh!');
        input.value = '';
        return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
        alert('⚠️ Kích thước ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 1MB.');
        input.value = '';
        return;
    }

    // Store file for later upload
    appState.pendingIconFile = file;

    // Show local preview immediately
    const preview = document.getElementById('icon-preview');
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100px; object-fit:contain;">`;
    };
    reader.onerror = () => {
        alert('⚠️ Lỗi đọc file ảnh!');
        appState.pendingIconFile = null;
    };
    reader.readAsDataURL(file);

    // Update input to show filename
    const iconInput = document.querySelector('input[name="icon"]');
    iconInput.value = `📁 ${file.name} (Chưa upload)`;

    // Reset file input
    input.value = '';
}
