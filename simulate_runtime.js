
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Mock Browser Environment
const mockWindow = {
    document: {
        getElementById: (id) => {
            return {
                value: '',
                textContent: '',
                innerHTML: '',
                addEventListener: () => { },
                classList: {
                    add: () => { },
                    remove: () => { }
                },
                elements: new Proxy({}, { get: () => ({ value: '' }) }),
                reset: () => { }
            };
        },
        querySelector: () => ({ textContent: '', disabled: false }),
        querySelectorAll: () => [],
        addEventListener: () => { }
    },
    sessionStorage: {
        getItem: (key) => {
            if (key === 'gh_owner') return 'dung2686-hub';
            if (key === 'gh_repo') return 'website-mrcharlie';
            return null;
        },
        setItem: () => { },
        clear: () => { }
    },
    location: { reload: () => { } },
    alert: (msg) => { },
    confirm: () => true,
    console: console,
    FileReader: class {
        readAsDataURL() { }
    },
    setTimeout: (fn) => fn(),
    Event: class { },
    window: {} // helper
};

mockWindow.window = mockWindow; // Circular ref for window.window

// Create Context
const context = vm.createContext(mockWindow);

// 2. Read Source Code
const appJsPath = path.join(__dirname, 'admin/js/app.js');
const ghClientJsPath = path.join(__dirname, 'admin/js/github-client.js');

let appJs = fs.readFileSync(appJsPath, 'utf8');
const ghClientJs = fs.readFileSync(ghClientJsPath, 'utf8');

// --- INSTRUMENTATION FOR TESTING ---
// expose appState to window so we can view/set it from test
appJs = appJs.replace('let appState =', 'window.appState =');

console.log("=== BẮT ĐẦU MÔ PHỎNG RUNTIME (V2) ===");

try {
    // 3. Load Code
    console.log("Loading github-client.js...");
    vm.runInContext(ghClientJs, context);

    console.log("Loading app.js...");
    vm.runInContext(appJs, context);
    console.log("✅ Code loaded successfully.");

    // 4. Verification Steps
    console.log("\n--- KIỂM TRA CHỨC NĂNG ---");

    // Check 1: Function Existence
    const requiredFunctions = ['handleSearch', 'newItem', 'editItem', 'resolveImageUrl'];
    requiredFunctions.forEach(func => {
        if (typeof context[func] === 'function') {
            console.log(`✅ Function '${func}' is defined and callable.`);
        } else {
            throw new Error(`❌ Function '${func}' is MISSING!`);
        }
    });

    // Check 2: Logic Simulation - Data Rendering
    console.log("\n--- SIMULATING LOGIC ---");

    // Inject Mock Data
    context.appState.products = [
        { name: 'CyberProduct', icon: 'assets/logos/cyber.png' },
        { name: 'LegacyProduct', icon: 'assets/old.png' }
    ];
    context.appState.currentTab = 'products';

    // Call renderList (this tests resolveImageUrl indirectly too)
    // We can't easily check DOM output here without full DOM mock, 
    // but running it ensures no crash.
    console.log("Running renderList()...");
    context.renderList();
    console.log("✅ renderList() ran without errors.");

    // Check 3: resolveImageUrl correctness
    console.log("Checking resolveImageUrl logic...");
    const url1 = context.resolveImageUrl('assets/logos/cyber.png');
    const expected1 = 'https://raw.githubusercontent.com/dung2686-hub/website-mrcharlie/main/assets/logos/cyber.png';

    if (url1 !== expected1) throw new Error(`URL Logic Fail. Got: ${url1}`);
    console.log("✅ Logic OK: Relative path -> Raw URL");

    const url2 = context.resolveImageUrl('/assets/new.png');
    const expected2 = 'https://raw.githubusercontent.com/dung2686-hub/website-mrcharlie/main/assets/new.png';
    if (url2 !== expected2) throw new Error(`URL Logic Fail. Got: ${url2}`);
    console.log("✅ Logic OK: Absolute path -> Raw URL");

    // Check 4: Search
    console.log("Running handleSearch({target:{value:'Cyber'}})...");
    context.handleSearch({ target: { value: 'Cyber' } });
    console.log("✅ handleSearch() ran without errors.");

    // Check 5: Logic New/Edit
    console.log("Running newItem()...");
    context.newItem();
    console.log("✅ newItem() ran without errors.");

    console.log("Running editItem(0)...");
    context.editItem(0);
    console.log("✅ editItem(0) ran without errors.");

    console.log("\n=== KẾT QUẢ: 100% SUCCESS ===");
    console.log(">> Hệ thống hoạt động hoàn hảo trong môi trường giả lập <<");

} catch (e) {
    console.error("\n❌❌❌ TEST FAILED ❌❌❌");
    console.error(e);
    process.exit(1);
}
