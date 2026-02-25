# Two-Way Markdown Studio

A clean, minimal, browser-based two-way markdown editor. Edit the markdown source or the rendered preview — both sides stay in sync at all times.

**Made by [Zenith Kandel](https://zenithkandel.com.np)**

---

## Features

| Feature               | Detail                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------- |
| Two-way sync          | Edit markdown → renders preview; edit preview → converts back to markdown via Turndown |
| Full markdown support | Headings, bold, italic, strikethrough, links, images, tables, code, blockquotes, HR    |
| Toolbar               | Grouped toolbar buttons for all formatting options                                     |
| Keyboard shortcuts    | `Ctrl/Cmd + B/I/U/K/\`` and `Ctrl/Cmd + S` to save                                     |
| File import           | Load `.md`, `.markdown`, `.txt` files from disk                                        |
| Export `.md`          | Download the markdown source as a `.md` file                                           |
| Export PDF            | Print-to-PDF with clean typography via a dedicated print window                        |
| Autosave              | Debounced autosave to `localStorage` every 800 ms                                      |
| Word & char count     | Live word and character count in the markdown pane header                              |
| Sanitisation          | All HTML output sanitised via DOMPurify before rendering                               |
| Responsive            | Single-column layout on mobile, side-by-side on desktop                                |

---

## Getting Started

No build step required. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

```
md-editor/
├── index.html   — markup and layout
├── style.css    — all styles (flat, minimal, themed)
├── app.js       — all logic (rendering, sync, I/O, shortcuts)
└── README.md    — this file
```

> **CDN dependencies** (loaded automatically, requires internet on first load):
>
> - [marked](https://cdn.jsdelivr.net/npm/marked/) — markdown → HTML
> - [DOMPurify](https://cdn.jsdelivr.net/npm/dompurify/) — XSS sanitisation
> - [Turndown](https://cdn.jsdelivr.net/npm/turndown/) — HTML → markdown (for preview edits)

---

## Keyboard Shortcuts

| Shortcut              | Action               |
| --------------------- | -------------------- |
| `Ctrl/Cmd + B`        | Bold                 |
| `Ctrl/Cmd + I`        | Italic               |
| `Ctrl/Cmd + U`        | Underline            |
| `Ctrl/Cmd + K`        | Insert link          |
| `Ctrl/Cmd + `` ` `` ` | Inline code          |
| `Ctrl/Cmd + S`        | Save to localStorage |

---

## Toolbar Buttons

**Headings:** H1, H2, H3  
**Inline:** Bold, Italic, Underline, Strikethrough  
**Insert:** Link, Image, Code, Code block  
**Block:** Bullet list, Numbered list, Blockquote, Table, Horizontal rule

---

## Action Bar

| Button     | Action                                                         |
| ---------- | -------------------------------------------------------------- |
| Load .md   | Open a markdown/text file from disk                            |
| Export .md | Download current content as `document.md`                      |
| Export PDF | Open a print-ready window and trigger the browser print dialog |
| Sample     | Load the built-in sample content                               |
| Clear      | Wipe both panes (with confirmation)                            |
| Save       | Manually save to localStorage                                  |

---

## Architecture

```
app.js
├── renderFromMarkdown()   textarea value → HTML preview
├── renderFromPreview()    preview HTML → textarea value (via Turndown)
├── applyFormat(format)    insert/wrap markdown syntax at cursor
├── handleShortcut(e)      keyboard shortcut dispatcher
├── loadFromFile(file)     FileReader → textarea → render
├── exportMarkdown()       Blob download of .md
├── exportPdf()            Print window with clean CSS
├── saveToLocal(markdown)  localStorage write
├── restoreFromLocal()     localStorage read on init
├── setStatus(text)        status bar with auto-clear
├── updateCounts()         word + char count update
└── debounce(fn, wait)     delay helper for autosave
```

---

## License

MIT — free to use, modify, and distribute.
