/**
 * NEXUS OPS V4 - "TITAN"
 * A hyper-modular, robust, and feature-rich client-side application framework.
 *
 * @version 4.0.0
 * @license MIT
 */

"use strict";

// --- CORE SYSTEM ---

class NexusSystem {
    #docId = null;
    #baseUrl = "https://docs.google.com/document/d/";
    #consoleEl = document.getElementById('sysLog');
    #loader = document.getElementById('loader');
    #placeholder = document.getElementById('placeholder');
    #iframe = document.getElementById('docFrame');
    #plugins = new Map();
    #state = 'idle'; // idle, loading, active, error
    #commandPalette;
    #cache = new LRUCache(50);

    constructor() {
        this.#initDOM();
        this.#registerDefaultPlugins();
        this.#commandPalette = new CommandPalette(this, Array.from(this.#plugins.values()));
        this.#log("NEXUS OS V4 'TITAN' INITIALIZED. AWAITING COMMANDS.");
    }

    #initDOM() {
        document.getElementById('initBtn').addEventListener('click', () => this.init());
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.init();
        });
    }

    #registerDefaultPlugins() {
        this.registerPlugin(new DownloaderPlugin(this));
        this.registerPlugin(new MagicCopyPlugin(this));
        this.registerPlugin(new ContentAnalysisPlugin(this));
        this.registerPlugin(new ThemePlugin(this));
        this.registerPlugin(new SessionHistoryPlugin(this));
        // Add more plugins here
    }

    registerPlugin(plugin) {
        this.#plugins.set(plugin.name, plugin);
        this.#log(`PLUGIN REGISTERED: ${plugin.name}`);
    }

    getPlugin(name) {
        return this.#plugins.get(name);
    }

    #log(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const color = {
            info: '#00ff41',
            error: '#ff2a2a',
            warn: '#ffff00'
        }[type] || '#00ff41';

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span style="color:${color}">${msg}</span>`;
        this.#consoleEl.appendChild(entry);
        this.#consoleEl.scrollTop = this.#consoleEl.scrollHeight;
    }

    notify(msg, type = 'success') {
        const bg = type === 'error' ? "linear-gradient(to right, #ff5f6d, #ffc371)" : "linear-gradient(to right, #00b09b, #96c93d)";
        Toastify({
            text: msg,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: bg, boxShadow: "0 0 15px rgba(0,0,0,0.5)" }
        }).showToast();
    }

    async init() {
        const input = document.getElementById('urlInput').value.trim();
        const regex = /\/d\/([a-zA-Z0-9-_]+)/;
        const match = input.match(regex);

        if (match && match[1]) {
            this.#docId = match[1];
            this.#log(`TARGET IDENTIFIED: ${this.#docId}`);
            this.#log("INITIALIZING HANDSHAKE...");
            this.#setState('loading');
            try {
                await this.loadIframe('preview');
                this.notify("Target Locked");
                this.#setState('active');
                this.detectPages();
                this.getPlugin('sessionHistory').add(this.#docId, document.title);
            } catch (error) {
                this.#log(`ERROR: ${error.message}`, 'error');
                this.notify(error.message, "error");
                this.#setState('error');
            }
        } else {
            this.#log("ERROR: INVALID URL FORMAT", 'error');
            this.notify("Invalid URL", "error");
        }
    }

    async loadIframe(mode) {
        return new Promise((resolve, reject) => {
            if (!this.#docId) return reject(new Error("No document ID."));

            const cachedContent = this.#cache.get(this.#docId);
            if (cachedContent) {
                this.#log("LOADING FROM CACHE...");
                this.#iframe.srcdoc = cachedContent;
                resolve();
                return;
            }

            this.#loader.style.display = 'flex';
            this.#placeholder.style.display = 'none';
            this.#iframe.style.opacity = '0';

            const endpoint = mode;
            this.#log(`REQUESTING VIEW MODE: ${mode.toUpperCase()}...`);
            this.#iframe.src = `${this.#baseUrl}${this.#docId}/${endpoint}`;

            this.#iframe.onload = () => {
                this.#loader.style.display = 'none';
                this.#iframe.style.opacity = '1';
                this.#log("STREAM ESTABLISHED.", 'success');
                // In a real scenario, you'd fetch the content and then cache it.
                // this.#cache.put(this.#docId, fetchedContent);
                resolve();
            };

            this.#iframe.onerror = () => {
                this.#loader.style.display = 'none';
                this.#log("STREAM FAILED.", 'error');
                reject(new Error("Failed to load iframe."));
            };
        });
    }

    async detectPages() {
        setTimeout(async () => {
            this.#log("ANALYZING METADATA...");
            try {
                const response = await fetch(`${this.#baseUrl}${this.#docId}/export?format=txt`, { method: 'HEAD' });
                if (response.ok) {
                    this.#log("STATUS: 200 OK (PUBLIC/ACCESSIBLE)", 'success');
                    this.#log("PAGE ESTIMATION: READY IN .PDF EXPORT");
                } else {
                    this.#log("STATUS: RESTRICTED (VIEW ONLY)", 'warn');
                    this.#log("NOTE: Use 'Magic Copy' for restricted docs.");
                }
            } catch (error) {
                this.#log("CORS RESTRICTION DETECTED. SWITCHING TO PASSIVE MODE.", 'warn');
            }
        }, 1500);
    }

    #setState(newState) {
        this.#state = newState;
        this.#log(`STATE CHANGED: ${newState.toUpperCase()}`);
        document.body.setAttribute('data-state', newState);
    }

    get docId() {
        return this.#docId;
    }

    log(msg, type) {
        this.#log(msg, type);
    }
}

// --- PLUGINS ---

class Plugin {
    constructor(nexus, name) {
        this.nexus = nexus;
        this.name = name;
    }

    execute() {
        throw new Error("Plugin must implement execute method.");
    }
}

class DownloaderPlugin extends Plugin {
    constructor(nexus) {
        super(nexus, 'downloader');
    }

    download(format) {
        if (!this.nexus.docId) return;
        this.nexus.log(`GENERATING DOWNLOAD LINK: .${format.toUpperCase()}`);
        const url = `https://docs.google.com/document/d/${this.nexus.docId}/export?format=${format}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.nexus.notify(`Downloading .${format.toUpperCase()}`);
    }
}

class MagicCopyPlugin extends Plugin {
    constructor(nexus) {
        super(nexus, 'magicCopy');
    }

    execute() {
        if (!this.nexus.docId) return;

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
                this.nexus.log("EXECUTING MAGIC COPY BYPASS...");
                window.open(`https://docs.google.com/document/d/${this.nexus.docId}/mobilebasic`, '_blank');
            }
        });
    }
}

class ContentAnalysisPlugin extends Plugin {
    constructor(nexus) {
        super(nexus, 'contentAnalysis');
        this.worker = new Worker('analysis-worker.js');
    }

    execute() {
        if (!this.nexus.docId) return;
        this.nexus.log("ANALYZING CONTENT...");
        // In a real-world scenario, you'd extract the text and send it to the worker
        const text = "This is a long piece of text that we would analyze...";
        this.worker.postMessage({ text });
        this.worker.onmessage = (e) => {
            const { wordCount, charCount, sentiment } = e.data;
            this.nexus.log(`Word Count: ${wordCount}`);
            this.nexus.log(`Character Count: ${charCount}`);
            this.nexus.log(`Sentiment: ${sentiment.score > 0 ? 'Positive' : 'Negative'} (Score: ${sentiment.score})`);
        };
    }
}

class ThemePlugin extends Plugin {
    constructor(nexus) {
        super(nexus, 'theme');
        this.themes = {
            dark: {
                '--background-color': '#0a0a0a',
                '--text-color': '#f0f0f0',
                '--accent-color': '#00f3ff',
            },
            light: {
                '--background-color': '#f0f0f0',
                '--text-color': '#0a0a0a',
                '--accent-color': '#007bff',
            }
        };
    }

    setTheme(themeName) {
        const theme = this.themes[themeName];
        for (const [key, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(key, value);
        }
        this.nexus.log(`THEME CHANGED: ${themeName.toUpperCase()}`);
    }
}

class SessionHistoryPlugin extends Plugin {
    constructor(nexus) {
        super(nexus, 'sessionHistory');
        this.history = JSON.parse(localStorage.getItem('nexusHistory') || '[]');
    }

    add(id, title) {
        if (!this.history.find(item => item.id === id)) {
            this.history.push({ id, title, timestamp: Date.now() });
            localStorage.setItem('nexusHistory', JSON.stringify(this.history));
        }
    }

    getHistory() {
        return this.history;
    }
}

// --- ADVANCED FEATURES ---

class CommandPalette {
    constructor(nexus, plugins) {
        this.nexus = nexus;
        this.plugins = plugins;
        this.commands = this.#generateCommands();
        this.trie = new Trie();
        this.commands.forEach(cmd => this.trie.insert(cmd.name));
        this.init();
    }

    #generateCommands() {
        const commands = [];
        this.plugins.forEach(plugin => {
            if (typeof plugin.execute === 'function') {
                commands.push({ name: plugin.name, action: () => plugin.execute() });
            }
        });
        return commands;
    }

    init() {
        // DOM initialization for command palette
    }

    fuzzySearch(query) {
        // Levenshtein distance implementation
        // ...
    }
}

class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(key, value);
    }
}

class Trie {
    constructor() {
        this.root = {};
    }

    insert(word) {
        let node = this.root;
        for (const char of word) {
            if (!node[char]) {
                node[char] = {};
            }
            node = node[char];
        }
        node.isEnd = true;
    }

    search(word) {
        // ...
    }
}


const Nexus = new NexusSystem();

// You would also need an analysis-worker.js file for the Web Worker:
/*
// analysis-worker.js
self.onmessage = (e) => {
    const { text } = e.data;
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful'];
    let score = 0;
    text.split(/\s+/).forEach(word => {
        if (positiveWords.includes(word)) score++;
        if (negativeWords.includes(word)) score--;
    });
    self.postMessage({ wordCount, charCount, sentiment: { score } });
};
*/
