'use client';

/**
 * TEMPORARY palette comparison page — /palette-preview
 * Delete app/palette-preview/ once you've chosen a colour set.
 */

import { useState } from 'react';

// ─── Palette definitions ────────────────────────────────────────────────────

interface Palette {
  id: string;
  name: string;
  tag: string;
  tagBg: string;
  note: string;
  bg: string;
  fg: string;
  card: string;
  primary: string;
  muted: string;
  mutedFg: string;
  accent: string;
  border: string;
  vars: string; // ready to paste into :root {}
}

const PALETTES: Palette[] = [
  {
    id: 'current',
    name: 'Current Palette',
    tag: 'As-Is',
    tagBg: '#6B7280',
    note: '❌ Muted text fails WCAG AA (3.65:1 — need 4.5:1)',
    bg: 'hsl(27, 21%, 80%)',
    fg: 'hsl(0, 0%, 0%)',
    card: 'hsl(27, 15%, 90%)',
    primary: 'hsl(30, 35%, 72%)',
    muted: 'hsl(27, 21%, 74%)',
    mutedFg: 'hsl(20, 10%, 40%)',
    accent: 'hsl(350, 60%, 90%)',
    border: 'hsl(27, 15%, 65%)',
    vars: `/* Your existing :root — no changes */
--background:          27 21% 80%;
--foreground:          0 0% 0%;
--card:                27 15% 90%;
--card-foreground:     0 0% 0%;
--primary:             30 35% 72%;
--primary-foreground:  0 0% 0%;
--secondary:           0 0% 100%;
--secondary-foreground: 0 0% 0%;
--muted:               27 21% 74%;
--muted-foreground:    20 10% 40%;
--accent:              350 60% 90%;
--accent-foreground:   0 0% 0%;
--border:              27 15% 65%;
--input:               27 15% 65%;
--ring:                30 35% 55%;`,
  },
  {
    id: 'fix1',
    name: 'Fix 1 — Text Only',
    tag: 'Minimal',
    tagBg: '#D97706',
    note: '✅ Identical look, warm readable text (8.66:1 / 4.89:1)',
    bg: 'hsl(27, 21%, 80%)',
    fg: 'hsl(25, 40%, 17%)',
    card: 'hsl(27, 15%, 90%)',
    primary: 'hsl(30, 35%, 72%)',
    muted: 'hsl(27, 21%, 74%)',
    mutedFg: 'hsl(25, 20%, 32%)',
    accent: 'hsl(350, 60%, 90%)',
    border: 'hsl(27, 15%, 65%)',
    vars: `/* Only these lines change — swap in :root */
--foreground:          25 40% 17%;   /* was: 0 0% 0% */
--card-foreground:     25 40% 17%;   /* was: 0 0% 0% */
--primary-foreground:  25 40% 17%;   /* was: 0 0% 0% */
--secondary-foreground: 25 40% 17%; /* was: 0 0% 0% */
--accent-foreground:   25 40% 17%;  /* was: 0 0% 0% */
--muted-foreground:    25 20% 32%;  /* was: 20 10% 40% */`,
  },
  {
    id: 'option-a',
    name: 'A — Sandalwood & Blush',
    tag: '⭐ Recommended',
    tagBg: '#16A34A',
    note: '✅ Refined warmth, 4.89:1 muted contrast',
    bg: 'hsl(27, 18%, 84%)',
    fg: 'hsl(25, 40%, 17%)',
    card: 'hsl(27, 20%, 93%)',
    primary: 'hsl(30, 38%, 70%)',
    muted: 'hsl(27, 18%, 77%)',
    mutedFg: 'hsl(25, 20%, 32%)',
    accent: 'hsl(350, 55%, 88%)',
    border: 'hsl(27, 15%, 70%)',
    vars: `--background:          27 18% 84%;
--foreground:          25 40% 17%;
--card:                27 20% 93%;
--card-foreground:     25 40% 17%;
--primary:             30 38% 70%;
--primary-foreground:  25 40% 17%;
--secondary:           0 0% 100%;
--secondary-foreground: 25 40% 17%;
--muted:               27 18% 77%;
--muted-foreground:    25 20% 32%;
--accent:              350 55% 88%;
--accent-foreground:   25 40% 17%;
--border:              27 15% 70%;
--input:               27 15% 70%;
--ring:                30 38% 55%;`,
  },
  {
    id: 'option-b',
    name: 'B — Parchment & Rose',
    tag: 'Editorial',
    tagBg: '#7C3AED',
    note: '✅ Fine paper feel, 5.1:1 muted contrast',
    bg: 'hsl(30, 45%, 95%)',
    fg: 'hsl(22, 45%, 15%)',
    card: 'hsl(0, 0%, 100%)',
    primary: 'hsl(30, 38%, 68%)',
    muted: 'hsl(30, 30%, 90%)',
    mutedFg: 'hsl(25, 20%, 35%)',
    accent: 'hsl(350, 55%, 86%)',
    border: 'hsl(30, 20%, 82%)',
    vars: `--background:          30 45% 95%;
--foreground:          22 45% 15%;
--card:                0 0% 100%;
--card-foreground:     22 45% 15%;
--primary:             30 38% 68%;
--primary-foreground:  22 45% 15%;
--secondary:           0 0% 100%;
--secondary-foreground: 22 45% 15%;
--muted:               30 30% 90%;
--muted-foreground:    25 20% 35%;
--accent:              350 55% 86%;
--accent-foreground:   22 45% 15%;
--border:              30 20% 82%;
--input:               30 20% 82%;
--ring:                30 38% 55%;`,
  },
  {
    id: 'option-c',
    name: 'C — Blushed Bronze',
    tag: 'Bold & Pink',
    tagBg: '#BE123C',
    note: '✅ Pink-forward, distinctive, 4.7:1 contrast',
    bg: 'hsl(345, 20%, 93%)',
    fg: 'hsl(340, 35%, 16%)',
    card: 'hsl(0, 0%, 100%)',
    primary: 'hsl(30, 38%, 68%)',
    muted: 'hsl(345, 15%, 87%)',
    mutedFg: 'hsl(340, 18%, 36%)',
    accent: 'hsl(350, 60%, 82%)',
    border: 'hsl(345, 18%, 80%)',
    vars: `--background:          345 20% 93%;
--foreground:          340 35% 16%;
--card:                0 0% 100%;
--card-foreground:     340 35% 16%;
--primary:             30 38% 68%;
--primary-foreground:  340 35% 16%;
--secondary:           0 0% 100%;
--secondary-foreground: 340 35% 16%;
--muted:               345 15% 87%;
--muted-foreground:    340 18% 36%;
--accent:              350 60% 82%;
--accent-foreground:   340 35% 16%;
--border:              345 18% 80%;
--input:               345 18% 80%;
--ring:                350 60% 65%;`,
  },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────

const script: React.CSSProperties = {
  fontFamily: 'var(--font-squarepeg), cursive',
  fontWeight: 400,
  textTransform: 'none',
  letterSpacing: 'normal',
};

const body: React.CSSProperties = {
  fontFamily: 'var(--font-anybody), sans-serif',
  fontWeight: 132,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// ─── Color swatches strip ─────────────────────────────────────────────────────

function Swatches({ p }: { p: Palette }) {
  const swatches = [
    { label: 'BG',       color: p.bg       },
    { label: 'Card',     color: p.card     },
    { label: 'Primary',  color: p.primary  },
    { label: 'Accent',   color: p.accent   },
    { label: 'Muted FG', color: p.mutedFg  },
    { label: 'FG',       color: p.fg       },
  ];
  return (
    <div style={{
      background: p.card,
      border: `1px solid ${p.border}`,
      borderRadius: '8px',
      padding: '10px 12px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      {swatches.map(s => (
        <div key={s.label} style={{ textAlign: 'center', minWidth: '36px' }}>
          <div style={{
            width: 34, height: 34,
            background: s.color,
            borderRadius: '50%',
            border: `2px solid ${p.border}`,
            margin: '0 auto 3px',
          }} />
          <div style={{
            ...body,
            fontSize: '6.5px',
            color: p.mutedFg,
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Mini site preview ────────────────────────────────────────────────────────

function MiniSite({ p }: { p: Palette }) {
  return (
    <div style={{
      background: p.bg,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* ── Nav ── */}
      <div style={{
        background: p.bg,
        borderBottom: `1px solid ${p.border}`,
        padding: '9px 13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ ...script, fontSize: '15px', color: p.fg }}>GutierrezByJanelle</span>
        <div style={{ display: 'flex', gap: '9px' }}>
          {['Home', 'Investment', 'Gallery'].map(l => (
            <span key={l} style={{ ...body, fontSize: '6.5px', color: p.fg, opacity: 0.8 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: '18px 13px', borderBottom: `1px solid ${p.border}30` }}>
        <div style={{ ...script, fontSize: '28px', color: p.fg, lineHeight: 1.15, marginBottom: '8px' }}>
          Wedding<br />Stationery
        </div>
        <div style={{ ...body, fontSize: '7.5px', color: p.mutedFg, lineHeight: 1.75, marginBottom: '13px' }}>
          Hand-crafted suites tailored to your love story — from invitations to day-of paper goods.
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button style={{ ...body, fontSize: '7px', background: p.primary, color: p.fg, border: 'none', padding: '7px 13px', borderRadius: '4px', cursor: 'pointer' }}>
            View Packages
          </button>
          <button style={{ ...body, fontSize: '7px', background: 'transparent', color: p.fg, border: `1px solid ${p.border}`, padding: '7px 13px', borderRadius: '4px', cursor: 'pointer' }}>
            Gallery
          </button>
        </div>
      </div>

      {/* ── Price card ── */}
      <div style={{ padding: '13px' }}>
        <div style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: '8px', padding: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ ...script, fontSize: '18px', color: p.fg }}>Sweet Suite</span>
            <span style={{ ...body, fontSize: '6px', background: p.accent, color: p.fg, padding: '2px 7px', borderRadius: '20px' }}>
              Save 15%
            </span>
          </div>
          <div style={{ ...body, fontSize: '7px', color: p.mutedFg, marginBottom: '8px' }}>
            Full wedding paper goods suite
          </div>
          {['Invitations (50 sets)', 'Thank You Cards (50)', 'Table Numbers', 'AI-generated renders'].map(f => (
            <div key={f} style={{ ...body, fontSize: '6.5px', color: p.fg, padding: '3px 0', borderBottom: `1px solid ${p.border}40`, display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ color: p.mutedFg }}>—</span>{f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Review snippet ── */}
      <div style={{ padding: '11px 13px 13px', background: p.muted, borderTop: `1px solid ${p.border}30` }}>
        <div style={{ ...body, fontSize: '7.5px', color: p.mutedFg, lineHeight: 1.7, fontStyle: 'italic', marginBottom: '7px' }}>
          "Janelle turned our vision into the most beautiful stationery suite — every detail was perfect."
        </div>
        <div style={{ ...script, fontSize: '13px', color: p.fg }}>Sarah M.</div>
        <div style={{ ...body, fontSize: '6.5px', color: p.mutedFg }}>Bride · Fall 2024</div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PalettePreviewPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, vars: string) => {
    navigator.clipboard.writeText(vars).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2200);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: '20px 20px 40px' }}>
      <div style={{ maxWidth: '1620px', margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{
          background: '#1c1c1c',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          padding: '18px 22px',
          marginBottom: '20px',
          color: '#fff',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, fontFamily: 'system-ui', color: '#fff' }}>
                🎨 Palette Comparison — GutierrezByJanelle
              </h1>
              <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontFamily: 'system-ui', fontWeight: 600 }}>
                Temp Page
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#888', fontFamily: 'system-ui', lineHeight: 1.65 }}>
              All 5 options rendered with your actual fonts (Square Peg + Anybody). Scroll right to see all columns.
              When you decide, tell Claude which one you want and it will update <code style={{ background: '#2a2a2a', padding: '1px 5px', borderRadius: '3px', color: '#ddd' }}>globals.css</code> for you.
            </p>
          </div>
          <div style={{ fontFamily: 'system-ui', fontSize: '11px', color: '#555', lineHeight: 1.8, minWidth: '180px' }}>
            <div>① Current · grey/black text</div>
            <div>② Fix 1 · warm text only</div>
            <div>③ Option A · <strong style={{ color: '#86efac' }}>⭐ Recommended</strong></div>
            <div>④ Option B · cream / editorial</div>
            <div>⑤ Option C · bold pink</div>
          </div>
        </div>

        {/* ── Columns ── */}
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' }}>
          {PALETTES.map((p, i) => (
            <div key={p.id} style={{ minWidth: '288px', maxWidth: '288px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Column header */}
              <div style={{
                background: '#1c1c1c',
                border: '1px solid #2e2e2e',
                borderRadius: '8px',
                padding: '11px 13px',
                color: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <span style={{ ...body, fontSize: '9px', background: p.tagBg, color: '#fff', borderRadius: '4px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: 'system-ui' }}>
                    {p.tag}
                  </span>
                  <span style={{ fontFamily: 'system-ui', fontSize: '11px', color: '#555', fontWeight: 500 }}>#{i + 1}</span>
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                <div style={{ fontFamily: 'system-ui', fontSize: '11px', color: '#888', lineHeight: 1.5 }}>{p.note}</div>
              </div>

              {/* Swatches */}
              <Swatches p={p} />

              {/* Mini site */}
              <MiniSite p={p} />

              {/* Text samples — the most important comparison */}
              <div style={{
                background: p.bg,
                border: `1px solid ${p.border}`,
                borderRadius: '8px',
                padding: '12px 13px',
              }}>
                <div style={{ ...body, fontSize: '8px', color: p.mutedFg, marginBottom: '6px' }}>
                  Text contrast samples:
                </div>
                <div style={{ ...body, fontSize: '9px', color: p.fg, marginBottom: '4px' }}>
                  Main body text — headings, nav, buttons
                </div>
                <div style={{ ...body, fontSize: '8.5px', color: p.mutedFg, lineHeight: 1.6 }}>
                  Secondary / muted text — descriptions, roles, feature lists, card captions, reviewer titles
                </div>
              </div>

              {/* CSS copy block */}
              <div style={{
                background: '#111a11',
                border: '1px solid #1f3b1f',
                borderRadius: '8px',
                padding: '11px 13px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'system-ui', color: '#86efac', fontSize: '10.5px', fontWeight: 700 }}>
                    globals.css — paste into :root &#123;&#125;
                  </span>
                  <button
                    onClick={() => handleCopy(p.id, p.vars)}
                    style={{
                      background: copied === p.id ? '#16a34a' : '#2d4a2d',
                      color: copied === p.id ? '#fff' : '#86efac',
                      border: '1px solid #2a5a2a',
                      borderRadius: '5px',
                      padding: '4px 11px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontFamily: 'system-ui',
                      fontWeight: 600,
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copied === p.id ? '✓ Copied!' : 'Copy CSS'}
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '9px',
                  color: '#4ade80',
                  lineHeight: 1.75,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: '"Fira Code", "Cascadia Code", "Menlo", monospace',
                  opacity: 0.9,
                }}>
                  {p.vars}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer note ── */}
        <div style={{
          marginTop: '24px',
          fontFamily: 'system-ui',
          fontSize: '12px',
          color: '#444',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          Delete this page after choosing: remove the <code style={{ color: '#666' }}>app/palette-preview/</code> folder.
          &nbsp;·&nbsp; Fonts: Square Peg (script) + Anybody (caps, weight 132) — your real production fonts.
        </div>
      </div>
    </div>
  );
}
