/**
 * NEXUS OPS V2 - CORE ENGINE
 * optimized for GitHub Pages (Client-Side) with Server-Like behavior
 */

class NexusSystem {
    constructor() {
        this.docId = null;
        this.baseUrl = "https://docs.google.com/document/d/";
        this.consoleEl = document.getElementById('sysLog');
        this.loader = document.getElementById('loader');
        this.placeholder = document.getElementById('placeholder');
        this.iframe = document.getElementById('docFrame');
    }

    // --- UTILITIES ---
    
    log(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let color = '#00ff41'; // green
        if (type === 'error') color = '#ff2a2a'; // red
        if (type === 'warn') color = '#ffff00'; // yellow

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span style="color:${color}">${msg}</span>`;
        this.consoleEl.appendChild(entry);
        this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    }

    notify(msg, type = 'success') {
        let bg = type === 'error' ? "linear-gradient(to right, #ff5f6d, #ffc371)" : "linear-gradient(to right, #00b09b, #96c93d)";
        Toastify({
            text: msg,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: bg, boxShadow: "0 0 15px rgba(0,0,0,0.5)" }
        }).showToast();
    }

    // --- CORE LOGIC ---

    init() {
        const input = document.getElementById('urlInput').value.trim();
        
        // Robust Regex to find ID
        const regex = /\/d\/([a-zA-Z0-9-_]+)/;
        const match = input.match(regex);

        if (match && match[1]) {
            this.docId = match[1];
            this.log(`TARGET IDENTIFIED: ${this.docId}`);
            this.log("INITIALIZING HANDSHAKE...");
            
            // Show Tools
            document.getElementById('toolsPanel').style.display = 'block';
            
            // Load Viewer
            this.loadIframe('preview');
            this.notify("Target Locked");
            
            // Simulate Server-Side Page Detection
            this.detectPages();
        } else {
            this.log("ERROR: INVALID URL FORMAT", 'error');
            this.notify("Invalid URL", "error");
        }
    }

    loadIframe(mode) {
        if (!this.docId) return;

        this.loader.style.display = 'flex';
        this.placeholder.style.display = 'none';
        this.iframe.style.opacity = '0';

        // MODES: 
        // 'preview' = Standard Desktop View
        // 'mobilebasic' = Stripped HTML (Best for scraping/copying)
        let endpoint = mode;
        
        this.log(`REQUESTING VIEW MODE: ${mode.toUpperCase()}...`);
        
        // Inject
        this.iframe.src = `${this.baseUrl}${this.docId}/${endpoint}`;

        this.iframe.onload = () => {
            this.loader.style.display = 'none';
            this.iframe.style.opacity = '1';
            this.log("STREAM ESTABLISHED.", 'success');
        };
    }

    // --- DOWNLOADER MODULE ---
    
    download(format) {
        if (!this.docId) return;
        
        this.log(`GENERATING DOWNLOAD LINK: .${format.toUpperCase()}`);
        
        // Direct Google Export Endpoint
        const url = `${this.baseUrl}${this.docId}/export?format=${format}`;
        
        // Invisible Trigger
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.notify(`Downloading .${format.toUpperCase()}`);
    }

    // --- THE MAGIC COPY FIX (Bypass) ---
    
    magicCopy() {
        if (!this.docId) return;

        // SweetAlert2 Modal
        Swal.fire({
            title: '<strong>MAGIC COPY PROTOCOL</strong>',
            icon: 'info',
            background: '#050505',
            color: '#fff',
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p>Browser security (CORS) blocks scripts from reading Google Docs directly. We use the <b>Mobile Basic</b> exploit to bypass this.</p>
                    <hr style="border-color: #333;">
                    <ol>
                        <li>Click <b>OPEN BYPASS</b> below.</li>
                        <li>A stripped version of the doc will open.</li>
                        <li>This version has <b>NO SCRIPTS</b> blocking copy.</li>
                        <li>Press <kbd>Ctrl+A</kbd> then <kbd>Ctrl+C</kbd>.</li>
                    </ol>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'OPEN BYPASS <i class="fa-solid fa-up-right-from-square"></i>',
            confirmButtonColor: '#00f3ff',
            cancelButtonColor: '#333'
        }).then((result) => {
            if (result.isConfirmed) {
                this.log("EXECUTING MAGIC COPY BYPASS...");
                // Open the mobilebasic view in a new tab - this is the "Magic"
                window.open(`${this.baseUrl}${this.docId}/mobilebasic`, '_blank');
            }
        });
    }

    // --- PAGE DETECTION SIMULATION ---
    // Note: True page count requires downloading the PDF blob and parsing binary data.
    // We simulate this for the "Console" feel requested by the user.
    detectPages() {
        setTimeout(() => {
            this.log("ANALYZING METADATA...");
            
            // We verify the doc is accessible via export check
            fetch(`${this.baseUrl}${this.docId}/export?format=txt`, { method: 'HEAD' })
                .then(res => {
                    if (res.ok) {
                        this.log("STATUS: 200 OK (PUBLIC/ACCESSIBLE)", 'success');
                        this.log("PAGE ESTIMATION: READY IN .PDF EXPORT");
                    } else {
                        this.log("STATUS: RESTRICTED (VIEW ONLY)", 'warn');
                        this.log("NOTE: Use 'Magic Copy' for restricted docs.");
                    }
                })
                .catch(() => {
                     this.log("CORS RESTRICTION DETECTED. SWITCHING TO PASSIVE MODE.", 'warn');
                });

        }, 1500);
    }
}

// === INITIALIZATION ===
const Nexus = new NexusSystem();

// Event Listeners
document.getElementById('initBtn').addEventListener('click', () => Nexus.init());
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') Nexus.init();
});

// Mobile Detection Log
const ua = navigator.userAgent;
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)){
    Nexus.log("ENVIRONMENT: MOBILE DETECTED", 'warn');
} else {
    Nexus.log("ENVIRONMENT: DESKTOP WORKSTATION");
}
