import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Font list ────────────────────────────────────────────────────────────────
const FONTS = [
  'Abril Fatface','Alegreya','Anton','Archivo','Arvo',
  'Bebas Neue','Bitter','Cabin','Cinzel','Cinzel Decorative',
  'Comfortaa','Cormorant Garamond','Courier Prime','Crimson Text',
  'Dancing Script','DM Sans','DM Serif Display','Exo 2',
  'Fira Code','Fira Sans','Fjalla One','Fredoka One',
  'Geologica','IBM Plex Mono','IBM Plex Sans','IBM Plex Serif',
  'IM Fell English','Inconsolata','Josefin Sans','Karla','Lato',
  'Libre Baskerville','Libre Franklin','Lora','Merriweather',
  'Montserrat','Noto Sans','Noto Serif','Nunito','Open Sans',
  'Oswald','Oxygen','Pacifico','Playfair Display','Poppins',
  'PT Sans','PT Serif','Quicksand','Raleway','Roboto',
  'Roboto Condensed','Roboto Mono','Roboto Slab','Rubik',
  'Secular One','Source Code Pro','Source Sans 3','Space Grotesk',
  'Space Mono','Spectral','Syne','Teko','Titillium Web',
  'Ubuntu','Unbounded','Uncial Antiqua','Work Sans','Zilla Slab',
];

const FONT_SIZES = ['8','10','11','12','13','14','16','18','20','24','28','32','36','42','48','56','64','72','96'];

const LINE_HEIGHTS = ['1','1.2','1.4','1.5','1.6','1.8','2','2.5'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildFontsUrl(fonts) {
  return 'https://fonts.googleapis.com/css2?family=' +
    fonts.map(f => f.replace(/ /g, '+')).join('&family=') +
    '&display=swap';
}

export default function Notepad() {
  // Editor state
  const [font, setFont]           = useState('IM Fell English');
  const [fontSize, setFontSize]   = useState('16');
  const [lineH, setLineH]         = useState('1.6');
  const [bold, setBold]           = useState(false);
  const [italic, setItalic]       = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike]       = useState(false);
  const [align, setAlign]         = useState('left');
  const [fgColor, setFgColor]     = useState('#d4ccbc');
  const [hlColor, setHlColor]     = useState('transparent');

  // UI state
  const [fontOpen, setFontOpen]       = useState(false);
  const [fontFilter, setFontFilter]   = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [showLoad, setShowLoad]       = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const [toast, setToast]             = useState(null);
  const [matchCase, setMatchCase]     = useState(false);

  // Document state
  const [title, setTitle]       = useState('Untitled');
  const [savedNotes, setSaved]  = useState([]);
  const [autoSave, setAutoSave] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Search/replace
  const [searchVal, setSearchVal]   = useState('');
  const [replaceVal, setReplaceVal] = useState('');

  // Refs
  const editorRef    = useRef(null);
  const savedRangeRef = useRef(null);
  const imgInputRef  = useRef(null);
  const fontListRef  = useRef(null);
  const autoSaveTimer = useRef(null);

  // ── Font loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = buildFontsUrl(FONTS);
    document.head.appendChild(link);

    // Load saved docs list
    const stored = JSON.parse(localStorage.getItem('darkpad_notes') || '[]');
    setSaved(stored);

    // Load last doc
    const last = localStorage.getItem('darkpad_last');
    if (last) {
      try {
        const doc = JSON.parse(last);
        setTitle(doc.title || 'Untitled');
        if (editorRef.current) editorRef.current.innerHTML = doc.content || '';
        updateCounts();
      } catch (_) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSave) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (editorRef.current) {
        localStorage.setItem('darkpad_last', JSON.stringify({
          title,
          content: editorRef.current.innerHTML,
          date: new Date().toISOString(),
        }));
      }
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, autoSave]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-font-picker]')) setFontOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Word / char count ────────────────────────────────────────────────────
  const updateCounts = useCallback(() => {
    const text = editorRef.current?.innerText || '';
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  // ── Cursor range save/restore ─────────────────────────────────────────────
  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // ── execCommand wrapper ───────────────────────────────────────────────────
  const exec = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }, []);

  // ── Toolbar actions ───────────────────────────────────────────────────────
  const applyFont = (f) => {
    setFont(f);
    setFontOpen(false);
    setFontFilter('');
    restoreRange();
    exec('fontName', f);
    editorRef.current?.focus();
  };

  const applyFontSize = (sz) => {
    setFontSize(sz);
    restoreRange();
    editorRef.current?.focus();
    // execCommand fontSize maps 1-7; we bypass it and use font tag hack then fix
    exec('fontSize', 7);
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      el.removeAttribute('size');
      el.style.fontSize = sz + 'px';
    });
  };

  const toggleBold = () => { setBold(b => !b); exec('bold'); };
  const toggleItalic = () => { setItalic(i => !i); exec('italic'); };
  const toggleUnderline = () => { setUnderline(u => !u); exec('underline'); };
  const toggleStrike = () => { setStrike(s => !s); exec('strikeThrough'); };

  const applyAlign = (a) => {
    setAlign(a);
    const map = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' };
    exec(map[a]);
  };

  const applyFgColor = (c) => {
    setFgColor(c);
    restoreRange();
    exec('foreColor', c);
  };

  const applyHlColor = (c) => {
    setHlColor(c);
    restoreRange();
    exec('hiliteColor', c);
  };

  const applyLineHeight = (lh) => {
    setLineH(lh);
    if (editorRef.current) editorRef.current.style.lineHeight = lh;
  };

  const insertHr = () => exec('insertHorizontalRule');
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };
  const removeFormat = () => exec('removeFormat');

  // ── Image insert at cursor ────────────────────────────────────────────────
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      restoreRange();
      editorRef.current?.focus();
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.cssText = 'max-width:100%;display:inline-block;vertical-align:middle;';
      img.contentEditable = 'false';
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editorRef.current.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Save / Load ───────────────────────────────────────────────────────────
  const saveNote = (asNew = false) => {
    const content = editorRef.current?.innerHTML || '';
    let t = title;
    if (asNew) {
      const entered = prompt('Save as:', title);
      if (!entered) return;
      t = entered;
      setTitle(t);
    }
    const stored = JSON.parse(localStorage.getItem('darkpad_notes') || '[]');
    const idx = stored.findIndex(n => n.title === t);
    const note = { title: t, content, date: new Date().toISOString() };
    if (idx >= 0) stored[idx] = note;
    else stored.unshift(note);
    localStorage.setItem('darkpad_notes', JSON.stringify(stored));
    setSaved(stored);
    showToast('✦ Saved to vault');
  };

  const loadNote = (note) => {
    setTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content;
      updateCounts();
    }
    setShowLoad(false);
    showToast('✦ Document loaded');
  };

  const deleteNote = (title, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"?`)) return;
    const stored = JSON.parse(localStorage.getItem('darkpad_notes') || '[]');
    const updated = stored.filter(n => n.title !== title);
    localStorage.setItem('darkpad_notes', JSON.stringify(updated));
    setSaved(updated);
  };

  const newDoc = () => {
    if (!confirm('Clear editor and start new document?')) return;
    setTitle('Untitled');
    if (editorRef.current) editorRef.current.innerHTML = '';
    updateCounts();
  };

  // ── Search & Replace ──────────────────────────────────────────────────────
  const doFind = () => {
    if (!searchVal || !editorRef.current) return;
    const text = editorRef.current.innerHTML;
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = text.replace(new RegExp(escaped, flags),
      m => `<mark style="background:#8b1a1a;color:#fff;padding:0 2px">${m}</mark>`);
    editorRef.current.innerHTML = highlighted;
  };

  const doReplace = () => {
    if (!searchVal || !editorRef.current) return;
    const flags = matchCase ? '' : 'i';
    const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    editorRef.current.innerHTML = editorRef.current.innerHTML.replace(
      new RegExp(escaped, flags), replaceVal);
    showToast('Replaced 1 occurrence');
  };

  const doReplaceAll = () => {
    if (!searchVal || !editorRef.current) return;
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, flags);
    const orig = editorRef.current.innerHTML;
    const count = (orig.match(regex) || []).length;
    editorRef.current.innerHTML = orig.replace(regex, replaceVal);
    showToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);
  };

  const clearHighlights = () => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('mark').forEach(m => {
      m.replaceWith(document.createTextNode(m.textContent));
    });
  };

  // ── Exports ───────────────────────────────────────────────────────────────
  const exportTxt = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    dl(blob, `${title}.txt`);
    showToast('✦ Exported as .txt');
  };

  const exportHtml = () => {
    const content = editorRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${FONTS.map(f=>f.replace(/ /g,'+')).join('&family=')}&display=swap">
<style>body{background:#080808;color:#d4ccbc;font-family:'${font}',serif;font-size:${fontSize}px;line-height:${lineH};padding:40px;max-width:800px;margin:0 auto;}img{max-width:100%}a{color:#b8860b}</style>
</head>
<body>${content}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    dl(blob, `${title}.html`);
    showToast('✦ Exported as .html');
  };

  const exportPdf = async () => {
    showToast('Building PDF…');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const text = editorRef.current?.innerText || '';
      doc.setFontSize(parseInt(fontSize, 10) || 12);
      const lines = doc.splitTextToSize(text, 180);
      let y = 20;
      lines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, 15, y);
        y += (parseInt(fontSize, 10) || 12) * 0.5;
      });
      doc.save(`${title}.pdf`);
      showToast('✦ Exported as .pdf');
    } catch (err) {
      showToast('PDF export failed: ' + err.message, true);
    }
  };

  const exportSlides = () => {
    const text = editorRef.current?.innerText || '';
    const slides = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    const fontLink = buildFontsUrl([font]);
    const slidesHtml = slides.map((s, i) =>
      `<section class="slide" id="s${i}">${s.replace(/\n/g, '<br>')}</section>`
    ).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Slides</title>
<link rel="stylesheet" href="${fontLink}">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080808;font-family:'${font}',serif;color:#d4ccbc;overflow:hidden;height:100vh}
.slide{display:none;position:absolute;inset:0;padding:80px 10%;align-items:center;justify-content:center;flex-direction:column;text-align:center;font-size:clamp(18px,2.5vw,28px);line-height:1.7;opacity:0;transition:opacity .5s}
.slide.active{display:flex;opacity:1}
.slide:first-child{font-size:clamp(24px,4vw,48px);font-weight:700}
nav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:10}
nav button{background:#8b1a1a;color:#f0e8d8;border:none;padding:10px 18px;font-family:'Cinzel',serif;font-size:13px;letter-spacing:.1em;cursor:pointer;transition:background .2s}
nav button:hover{background:#c0392b}
.counter{position:fixed;bottom:24px;left:24px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:.15em;color:#4a4540}
.progress{position:fixed;top:0;left:0;height:2px;background:#8b1a1a;transition:width .4s}
.title-bar{position:fixed;top:0;left:0;right:0;padding:10px 20px;background:rgba(8,8,8,.9);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;color:#3a3530;text-align:center}
</style>
</head>
<body>
<div class="title-bar">${title.toUpperCase()}</div>
<div class="progress" id="prog"></div>
${slidesHtml}
<nav>
  <button onclick="prev()">◀ PREV</button>
  <button onclick="next()">NEXT ▶</button>
</nav>
<div class="counter" id="ctr">1 / ${slides.length}</div>
<script>
let cur=0;
const all=document.querySelectorAll('.slide');
const prog=document.getElementById('prog');
const ctr=document.getElementById('ctr');
function show(n){
  all.forEach(s=>s.classList.remove('active'));
  all[n].classList.add('active');
  ctr.textContent=(n+1)+' / '+all.length;
  prog.style.width=((n+1)/all.length*100)+'%';
}
function next(){if(cur<all.length-1)show(++cur)}
function prev(){if(cur>0)show(--cur)}
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key===' ')next();
  if(e.key==='ArrowLeft')prev();
});
show(0);
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    dl(blob, `${title}_slides.html`);
    showToast(`✦ ${slides.length} slides exported`);
  };

  function dl(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toastTimer = useRef(null);
  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Filtered fonts ────────────────────────────────────────────────────────
  const filteredFonts = FONTS.filter(f =>
    f.toLowerCase().includes(fontFilter.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{title} — DarkPad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hidden file inputs */}
      <input ref={imgInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleImageFile} />

      {/* ── MAIN GRID LAYOUT ─────────────────────────────────────────────── */}
      <div style={S.root}>

        {/* ── ROW 1: TOOLBAR (600x100px) ───────────────────────────────── */}
        <div style={S.toolbarRow}>
          <div style={S.toolbar}>

            {/* Brand / back */}
            <Link href="/" style={S.brand} title="Back to splash">⬛</Link>

            {/* New / Save / Load */}
            <div style={S.group}>
              <TBtn onClick={newDoc} title="New">🗋</TBtn>
              <TBtn onClick={() => saveNote(false)} title="Save (Ctrl+S)">💾</TBtn>
              <TBtn onClick={() => saveNote(true)} title="Save As">💾+</TBtn>
              <TBtn onClick={() => setShowLoad(l => !l)} title="Load" active={showLoad}>📂</TBtn>
            </div>

            <Divider />

            {/* Font picker */}
            <div style={S.fontPickerWrap} data-font-picker>
              <button
                style={{ ...S.fontPickerBtn, fontFamily: `'${font}', serif` }}
                onClick={() => { saveRange(); setFontOpen(o => !o); }}
                title="Font family"
              >
                <span style={{ fontFamily: `'${font}', serif` }}>{font}</span>
                <span style={S.arrow}>{fontOpen ? '▲' : '▼'}</span>
              </button>
              {fontOpen && (
                <div style={S.fontDropdown}>
                  <input
                    style={S.fontSearch}
                    placeholder="Search fonts…"
                    value={fontFilter}
                    onChange={e => setFontFilter(e.target.value)}
                    autoFocus
                  />
                  <div style={S.fontList} ref={fontListRef}>
                    {filteredFonts.map(f => (
                      <div
                        key={f}
                        style={{
                          ...S.fontItem,
                          fontFamily: `'${f}', serif`,
                          background: f === font ? 'rgba(139,26,26,0.25)' : 'transparent',
                          color: f === font ? '#d4a017' : '#d4ccbc',
                        }}
                        onMouseDown={() => applyFont(f)}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Font size */}
            <select
              style={S.sizeSelect}
              value={fontSize}
              onChange={e => applyFontSize(e.target.value)}
              title="Font size"
            >
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>

            <Divider />

            {/* Format buttons */}
            <TBtn onClick={toggleBold} active={bold} title="Bold"><b>B</b></TBtn>
            <TBtn onClick={toggleItalic} active={italic} title="Italic"><i>I</i></TBtn>
            <TBtn onClick={toggleUnderline} active={underline} title="Underline"><u>U</u></TBtn>
            <TBtn onClick={toggleStrike} active={strike} title="Strikethrough"><s>S</s></TBtn>

            <Divider />

            {/* Alignment */}
            <TBtn onClick={() => applyAlign('left')} active={align==='left'} title="Align Left">⬅</TBtn>
            <TBtn onClick={() => applyAlign('center')} active={align==='center'} title="Center">↔</TBtn>
            <TBtn onClick={() => applyAlign('right')} active={align==='right'} title="Align Right">➡</TBtn>
            <TBtn onClick={() => applyAlign('justify')} active={align==='justify'} title="Justify">⇔</TBtn>

            <Divider />

            {/* Colors */}
            <label style={S.colorWrap} title="Text color">
              <span style={{ ...S.colorSwatch, background: fgColor, border: '2px solid #4a4540' }} />
              <input type="color" value={fgColor} style={{ width: 0, opacity: 0, position: 'absolute' }}
                onChange={e => { saveRange(); applyFgColor(e.target.value); }} />
              <span style={S.colorLabel}>A</span>
            </label>
            <label style={S.colorWrap} title="Highlight color">
              <span style={{ ...S.colorSwatch, background: hlColor === 'transparent' ? '#222' : hlColor, border: '2px solid #4a4540' }} />
              <input type="color" value={hlColor === 'transparent' ? '#ffff00' : hlColor}
                style={{ width: 0, opacity: 0, position: 'absolute' }}
                onChange={e => { saveRange(); applyHlColor(e.target.value); }} />
              <span style={S.colorLabel}>H</span>
            </label>

            <Divider />

            {/* Line height */}
            <select style={S.sizeSelect} value={lineH}
              onChange={e => applyLineHeight(e.target.value)} title="Line height">
              {LINE_HEIGHTS.map(h => <option key={h} value={h}>{h}× LH</option>)}
            </select>

            <Divider />

            {/* More tools */}
            <TBtn onClick={() => { saveRange(); imgInputRef.current?.click(); }} title="Insert Image">🖼</TBtn>
            <TBtn onClick={insertLink} title="Insert Link">🔗</TBtn>
            <TBtn onClick={insertHr} title="Horizontal Rule">━</TBtn>
            <TBtn onClick={removeFormat} title="Remove Formatting">✕Fmt</TBtn>

            <Divider />

            {/* Search & Replace */}
            <TBtn onClick={() => setShowSearch(s => !s)} active={showSearch} title="Search & Replace">🔍</TBtn>

            {/* Export */}
            <div style={{ position: 'relative' }}>
              <TBtn onClick={() => setShowExport(e => !e)} active={showExport} title="Export">⬇</TBtn>
              {showExport && (
                <div style={S.exportMenu}>
                  <ExportItem onClick={() => { exportTxt(); setShowExport(false); }}>
                    📄 Export .txt
                  </ExportItem>
                  <ExportItem onClick={() => { exportHtml(); setShowExport(false); }}>
                    🌐 Export .html
                  </ExportItem>
                  <ExportItem onClick={() => { exportPdf(); setShowExport(false); }}>
                    📕 Export .pdf
                  </ExportItem>
                  <ExportItem onClick={() => { exportSlides(); setShowExport(false); }}>
                    🎞 Export Slides
                  </ExportItem>
                </div>
              )}
            </div>

            {/* Auto-save toggle */}
            <TBtn
              onClick={() => setAutoSave(a => !a)}
              active={autoSave}
              title={autoSave ? 'Auto-save ON' : 'Auto-save OFF'}
              style={{ fontSize: 9, letterSpacing: '0.05em' }}
            >
              AUTO
            </TBtn>

            {/* Title input */}
            <input
              style={S.titleInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Untitled"
              title="Document title"
            />
          </div>
        </div>

        {/* ── SEARCH & REPLACE PANEL ────────────────────────────────────── */}
        {showSearch && (
          <div style={S.searchPanel}>
            <div style={S.searchRow}>
              <span style={S.searchLabel}>FIND</span>
              <input style={S.searchInput} value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search text, symbols, characters…"
                onKeyDown={e => e.key === 'Enter' && doFind()} />
              <label style={S.caseToggle}>
                <input type="checkbox" checked={matchCase}
                  onChange={e => setMatchCase(e.target.checked)} style={{ marginRight: 4 }} />
                Aa
              </label>
              <SBtn onClick={doFind}>Find</SBtn>
              <SBtn onClick={clearHighlights}>Clear</SBtn>
            </div>
            <div style={S.searchRow}>
              <span style={S.searchLabel}>REPLACE</span>
              <input style={S.searchInput} value={replaceVal}
                onChange={e => setReplaceVal(e.target.value)}
                placeholder="Replace with…"
                onKeyDown={e => e.key === 'Enter' && doReplace()} />
              <SBtn onClick={doReplace}>Replace</SBtn>
              <SBtn onClick={doReplaceAll}>Replace All</SBtn>
            </div>
          </div>
        )}

        {/* ── ROW 2: EDITOR CANVAS ──────────────────────────────────────── */}
        <div style={S.editorRow}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            style={{
              ...S.editor,
              fontFamily: `'${font}', serif`,
              fontSize: fontSize + 'px',
              lineHeight: lineH,
              color: fgColor,
            }}
            onInput={updateCounts}
            onKeyDown={e => {
              if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') { e.preventDefault(); saveNote(false); }
                if (e.key === 'f') { e.preventDefault(); setShowSearch(s => !s); }
                if (e.key === 'b') { e.preventDefault(); toggleBold(); }
                if (e.key === 'i') { e.preventDefault(); toggleItalic(); }
                if (e.key === 'u') { e.preventDefault(); toggleUnderline(); }
              }
            }}
            onMouseUp={saveRange}
            onKeyUp={saveRange}
            data-placeholder="Begin writing…"
          />
        </div>

        {/* ── STATUSBAR ─────────────────────────────────────────────────── */}
        <div style={S.statusBar}>
          <span>{wordCount} words · {charCount} chars</span>
          <span style={{ fontFamily: `'${font}', serif` }}>{font} · {fontSize}px</span>
          <span>{autoSave ? '⬤ Auto' : '○ Manual'}</span>
        </div>
      </div>

      {/* ── LOAD PANEL ────────────────────────────────────────────────────── */}
      {showLoad && (
        <div style={S.overlay} onClick={() => setShowLoad(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>VAULT</span>
              <button style={S.modalClose} onClick={() => setShowLoad(false)}>✕</button>
            </div>
            {savedNotes.length === 0 ? (
              <p style={S.emptyVault}>No saved documents yet</p>
            ) : (
              <div style={S.noteList}>
                {savedNotes.map((n, i) => (
                  <div key={i} style={S.noteItem} onClick={() => loadNote(n)}>
                    <div style={S.noteTitle}>{n.title}</div>
                    <div style={S.noteDate}>{new Date(n.date).toLocaleString()}</div>
                    <button style={S.noteDelete} onClick={(e) => deleteNote(n.title, e)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ ...S.toast, background: toast.isErr ? '#5a0000' : '#1a0505', borderColor: toast.isErr ? '#8b0000' : '#8b1a1a' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function TBtn({ onClick, children, active, title, style: extraStyle }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      style={{
        ...S.tbtn,
        background: active ? 'rgba(139,26,26,0.5)' : 'transparent',
        color: active ? '#d4a017' : '#8a8278',
        borderColor: active ? '#8b1a1a' : 'transparent',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span style={S.divider} />;
}

function SBtn({ onClick, children }) {
  return (
    <button style={S.sbtn} onClick={onClick}>{children}</button>
  );
}

function ExportItem({ onClick, children }) {
  return (
    <button style={S.exportItem} onClick={onClick}>{children}</button>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'grid',
    gridTemplateRows: '100px auto 1fr 28px',
    height: '100dvh',
    background: '#080808',
    overflow: 'hidden',
  },

  // Toolbar row — full width, toolbar centred at 600px
  toolbarRow: {
    borderBottom: '1px solid #1e1e1e',
    background: 'linear-gradient(180deg, #0d0d0d 0%, #090909 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 1px 0 #8b1a1a22',
  },
  toolbar: {
    width: '100%',
    maxWidth: 1400,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0 12px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  },

  brand: {
    fontSize: 18,
    textDecoration: 'none',
    padding: '4px 8px',
    color: '#8b1a1a',
    flexShrink: 0,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },

  tbtn: {
    height: 32,
    minWidth: 28,
    padding: '0 6px',
    border: '1px solid transparent',
    borderRadius: 0,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
    fontFamily: 'inherit',
  },

  divider: {
    width: 1,
    height: 28,
    background: '#2a2a2a',
    margin: '0 3px',
    flexShrink: 0,
  },

  // Font picker
  fontPickerWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  fontPickerBtn: {
    height: 32,
    padding: '0 10px',
    background: '#141414',
    border: '1px solid #2a2a2a',
    color: '#d4ccbc',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 140,
    maxWidth: 180,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  arrow: {
    fontSize: 8,
    color: '#4a4540',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  fontDropdown: {
    position: 'absolute',
    top: 34,
    left: 0,
    width: 220,
    background: '#111',
    border: '1px solid #2a2a2a',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    zIndex: 1000,
    animation: 'slideDown 0.15s ease',
  },
  fontSearch: {
    width: '100%',
    padding: '8px 10px',
    background: '#0a0a0a',
    border: 'none',
    borderBottom: '1px solid #2a2a2a',
    color: '#d4ccbc',
    fontSize: 12,
    outline: 'none',
  },
  fontList: {
    maxHeight: 280,
    overflowY: 'auto',
  },
  fontItem: {
    padding: '7px 12px',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.1s',
    letterSpacing: '0.01em',
  },

  sizeSelect: {
    height: 32,
    padding: '0 6px',
    background: '#141414',
    border: '1px solid #2a2a2a',
    color: '#d4ccbc',
    fontSize: 11,
    flexShrink: 0,
    cursor: 'pointer',
    outline: 'none',
    fontFamily: "'Cinzel', serif",
  },

  colorWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    cursor: 'pointer',
    flexShrink: 0,
    padding: '2px 4px',
  },
  colorSwatch: {
    width: 20,
    height: 12,
    borderRadius: 0,
    display: 'block',
  },
  colorLabel: {
    fontSize: 9,
    color: '#6a6258',
    letterSpacing: '0.05em',
    fontFamily: "'Cinzel', serif",
  },

  titleInput: {
    marginLeft: 8,
    height: 32,
    padding: '0 10px',
    background: 'transparent',
    border: '1px solid transparent',
    borderBottom: '1px solid #2a2a2a',
    color: '#8a8278',
    fontSize: 11,
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.08em',
    outline: 'none',
    minWidth: 100,
    maxWidth: 160,
    transition: 'border-color 0.2s, color 0.2s',
    flexShrink: 0,
  },

  // Search panel
  searchPanel: {
    background: '#0d0d0d',
    borderBottom: '1px solid #1e1e1e',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    animation: 'slideDown 0.2s ease',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  searchLabel: {
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.15em',
    color: '#4a4540',
    width: 52,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    height: 28,
    padding: '0 10px',
    background: '#141414',
    border: '1px solid #2a2a2a',
    color: '#d4ccbc',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'monospace',
  },
  caseToggle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    color: '#6a6258',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  sbtn: {
    height: 28,
    padding: '0 12px',
    background: '#8b1a1a',
    border: '1px solid #a02020',
    color: '#f0e8d8',
    fontSize: 11,
    letterSpacing: '0.05em',
    fontFamily: "'Cinzel', serif",
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.15s',
  },

  // Editor
  editorRow: {
    overflowY: 'auto',
    background: '#080808',
    padding: '0 0 40px',
  },
  editor: {
    minHeight: '100%',
    padding: '48px 10%',
    outline: 'none',
    caretColor: '#8b1a1a',
    wordBreak: 'break-word',
    // Placeholder via CSS
  },

  // Statusbar
  statusBar: {
    background: '#0a0a0a',
    borderTop: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.12em',
    color: '#3a3530',
    userSelect: 'none',
  },

  // Export dropdown
  exportMenu: {
    position: 'absolute',
    top: 34,
    right: 0,
    background: '#111',
    border: '1px solid #2a2a2a',
    minWidth: 160,
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    animation: 'slideDown 0.15s ease',
  },
  exportItem: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1e1e1e',
    color: '#d4ccbc',
    fontSize: 12,
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.05em',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },

  // Load modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#0f0f0f',
    border: '1px solid #2a2a2a',
    width: 480,
    maxWidth: '90vw',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
  },
  modalHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #2a2a2a',
  },
  modalTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.2em',
    color: '#b8860b',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#4a4540',
    fontSize: 14,
    cursor: 'pointer',
  },
  emptyVault: {
    padding: 32,
    textAlign: 'center',
    fontFamily: "'IM Fell English', serif",
    fontStyle: 'italic',
    color: '#3a3530',
    fontSize: 14,
  },
  noteList: {
    overflowY: 'auto',
    flex: 1,
  },
  noteItem: {
    padding: '12px 20px',
    borderBottom: '1px solid #1a1a1a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'background 0.15s',
    position: 'relative',
  },
  noteTitle: {
    flex: 1,
    fontFamily: "'Cinzel', serif",
    fontSize: 12,
    letterSpacing: '0.08em',
    color: '#d4ccbc',
  },
  noteDate: {
    fontSize: 9,
    color: '#3a3530',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.05em',
  },
  noteDelete: {
    background: 'none',
    border: 'none',
    color: '#3a3530',
    cursor: 'pointer',
    fontSize: 11,
    padding: '2px 6px',
    transition: 'color 0.15s',
  },

  // Toast
  toast: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    border: '1px solid #8b1a1a',
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.12em',
    color: '#d4a017',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
    pointerEvents: 'none',
  },
};
