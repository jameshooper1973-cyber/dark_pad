import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    setLoaded(true);
    const notes = JSON.parse(localStorage.getItem('darkpad_notes') || '[]');
    setNoteCount(notes.length);
  }, []);

  return (
    <>
      <Head>
        <title>DarkPad — The Obsidian Editor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.root}>
        {/* Scanline overlay */}
        <div style={styles.scanlines} />

        {/* Noise texture */}
        <div style={styles.noise} />

        {/* Background rune grid */}
        <div style={styles.runeGrid}>
          {Array.from({ length: 64 }).map((_, i) => (
            <span key={i} style={{ ...styles.rune, opacity: Math.random() * 0.12 + 0.03, fontSize: (Math.random() * 18 + 10) + 'px', animationDelay: (Math.random() * 4) + 's' }}>
              {['᛭', '᚛', 'ᚘ', 'ᛃ', 'ᚹ', 'ᛇ', 'ᚦ', 'ᛏ', 'ᛒ', '⵿', '𐍈', '𐌽', '𐌿'][Math.floor(Math.random() * 13)]}
            </span>
          ))}
        </div>

        {/* Main content */}
        <div style={{ ...styles.content, opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease' }}>

          {/* Decorative top border */}
          <div style={styles.ornament}>
            <span style={styles.ornLine} />
            <span style={styles.ornSymbol}>✦</span>
            <span style={styles.ornLine} />
          </div>

          {/* Title */}
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>DARKPAD</h1>
            <p style={styles.subtitle}>The Obsidian Editor</p>
            <p style={styles.tagline}>
              IM FELL ENGLISH · CINZEL · 65 TYPEFACES · INFINITE PAGES
            </p>
          </div>

          {/* Features grid */}
          <div style={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ ...styles.featureCard, animationDelay: (i * 0.08) + 's' }}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={styles.ctaRow}>
            <Link href="/notepad" style={styles.enterBtn}>
              <span style={styles.enterBtnInner}>
                ⟡ ENTER THE EDITOR
              </span>
              <span style={styles.enterBtnGlow} />
            </Link>
            {noteCount > 0 && (
              <p style={styles.savedNote}>{noteCount} saved {noteCount === 1 ? 'document' : 'documents'} in vault</p>
            )}
          </div>

          {/* Bottom ornament */}
          <div style={{ ...styles.ornament, marginTop: 48 }}>
            <span style={styles.ornLine} />
            <span style={styles.ornSymbol}>✦</span>
            <span style={styles.ornLine} />
          </div>

          <p style={styles.footer}>ALL DATA REMAINS IN YOUR BROWSER · NO CLOUD · NO TRACKING</p>
        </div>
      </div>
    </>
  );
}

const FEATURES = [
  { icon: '𝔉', label: '65 Google Fonts' },
  { icon: '⌨', label: 'Rich Text' },
  { icon: '⬛', label: 'Local Storage' },
  { icon: '🔍', label: 'Search & Replace' },
  { icon: '🖼', label: 'Image Insert' },
  { icon: '📄', label: 'Export TXT' },
  { icon: '📕', label: 'Export PDF' },
  { icon: '🎞', label: 'Export Slides' },
  { icon: '⚡', label: 'Auto-Save' },
];

const styles = {
  root: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 50% 0%, #1a0505 0%, #080808 60%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 20px',
  },
  scanlines: {
    position: 'fixed',
    inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  noise: {
    position: 'fixed',
    inset: 0,
    opacity: 0.025,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundSize: '256px 256px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  runeGrid: {
    position: 'fixed',
    inset: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(8, 1fr)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  rune: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b1a1a',
    animation: 'runeGlow 3s ease-in-out infinite',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    maxWidth: 700,
    width: '100%',
  },
  ornament: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  ornLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, #8b1a1a, transparent)',
  },
  ornSymbol: {
    color: '#b8860b',
    fontSize: 18,
    animation: 'runeGlow 2s ease-in-out infinite',
  },
  titleBlock: {
    marginBottom: 40,
  },
  title: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: 'clamp(42px, 10vw, 88px)',
    fontWeight: 900,
    letterSpacing: '0.15em',
    color: '#d4ccbc',
    textShadow: '0 0 40px rgba(139,26,26,0.6), 0 0 80px rgba(139,26,26,0.3)',
    lineHeight: 1,
    animation: 'flicker 8s ease-in-out infinite',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "'IM Fell English', serif",
    fontStyle: 'italic',
    fontSize: 'clamp(16px, 3vw, 22px)',
    color: '#b8860b',
    letterSpacing: '0.1em',
    marginBottom: 16,
  },
  tagline: {
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.2em',
    color: '#4a4540',
    textTransform: 'uppercase',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 48,
  },
  featureCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(139,26,26,0.2)',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    animation: 'fadeIn 0.6s ease both',
    transition: 'border-color 0.3s, background 0.3s',
  },
  featureIcon: {
    fontSize: 22,
    color: '#b8860b',
  },
  featureLabel: {
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.1em',
    color: '#6a6258',
    textTransform: 'uppercase',
  },
  ctaRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  enterBtn: {
    position: 'relative',
    display: 'inline-block',
    padding: '0 2px 2px 2px',
    textDecoration: 'none',
  },
  enterBtnInner: {
    display: 'block',
    background: '#8b1a1a',
    color: '#f0e8d8',
    fontFamily: "'Cinzel', serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.2em',
    padding: '18px 48px',
    border: '1px solid rgba(184,134,11,0.5)',
    position: 'relative',
    zIndex: 1,
    transition: 'background 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(139,26,26,0.4)',
  },
  enterBtnGlow: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(184,134,11,0.1)',
    filter: 'blur(8px)',
  },
  savedNote: {
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.15em',
    color: '#4a4540',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 24,
    fontFamily: "'Cinzel', serif",
    fontSize: 8,
    letterSpacing: '0.2em',
    color: '#2a2822',
    textTransform: 'uppercase',
  },
};
