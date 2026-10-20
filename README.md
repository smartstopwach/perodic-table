# Periodic Table Arena — Interactive Drag & Drop Chemistry Lab

An interactive HTML, CSS, and JavaScript web application featuring a **blank 118-element Periodic Table** where learners drag & drop elements into their true periodic positions with real-time **Sahi (Correct ✓) / Galat (Wrong ✗)** validation, diagnostic chemistry hints, exam sheet mode, live phase temperature simulation, and animated Bohr atomic shell models.

## Key Features

- **Full 118 IUPAC Periodic Table Architecture**: Complete 18-group × 7-period grid plus dedicated **6* Lanthanide (57–71)** and **7* Actinide (89–103)** f-block rows with interactive bridge indicators.
- **3 Interactive Modes**:
  1. **⚡ Live Check Mode (`Sahi / Galat`)**: Instant verification on every drag & drop with green lock-in, combo streak scoring, synthesized Web Audio feedback, and progressive chemistry hints when dropped in a wrong slot.
  2. **📝 Exam Sheet Mode**: Fill blank slots freely across the table, drag placed tiles between slots (or swap two placed elements), and click **Check Sahi / Galat** to grade the entire table at once—locking right placements in green (`✓`) and highlighting mistakes in crimson red (`✗`) to fix.
  3. **🔬 Study Reference Mode**: Explore all 118 elements with orbital block filters (`s`, `p`, `d`, `f`), 10 chemical category highlights, a **0 K – 6000 K Temperature Phase Simulator** (Solid / Liquid / Gas), and click-to-open **Animated SVG Bohr Electron Shell Diagrams**.
- **Flexible Challenge Scopes & Clue Controls**:
  - Scopes: *All 118 Elements*, *First 20 (Z = 1–20)*, *First 36 (Periods 1–4)*, *s & p Block*, *d-Block*, and *f-Block*.
  - Board Clues: *Pure Blank Table*, *Show Atomic Numbers (Z)*, or *Category Color Outlines*.
  - Tile Clues: *Symbol + Name*, *Symbol Only*, *Name Only*, or *Electron Configuration*.
- **Multi-Modal Controls**: Desktop HTML5 drag & drop, mobile touch-drag ghosting, click-tile-then-click-slot placement, quick keyboard slot entry, and **Dark Lab / Light Classroom** theme toggle.

## Project Structure

```text
├── index.html          # Main application layout & modals
├── css/
│   └── style.css       # Design tokens, responsive 18-col CSS grid, Dark/Light themes
└── js/
    ├── elements-data.js # Verified 118 IUPAC elements dataset & shell configs
    ├── sound.js         # Zero-dependency Web Audio API synthesizer
    └── app.js           # Game engine, drag & drop handlers, and SVG Bohr renderer
```

## Running Locally

Open `index.html` directly in any modern browser, or start a static HTTP server:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```
