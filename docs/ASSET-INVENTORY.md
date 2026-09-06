# APOLO — Asset Inventory (audited 2026-09-04)

Source: Shopify store `apolostationey.com` (canonical brand domain: `www.apolostationery.com`).
CDN root: `https://cdn.shopify.com/s/files/1/0580/6443/7401/`
Catalog: **147 products**, 129 own-brand ("Apolo") + resale (Double A, Paper One, Nevia).
CORS: `cdn.shopify.com` serves `Access-Control-Allow-Origin` — images are canvas-readable and hotlinkable.

## Tier A — clean transparent PNG cutouts (hero-grade, use as-is)
1500x1500, ~96% alpha, no watermark, no packaging, vertical, centred. **19 products.**

| Product | Files |
|---|---|
| Ball Pen Cruizer | `files/CruizerPenBlue.png` `CruizerPenBlack.png` `CruizerPenRed.png` |
| Whiteboard Marker | `files/MB-Copy.png` `MB1-Copy.png` `MB2-Copy.png` |
| Whiteboard Marker Refill | `files/MB-Copy_2.png` `MB1-Copy_2.png` `MB2-Copy_2.png` |
| Correction Pen A-107 | `files/CorrectionPenA107_5ML.png` |
| Highlighter Bright A-187 | `products/HighPink.png` `HighYellow.png` `HighGreen.png` `HighOrange.png` |
| Mechanical Pencil A-194 | `products/MachanicalPencilOldDesign.png` `…1.png` `…2.png` |
| Eraser A-150 | `products/Eraser.png` |
| Semi Gel Pen 0.5 | `products/SemiGelPenBlue.png` `…Black.png` `…Red.png` |
| Gel Ink Pen 0.5 | `products/GelInkPenBlue.png` `…Black.png` `…Red.png` |
| Gel Pen A-101 | `products/GelPenBlue.png` `…Black.png` `…Red.png` |
| Permanent Marker | `products/48bde6c585bd78e00f54bfefb0a39e02.png` (+2) |

## Tier B — white-background catalog sheets (usable after crop + levels)
1500x1500 JPG on pure white. Carry supplier chrome: **"DECOLAND" mint watermark** (diagonal),
APOLO logo top-right, black/red spec badge bottom-left.
**Cleanup, verified working, no tooling required:**
crop to `x 26%–74%, y 9%–88%` (drops both corner marks) +
`filter: brightness(1.06) contrast(1.10)` + `mix-blend-mode: multiply` on a paper ground
(kills the watermark; product survives).

Graphite pencils `products/Pencil-A221C|D|G|R|E.jpg` · Color pencils 18/24/36
`products/Color-Pencil-36Pcs.jpg` `Color-Pencil-24Pcs-My-Gold.jpg` `Color-Pencil-18Pcs-My-Gold.jpg` ·
Oil pastel `products/Oil-Pastel-12Pcs-Front.jpg` · Scissors `Scissor1.jpg` `TailorScissor.jpg`
`ChildrenScissor1.jpg` `SafeScissor2.jpg` `SmartScissor.jpg` `KitchenScissor.jpg` ·
Sharpeners `Sharpener210A-1.jpg` `Sharpener211A-1.jpg` `212A.jpg` · Glue stick `GlueStick.jpg` ·
Calculator `A229S1.jpg` · Staplers `A191C3.jpg` `A1914.jpg` · Punch `10Sheets.jpg` ·
Ruler set `RulerSet.jpg` · Cutter `PrecisionCutter1.jpg` · Binder clip `BinderClip.jpg` ·
Push pins `Pin.jpg` · Drawing books `Drawing-Book.jpg` `Drawing-Book_g120.jpg`

## Tier C — composed marketing tiles on magenta (NOT cutouts)
Notebooks, exercise books, sticky notes, 12" ruler, single/double-line books are only available as
finished spec-card artwork with baked-in typography on a magenta gradient
(`Note_Book.jpg`, `Single-Line-Premier.jpg`, `Sticky02.jpg`, `12inch.jpg`, …).
**No clean notebook cutout exists.** Treat as reference/texture only, or region-crop the product.

## Tier D — brand graphics
- Logo `https://apolostationey.com/cdn/shop/files/Apolo_Logo_1_1.png` (200x105, magenta lockup + Burmese subtitle)
- Homepage slides `shop/files/{WSL,Apolo1_copy,Banner01_copy_8c08478a-…,Apolo6_c7e3e1ed-…,Frame6_31224a9a-…}_1400x.jpg`

## Identity extracted
- **Magenta `#EC008C`** (349 computed-style hits) — the primary. Photo backdrops use `#EE2191`/`#FD3CAB`.
- Yellow accent (sale flashes), pastel notebook covers: orange, yellow, pink, periwinkle blue.
- Type: Poppins (latin) + **Padauk** (Burmese). Site is bilingual EN/MY.
- Recurring motifs: **ruled notebook paper** as a graphic band; **flat-lay top-down** product layouts;
  **white rabbit mascot** on exercise-book covers; **Myanmar schoolgirl** illustration in campaign art.
- Own creative line already in use: **"ဆွဲမယ်" (let's draw)** over a blank sketchbook page.
- Tone: playful, school-season, energetic, value-led, dense.

## Technical context of the live site
Shopify, theme "Plaza" (2021), jQuery 2.1 + Bootstrap + Owl Carousel + Nivo Slider + 8 icon fonts.
Heavy legacy front-end — a new hero must not depend on it.
