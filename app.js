(() => {
    const markdownInput = document.getElementById("markdownInput");
    const preview = document.getElementById("preview");
    const statusEl = document.getElementById("status");
    const filePicker = document.getElementById("filePicker");
    const loadFileBtn = document.getElementById("loadFileBtn");
    const exportMdBtn = document.getElementById("exportMdBtn");
    const exportPdfBtn = document.getElementById("exportPdfBtn");
    const resetSampleBtn = document.getElementById("resetSample");
    const clearAllBtn = document.getElementById("clearAll");
    const saveNowBtn = document.getElementById("saveNow");
    const formatButtons = document.querySelectorAll(".tool-btn");

    const STORAGE_KEY = "two-way-markdown";
    const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
    });
    const sanitizeOptions = { ALLOWED_ATTR: ["href", "src", "alt", "title"] };
    let isSyncing = false;

    marked.setOptions({ gfm: true, breaks: true });

    const starterMarkdown = `# All your markdown in one place

Welcome to the two-way markdown studio. Edit either side and everything stays synced.

## Features
- Two-way editing: markdown \u2194 preview
- Tables, images, lists, code blocks
- Local storage autosave
- Keyboard shortcuts: Ctrl/Cmd + B, I, U
- File import/export and PDF

| Service | Status | Notes |
| --- | --- | --- |
| Stripe | Paid | Invoice #4521 paid — $2,400.00 |
| GitHub | PR merged | Added webhook retry logic #287 |
| Vercel | Deploy | Production deployment successful |

> Tip: Edit this preview directly to push changes back to markdown.

![Example illustration](https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80)


### Code
\`\`\`
console.log('Hello, markdown');
\`\`\`
`;

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function saveToLocal(markdown) {
        localStorage.setItem(STORAGE_KEY, markdown);
        setStatus("Saved locally");
    }

    function renderFromMarkdown() {
        if (isSyncing) return;
        isSyncing = true;
        const raw = markdownInput.value;
        const html = DOMPurify.sanitize(marked.parse(raw));
        preview.innerHTML = html;
        saveToLocal(raw);
        setStatus("Updated preview from markdown");
        isSyncing = false;
    }

    function renderFromPreview() {
        if (isSyncing) return;
        isSyncing = true;
        const markdown = turndownService.turndown(preview.innerHTML);
        markdownInput.value = markdown;
        saveToLocal(markdown);
        setStatus("Updated markdown from preview");
        isSyncing = false;
    }

    function applyFormat(format) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const value = markdownInput.value;
        const selected = value.slice(start, end) || "text";
        let replacement = selected;

        switch (format) {
            case "bold":
                replacement = `**${selected}**`;
                break;
            case "italic":
                replacement = `*${selected}*`;
                break;
            case "underline":
                replacement = `<u>${selected}</u>`;
                break;
            case "link":
                replacement = `[${selected}](https://example.com)`;
                break;
            case "list":
                replacement = `- ${selected.split("\n").join("\n- ")}`;
                break;
            case "quote":
                replacement = `> ${selected.split("\n").join("\n> ")}`;
                break;
            case "code":
                replacement = `\`${selected}\``;
                break;
            case "table":
                replacement = `| Column A | Column B |
| --- | --- |
| Value 1 | Value 2 |
| Value 3 | Value 4 |`;
                break;
            case "image":
                replacement = `![Alt text](https://placekitten.com/800/400)`;
                break;
            default:
                break;
        }

        const newValue = value.slice(0, start) + replacement + value.slice(end);
        markdownInput.value = newValue;
        const cursor = start + replacement.length;
        markdownInput.setSelectionRange(cursor, cursor);
        markdownInput.focus();
        renderFromMarkdown();
    }

    function handleShortcut(e) {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const meta = isMac ? e.metaKey : e.ctrlKey;
        if (!meta) return;
        const key = e.key.toLowerCase();
        if (["b", "i", "u"].includes(key)) {
            e.preventDefault();
            applyFormat({ b: "bold", i: "italic", u: "underline" }[key]);
        }
    }

    function loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            markdownInput.value = evt.target.result;
            renderFromMarkdown();
        };
        reader.readAsText(file);
    }

    function exportMarkdown() {
        const blob = new Blob([markdownInput.value], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "document.md";
        anchor.click();
        URL.revokeObjectURL(url);
        setStatus("Exported markdown");
    }

    function exportPdf() {
        const win = window.open("", "_blank");
        const styles = `<style>body{font-family:'Work Sans',sans-serif;margin:32px;background:#fff;color:#111;} h1,h2,h3{font-family:'Playfair Display',serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;} img{max-width:100%;border-radius:8px;} pre{background:#f0e9de;padding:12px;border-radius:10px;}</style>`;
        win.document.write(
            `<html><head><title>Preview PDF</title>${styles}</head><body>${preview.innerHTML}</body></html>`,
        );
        win.document.close();
        win.focus();
        win.print();
        win.close();
        setStatus("Opened print dialog");
    }

    function restoreFromLocal() {
        const saved = localStorage.getItem(STORAGE_KEY);
        markdownInput.value = saved || starterMarkdown;
        renderFromMarkdown();
    }

    // Events
    markdownInput.addEventListener("input", renderFromMarkdown);
    markdownInput.addEventListener("keydown", handleShortcut);

    preview.addEventListener("input", () => {
        preview.innerHTML = DOMPurify.sanitize(preview.innerHTML, sanitizeOptions);
        renderFromPreview();
    });

    loadFileBtn.addEventListener("click", () => filePicker.click());
    filePicker.addEventListener("change", (e) => {
        const [file] = e.target.files || [];
        if (file) loadFromFile(file);
        e.target.value = "";
    });

    exportMdBtn.addEventListener("click", exportMarkdown);
    exportPdfBtn.addEventListener("click", exportPdf);

    resetSampleBtn.addEventListener("click", () => {
        markdownInput.value = starterMarkdown;
        renderFromMarkdown();
    });

    clearAllBtn.addEventListener("click", () => {
        markdownInput.value = "";
        preview.innerHTML = "";
        saveToLocal("");
        setStatus("Cleared");
    });

    saveNowBtn.addEventListener("click", () => saveToLocal(markdownInput.value));

    formatButtons.forEach((btn) => {
        btn.addEventListener("click", () => applyFormat(btn.dataset.format));
    });

    restoreFromLocal();
})();
