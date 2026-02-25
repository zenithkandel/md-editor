/**
 * Two-Way Markdown Studio
 * ========================
 * Author  : Zenith Kandel (https://zenithkandel.com.np)
 * Version : 2.0.0
 *
 * Architecture
 * ------------
 * - renderFromMarkdown()  textarea  → HTML preview   (markdown is source of truth)
 * - renderFromPreview()   preview   → textarea        (contenteditable is source of truth)
 * - applyFormat(format)   inserts markdown syntax at cursor / around selection
 * - handleShortcut(e)     keyboard shortcut dispatcher
 * - File I/O              loadFromFile(), exportMarkdown(), exportPdf()
 * - Persistence           saveToLocal(), restoreFromLocal()
 * - UX helpers            setStatus(), updateCounts(), debounce()
 *
 * Keyboard Shortcuts
 * ------------------
 *   Ctrl/Cmd + B  →  Bold
 *   Ctrl/Cmd + I  →  Italic
 *   Ctrl/Cmd + U  →  Underline
 *   Ctrl/Cmd + K  →  Link
 *   Ctrl/Cmd + `  →  Inline code
 *   Ctrl/Cmd + S  →  Save to localStorage
 */

(() => {
  /* ──────────── DOM references ──────────── */
  const markdownInput  = document.getElementById("markdownInput");
  const preview        = document.getElementById("preview");
  const statusEl       = document.getElementById("status");
  const wordCountEl    = document.getElementById("wordCount");
  const charCountEl    = document.getElementById("charCount");
  const filePicker     = document.getElementById("filePicker");
  const loadFileBtn    = document.getElementById("loadFileBtn");
  const exportMdBtn    = document.getElementById("exportMdBtn");
  const exportPdfBtn   = document.getElementById("exportPdfBtn");
  const resetSampleBtn = document.getElementById("resetSample");
  const clearAllBtn    = document.getElementById("clearAll");
  const saveNowBtn     = document.getElementById("saveNow");
  const formatButtons  = document.querySelectorAll(".tool-btn");

  /* ──────────── Constants + state ──────────── */
  const STORAGE_KEY = "two-way-markdown";

  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  const SANITIZE_OPTS = {
    ALLOWED_TAGS: [
      "h1","h2","h3","h4","h5","h6",
      "p","br","strong","em","u","s","del","ins","mark","code","pre",
      "ul","ol","li","blockquote","hr","a","img",
      "table","thead","tbody","tr","th","td",
      "span","div","figure","figcaption",
    ],
    ALLOWED_ATTR: ["href","src","alt","title","class","id","target","rel"],
  };

  let isSyncing = false;

  marked.setOptions({ gfm: true, breaks: true });

  /* ──────────── Starter content ──────────── */
  const STARTER_MARKDOWN = [
    "# All your markdown in one place",
    "",
    "Welcome to the **Two-Way Markdown Studio**. Edit either side — both stay in sync.",
    "",
    "## Features",
    "- Two-way editing: markdown \u2194 preview",
    "- Tables, images, lists, code blocks",
    "- Local storage autosave",
    "- Keyboard shortcuts: `Ctrl/Cmd + B`, `I`, `U`, `K`, `` ` ``",
    "- File import/export and PDF",
    "- Live word & character count",
    "",
    "## Quick Reference",
    "",
    "| Syntax | Output |",
    "| --- | --- |",
    "| `**bold**` | **bold** |",
    "| `*italic*` | *italic* |",
    "| `~~strike~~` | ~~strike~~ |",
    "| `` `code` `` | `code` |",
    "",
    "> **Tip:** Click directly inside the preview on the right and edit — changes sync back to markdown.",
    "",
    "![Illustration](https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80)",
    "",
    "### Code block",
    "```js",
    "const editor = document.getElementById('markdownInput');",
    "editor.addEventListener('input', render);",
    "```",
    "",
    "---",
    "",
    "_Made with \u2665 by [Zenith Kandel](https://zenithkandel.com.np)_",
  ].join("\n");

  /* ──────────── Utilities ──────────── */

  /** Safe addEventListener — no-ops if el is null */
  function on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }

  /** Debounce: delays fn by `wait` ms, resets on each call */
  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /** Display a transient status message, auto-clears after 3 s */
  function setStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text;
    clearTimeout(statusEl._timer);
    statusEl._timer = setTimeout(() => {
      statusEl.textContent = "Ready";
    }, 3000);
  }

  /** Update live word and character counts */
  function updateCounts() {
    const text  = markdownInput ? markdownInput.value : "";
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    if (wordCountEl) wordCountEl.textContent = `${words} word${words !== 1 ? "s" : ""}`;
    if (charCountEl) charCountEl.textContent = `${chars} char${chars !== 1 ? "s" : ""}`;
  }

  /* ──────────── Persistence ──────────── */

  function saveToLocal(markdown) {
    try {
      localStorage.setItem(STORAGE_KEY, markdown);
      setStatus("Saved");
    } catch (_) {
      setStatus("Save failed — storage full");
    }
  }

  const debouncedSave = debounce(saveToLocal, 800);

  function restoreFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (markdownInput) {
      markdownInput.value = saved !== null ? saved : STARTER_MARKDOWN;
    }
    renderFromMarkdown();
  }

  /* ──────────── Render: markdown → preview ──────────── */

  function renderFromMarkdown() {
    if (isSyncing) return;
    isSyncing = true;

    const raw  = markdownInput ? markdownInput.value : "";
    const html = DOMPurify.sanitize(marked.parse(raw), SANITIZE_OPTS);

    if (preview) {
      const prevScroll  = preview.scrollTop;
      preview.innerHTML = html;
      preview.scrollTop = prevScroll;
    }

    updateCounts();
    debouncedSave(raw);
    setStatus("Preview updated");
    isSyncing = false;
  }

  /* ──────────── Render: preview → markdown ──────────── */

  function renderFromPreview() {
    if (isSyncing) return;
    isSyncing = true;

    if (preview && markdownInput) {
      const sanitized  = DOMPurify.sanitize(preview.innerHTML, SANITIZE_OPTS);
      const markdown   = turndownService.turndown(sanitized);
      const prevScroll = markdownInput.scrollTop;
      const selStart   = markdownInput.selectionStart;
      const selEnd     = markdownInput.selectionEnd;

      markdownInput.value       = markdown;
      markdownInput.scrollTop   = prevScroll;
      try { markdownInput.setSelectionRange(selStart, selEnd); } catch (_) {}

      updateCounts();
      debouncedSave(markdown);
      setStatus("Markdown updated from preview");
    }

    isSyncing = false;
  }

  /* ──────────── Formatting helpers ──────────── */

  const FORMATS = {
    bold:      (s) => `**${s}**`,
    italic:    (s) => `*${s}*`,
    underline: (s) => `<u>${s}</u>`,
    strike:    (s) => `~~${s}~~`,
    link:      (s) => `[${s}](https://example.com)`,
    code:      (s) => `\`${s}\``,
    codeblock: (s) => "```\n" + s + "\n```",
    h1:        (s) => `# ${s}`,
    h2:        (s) => `## ${s}`,
    h3:        (s) => `### ${s}`,
    list:      (s) => s.split("\n").map((l) => `- ${l}`).join("\n"),
    olist:     (s) => s.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n"),
    quote:     (s) => s.split("\n").map((l) => `> ${l}`).join("\n"),
    hr:        ()  => "\n\n---\n\n",
    image:     (s) => `![${s}](https://images.unsplash.com/photo-1557683316-973673baf926?w=800)`,
    table:     ()  => "| Column A | Column B | Column C |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |",
  };

  function applyFormat(format) {
    if (!markdownInput) return;
    const fn = FORMATS[format];
    if (!fn) return;

    const start       = markdownInput.selectionStart;
    const end         = markdownInput.selectionEnd;
    const value       = markdownInput.value;
    const selected    = value.slice(start, end) || "text";
    const replacement = fn(selected);
    const newValue    = value.slice(0, start) + replacement + value.slice(end);

    markdownInput.value = newValue;
    const cursor = start + replacement.length;
    try { markdownInput.setSelectionRange(cursor, cursor); } catch (_) {}
    markdownInput.focus();
    renderFromMarkdown();
  }

  /* ──────────── Keyboard shortcuts ──────────── */

  function handleShortcut(e) {
    const isMac = /mac/i.test(navigator.platform);
    const meta  = isMac ? e.metaKey : e.ctrlKey;
    if (!meta) return;

    const shortcutMap = {
      b: "bold",
      i: "italic",
      u: "underline",
      k: "link",
      "`": "code",
    };

    const key = e.key.toLowerCase();

    if (key === "s") {
      e.preventDefault();
      saveToLocal(markdownInput ? markdownInput.value : "");
      return;
    }

    if (key in shortcutMap) {
      e.preventDefault();
      applyFormat(shortcutMap[key]);
    }
  }

  /* ──────────── File I/O ──────────── */

  function loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (markdownInput) markdownInput.value = evt.target.result;
      renderFromMarkdown();
      setStatus(`Loaded: ${file.name}`);
    };
    reader.onerror = () => setStatus("Error reading file");
    reader.readAsText(file);
  }

  function exportMarkdown() {
    if (!markdownInput) return;
    const blob   = new Blob([markdownInput.value], { type: "text/markdown;charset=utf-8" });
    const url    = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement("a"), { href: url, download: "document.md" });
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Exported document.md");
  }

  function exportPdf() {
    if (!preview) return;
    const win = window.open("", "_blank");
    if (!win) { setStatus("Popup blocked — allow popups for PDF export"); return; }

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Work Sans', sans-serif; margin: 48px; background: #fff; color: #111; line-height: 1.7; }
        h1, h2, h3, h4 { font-family: 'Playfair Display', serif; margin-top: 1.4em; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; }
        img { max-width: 100%; border-radius: 8px; }
        pre { background: #f5f0ea; padding: 14px; border-radius: 8px; overflow: auto; }
        code { background: #f5f0ea; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
        blockquote { border-left: 3px solid #b24d2d; padding-left: 14px; color: #706b64; margin: 16px 0; }
        a { color: #b24d2d; }
        @page { margin: 0; }
      </style>`;

    win.document.write(`<!DOCTYPE html><html><head><title>Document</title>${styles}</head><body>${preview.innerHTML}</body></html>`);
    win.document.close();
    win.addEventListener("load", () => { win.focus(); win.print(); });
    setStatus("Print dialog opened");
  }

  /* ──────────── Event bindings ──────────── */

  on(markdownInput, "input",   renderFromMarkdown);
  on(markdownInput, "keydown", handleShortcut);

  on(preview, "input", renderFromPreview);

  on(preview, "paste", (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const safe = DOMPurify.sanitize(html || text, SANITIZE_OPTS);
    document.execCommand("insertHTML", false, safe);
  });

  formatButtons.forEach((btn) => on(btn, "click", () => applyFormat(btn.dataset.format)));

  on(loadFileBtn,    "click", () => filePicker && filePicker.click());
  on(exportMdBtn,    "click", exportMarkdown);
  on(exportPdfBtn,   "click", exportPdf);
  on(saveNowBtn,     "click", () => saveToLocal(markdownInput ? markdownInput.value : ""));

  on(clearAllBtn, "click", () => {
    if (!markdownInput || !preview) return;
    if (!confirm("Clear everything? This cannot be undone.")) return;
    markdownInput.value = "";
    preview.innerHTML   = "";
    saveToLocal("");
    updateCounts();
    setStatus("Cleared");
  });

  on(resetSampleBtn, "click", () => {
    if (!markdownInput) return;
    markdownInput.value = STARTER_MARKDOWN;
    renderFromMarkdown();
    setStatus("Sample content loaded");
  });

  on(filePicker, "change", (e) => {
    const [file] = e.target.files || [];
    if (file) loadFromFile(file);
    e.target.value = "";
  });

  /* ──────────── Init ──────────── */
  restoreFromLocal();
})();
