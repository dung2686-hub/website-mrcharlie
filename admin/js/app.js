// App State
let appState = {
    products: [],
    tools: [],
    shas: { products: null, tools: null },
    currentTab: 'products', // 'products' or 'tools'
    editingId: null, // Index of item being edited
    pendingIconFile: null, // File object waiting to be uploaded on save
    pendingExeFile: null // EXE file waiting upload
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
function resolveImageUrl(path) {
    if (!path) return '';

    // 1. External URLs
    if (path.startsWith('http')) return path;

    // 2. Standardize to Root Path (e.g. /assets/logos/...)
    let cleanPath = path.trim();

    // Remove ./ or ../ if present
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(1);
    if (cleanPath.startsWith('../')) cleanPath = cleanPath.substring(2);

    // Ensure leading slash for Domain Root
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    return cleanPath;
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
            ? `<img src="${iconSrc}" onerror="this.outerHTML='<span style=\\'font-size:2rem\\'>⚠️</span>'" style="width:50px; height:50px; object-fit:contain; background:rgba(255,255,255,0.1); border-radius:5px;">`
            : `<div style="font-size:2rem;">${item.icon || '📦'}</div>`;

        // Visibility Style
        const isHidden = item.isVisible === false;
        const opacity = isHidden ? '0.5' : '1';
        const visibilityIcon = isHidden ? '<i class="fa-solid fa-eye-slash" title="Đang Ẩn" style="color:#ff4444; margin-right:10px;"></i>' : '';

        return `
        <div class="glass-card tool-card-detailed admin-item" onclick="editItem(${realIndex})" style="display:flex; align-items:center; gap:20px; cursor:pointer; opacity:${opacity};">
            <div class="item-icon">${iconHtml}</div>
            <div class="item-info" style="flex:1;">
                <h3 style="margin:0; color:var(--color-tiger-orange);">${visibilityIcon}${item.name}</h3>
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
    inputs['usage'].value = item.usage || '';
    inputs['goodFor'].value = item.goodFor || '';
    inputs['badFor'].value = item.badFor || '';
    inputs['link'].value = item.link || '';

    // Visibility (Default true if undefined)
    inputs['isVisible'].checked = item.isVisible !== false;

    previewIcon(item.icon);

    editModal.classList.remove('hidden');
}

async function saveCurrentItem() {
    const inputs = editForm.elements;

    // Upload pending icon file if exists
    let iconPath = inputs['icon'].value.trim();
    if (appState.pendingIconFile) {
        try {
            updateSaveBtnStatus('⏳ Đang upload Icon...');
            iconPath = await ghClient.uploadFile(appState.pendingIconFile, 'assets/logos');
            appState.pendingIconFile = null;
        } catch (error) {
            alert('❌ Lỗi upload Icon: ' + error.message);
            updateSaveBtnStatus('Xác Nhận', false); // Re-enable button
            return;
        }
    } else {
        // Sanitize Icon Path
        if (iconPath && !iconPath.startsWith('http') && !iconPath.startsWith('/')) {
            if (iconPath.startsWith('../')) iconPath = iconPath.substring(2);
            else iconPath = '/' + iconPath;
        }
    }

    // 2. Upload EXE/Link if pending
    let linkPath = inputs['link'].value.trim();
    if (appState.pendingExeFile) {
        try {
            updateSaveBtnStatus('⏳ Đang upload File Setup...');
            // Upload to assets/releases
            const uploadedPath = await ghClient.uploadFile(appState.pendingExeFile, 'assets/releases');

            // Link is relative path
            linkPath = uploadedPath;

            appState.pendingExeFile = null;
        } catch (error) {
            alert('❌ Lỗi upload File: ' + error.message);
            updateSaveBtnStatus('Xác Nhận', false); // Re-enable button
            return;
        }
    }

    const newItem = {
        name: inputs['name'].value,
        icon: iconPath,
        usage: inputs['usage'].value,
        goodFor: inputs['goodFor'].value,
        badFor: inputs['badFor'].value,
        link: linkPath,
        isVisible: inputs['isVisible'].checked // Save visibility state
    };

    const targetArray = appState.currentTab === 'products' ? appState.products : appState.tools;

    if (appState.editingId === null) {
        targetArray.push(newItem);
    } else {
        targetArray[appState.editingId] = newItem;
    }

    closeModal();
    renderList();
    saveChanges(); // Auto-save to JSON after update
}



function updateSaveBtnStatus(text, disabled = true) {
    const saveBtn = document.querySelector('.modal-footer .btn-tiger:not(.btn-delete)');
    if (saveBtn) {
        saveBtn.textContent = text;
        saveBtn.disabled = disabled;
    }
}

function deleteCurrentItem() {
    if (appState.editingId === null) return;
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return;

    const targetArray = appState.currentTab === 'products' ? appState.products : appState.tools;
    targetArray.splice(appState.editingId, 1);

    closeModal();
    renderList();
    saveChanges();
}

function closeModal() {
    editModal.classList.add('hidden');
    appState.pendingIconFile = null; // Clear pending icon file
    appState.pendingExeFile = null; // Clear pending executable file
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

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('icon-preview').innerHTML = `<img src="${e.target.result}" style="width:100%; height:100px; object-fit:contain;">`;
    };
    reader.onerror = () => {
        alert('⚠️ Lỗi đọc file ảnh!');
        appState.pendingIconFile = null;
    };
    reader.readAsDataURL(file);


    // Reset file input
    input.value = '';
}

function handleExeUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Max size 99MB check
    if (file.size > 99 * 1024 * 1024) {
        alert('⚠️ File quá lớn (>99MB). GitHub API giới hạn 100MB!');
        input.value = '';
        return;
    }

    appState.pendingExeFile = file;
    // Visually update the Link input to show pending status
    const linkInput = document.querySelector('input[name="link"]');
    if (linkInput) linkInput.value = `📦 ${file.name} (Chưa upload - Bấm Lưu để up)`;

    // Reset input so same file can be selected again if needed (though unlikely)
    // input.value = ''; // actually don't reset, or do? Standard is not to reset unless we handled it.
    // But we need to keep it in pendingExeFile. 
    // If we reset input.value, the file is gone from DOM input but we have it in memory variable? 
    // Yes, appState.pendingExeFile = file keeps the reference.
    input.value = '';
}
