

## Change Typography to Roboto

Replace the primary sans-serif font from **Inter** to **Roboto** across the project.

### Changes

1. **`src/index.css`** — Update the Google Fonts import URL from `Inter` to `Roboto` (weights 400, 500, 600, 700). Update `--font-sans` CSS variable.

2. **`tailwind.config.ts`** — Replace `'Inter'` with `'Roboto'` in the `fontFamily.sans` array.

Two files, minimal change.

