# STICKDOOM

Storefront for STICKDOOM, an independent sticker brand from Uzbekistan. Built with Next.js (App Router, Cache Components), React, TypeScript, Tailwind CSS v4, React Three Fiber and Motion.

The site is a catalogue: every "Buy" button sends the shopper to that pack's own product page on **Uzum Market**. No orders are taken on this site.

## Scripts

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # production build (all pages are prerendered)
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # TypeScript
```

## Environment

| Variable               | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for canonical and Open Graph URLs. Defaults to `http://localhost:3000`. |

## Where things live

| What                       | File                                   |
| -------------------------- | -------------------------------------- |
| Sticker packs (catalogue)  | `src/data/packs.ts`                    |
| Pack validation            | `src/lib/define-pack.ts`               |
| Catalogue queries, price   | `src/lib/catalog.ts`                   |
| Brand, nav, social links   | `src/config/site.ts`                   |
| Site text (uz / ru / en)   | `src/i18n/dictionaries/`               |
| Language routing           | `src/proxy.ts`, `src/i18n/config.ts`   |
| Design tokens, typography  | `src/app/globals.css`                  |
| Sticker images             | `public/sticker-packs/<slug>/`         |

## Adding a sticker pack

1. **Add the images.** Create `public/sticker-packs/<slug>/` and put the original sticker files in it (PNG with transparency, JPG or WebP). Don't crop or stretch them; the site keeps the original aspect ratio. Name them in display order, e.g. `01.png`, `02.png`.
2. **Note the pixel size.** If all stickers are the same size, you only need it once. If one differs, give that sticker its own `width`/`height`.
3. **Add an entry** to the `packs` array in `src/data/packs.ts`:

   ```ts
   definePack({
     slug: "night-market",            // URL: /uz/pack/night-market, /ru/…, /en/… (lowercase kebab-case, unique)
     code: "SD—02",                   // short catalogue code shown on cards
     name: "Night Market",            // the pack name is the same in every language
     description: {                   // one or two sentences, in each language
       uz: "…",
       ru: "…",
       en: "…",
     },
     category: { uz: "Ko‘cha", ru: "Улица", en: "Street" }, // /explore filters are built from these
     price: 45000,                    // whole UZS, or null to show "Price soon"
     currency: "UZS",
     uzumUrl: null,                   // see "Uzum Market links" below
     coverImage: null,                // optional; otherwise a cover is composed from the stickers
     featured: true,                  // featured packs are listed first on the homepage
     material: { uz: "…", ru: "…", en: "…" }, // optional; defaults to 135gsm glossy photo paper
    cornerRadius: 0,                 // optional; die-cut corner radius in image pixels (0 = square corners)
    trueToScale: false,              // optional; true keeps the stickers' real size differences
     specs: [{ label: "Size", value: "…" }], // optional extra rows on the pack page
     assets: { dir: "/sticker-packs/night-market", width: 600, height: 800 },
     stickers: [
       { file: "01.png", name: "Lantern", alt: "Red paper lantern with a gold tassel" },
       { file: "02.png", name: "Noodle Cat", alt: "Cat slurping noodles from a bowl", width: 640, height: 640 },
     ],
   }),
   ```

4. Run `npm run dev` and check `/uz`, `/uz/explore` and `/uz/pack/<slug>` (and the `/ru` and `/en` versions). The sticker count is taken from the `stickers` list, and the pack page is prerendered in every language at build time.

Things to know:

- **Order.** Packs appear in the order they're listed. That is the "Featured" sort on `/explore` and the order on the homepage.
- **Homepage.** It covers every pack: featured packs first, then the rest, up to 8, with a "View all packs" link when there are more. With 1–2 packs it uses a large spotlight layout; from 3 packs on it switches to a card grid. A "More collections coming soon" tile fills the grid until there are 8 packs.
- **3D hero.** It shows 18 stickers taken in turn from every pack (first sticker of each pack, then the second, and so on), each labelled with its pack.
- **Sticker shape and size.** Stickers are square-cut unless the pack sets `cornerRadius`; the 3D model, shadows and every preview then follow the rounded cut. Images with different pixel sizes can set `width`/`height` per sticker. Set `trueToScale: true` only when all images were exported at the same print resolution: the stickers are then shown at their real sizes relative to each other (otherwise each one is shown at the same width).
- **Paper.** `material` is shown on cards, on the pack page and in the "Previews are enlarged…" print note, so customers know the stickers are thin, flexible paper rather than thick vinyl.
- **Alt text.** Write `alt` as a short description of what the sticker shows; screen-reader users rely on it. Sticker names and alt text are written once (in English) and shown in every language.
- **Cover image.** `coverImage` is optional: `{ src, width, height, alt }`. Only set it if you have a real photo or artwork of the pack.

`definePack` checks the data when the site builds or runs in dev, and stops with a clear error if a slug is malformed or duplicated, a pack has no stickers, a price isn't a positive whole number, or an Uzum link isn't valid.

## Uzum Market links

Each pack has its own `uzumUrl` in `src/data/packs.ts`. Use the full product-page URL copied from Uzum Market:

```ts
uzumUrl: "https://uzum.uz/ru/product/<product-page-path>",
```

- Every pack must link to **its own** product page. Don't reuse one link for different packs.
- The link must be `https://` on `uzum.uz` (or a subdomain); anything else fails the build.
- `uzumUrl: null` shows a disabled "Not on Uzum yet" button and a note on the pack page instead of a broken link.
- Buy buttons open Uzum Market in a new tab (`rel="noopener noreferrer"`) and are labelled as external links for screen readers.

## Languages

The site is available in Uzbek (Latin script, the default), Russian and English. Every page lives under a language prefix: `/uz`, `/ru`, `/en`.

- **Choosing a language.** A visitor who opens a URL without a prefix (for example `/` or `/explore`) is redirected by `src/proxy.ts`: first to the language they picked before (the `NEXT_LOCALE` cookie set by the UZ / RU / EN switcher in the header), otherwise to their browser language if it is Uzbek, Russian or English, otherwise to Uzbek.
- **Editing text.** All interface text is in `src/i18n/dictionaries/` (`uz.ts`, `ru.ts`, `en.ts`). `en.ts` defines the shape; TypeScript reports any key missing from the other two. `{name}`-style placeholders are filled in by the code. Counts use plural forms (`one` / `few` / `many` / `other`), which matters for Russian (1 стикер, 2 стикера, 5 стикеров).
- **Pack text.** `description`, `category` and `material` in `src/data/packs.ts` take one value per language.
- **Tagline.** "Stick your world." is kept in English in all three dictionaries (`meta.tagline`); change it there to translate it.
- **Fonts.** Space Grotesk and Space Mono have no Cyrillic letters, so Russian pages use Manrope and JetBrains Mono instead (`src/app/globals.css`). Latin-only brand text such as the STICKDOOM wordmark is marked `lang="en"` and keeps the brand fonts.
- **Search engines.** Each page lists its other language versions (`hreflang`), with Uzbek as `x-default`.

## Social links

Set them in `src/config/site.ts`:

```ts
socials: {
  instagram: "https://instagram.com/<handle>",
  telegram: "https://t.me/<channel>",
},
```

While a value is `null`, the footer shows the network name with a "Soon" tag instead of a link.

## Notes

- **3D hero.** The interactive sticker showcase (React Three Fiber) loads after the page is idle and only on devices with WebGL. Before that, and on devices without WebGL, a CSS version is shown with the same controls. It shows one sticker at a time and advances automatically without a pause control. All product information is available without the 3D view.
- **3D viewer on pack pages.** Each pack page has a drag-to-inspect 3D viewer (flip to see the back, reset, full-screen). Thumbnails choose the sticker. Without WebGL the viewer shows the flat image.
- **Images.** Sticker images are served through `next/image` (responsive sizes, modern formats, lazy loading below the fold). The 3D textures use the same optimiser at `quality: 85`; allowed qualities are listed in `next.config.ts`.
- **Static output.** The root layout sets `ensureStatic = "navigation"`, so the build fails if a change accidentally makes a page dynamic.
