# Software validation — 2026-09-09

Completed locally before packaging:

- 23 Node built-in tests passed: known payloads, timezone serialization, year/day rollovers, fractional-rate frame boundaries, inverse matching across all eight Jam source rates, capture rates through 240 independent of timecode, invalid input, NDF midnight limits, pause/background/restore behavior, clock changes, rendering errors and QR quiet zones. Mode-switch checks confirm Device Clock immediately restores live time and 30 fps after a Jam, including invalid input, without restarting the QR or retaining the hidden Jam rate.
- Static validation passed: local page/asset links, JavaScript syntax, vendored encoder SHA-256, MIT notices.
- A separate jsQR 1.4.0 decoder read 63 raster fixtures made by the actual canvas-rendering function: 3 dates × 7 UTC offsets × 3 display sizes (592, 330 and 280 pixels). Every decoded string matched the intended payload. The decoder was a validation-only tool and is not shipped or required by the app.
- The local HTTP server returned 200 for the application.
- The README screenshot was captured from the running desktop app in Device Clock mode at 30 fps, with the live QR visible. The captured page was visually inspected for a complete, readable view of the app.
- Social assets were visually inspected at 1200 × 630 and 1080 × 1080. An independent jsQR decoder verified that both PNGs encode `https://timecode.igorbox.com/` at full and half size. Local HTTP checks returned 200 with `image/png`. The static check validates both pages' Open Graph and large-image card metadata against the actual PNG dimensions and canonical URLs. External platforms' cached previews have not been tested.
- The color palette follows the live IgorBox site's forest green `#388f09` and warm charcoal `#12130c`, with the requested black header. Primary button text contrast is 5.51:1 normally and 4.78:1 on hover. The README screenshot was refreshed with the new palette.

## Open-source release review

- Software and original documentation use the included MIT license; package metadata also declares MIT. The vendored QR encoder retains its original MIT notice and verified checksum. IgorBox branding rights are described separately.
- Current release files were checked for common credential formats, private keys, local machine paths and private deployment identifiers; none were found. This is a scoped pattern review, not a guarantee that every possible secret format can be detected.
- Earlier private hosting configuration is excluded from the public branch history. Local environment files, hosting account metadata, logs and build output are ignored. Only `public/` is configured for hosting.
- Source links point to RisingOrchards/gopro-timecode and production links to timecode.igorbox.com. The optional GitHub Pages workflow runs only when manually requested; Vercel configuration contains no account or domain credentials.
- Link-preview crawlers can read public metadata and social images. The existing `noindex, nofollow` HTML and HTTP directives remain in place. Public link previews do not require credentials or client-side execution.

## Production field report — received 2026-09-11

The project owner confirmed that the utility was used on a real MISSION 1 shoot and “worked perfectly.” This follows the stock-firmware QR acceptance report received on 2026-09-09. The app and documentation now label the utility **Field tested**.

The production report provides practical field evidence alongside the software checks above. It did not include numerical offset/drift measurements or per-mode clip metadata. The README screenshot predates the field report and shows the earlier status badge. See [field testing and hardware measurements](HARDWARE_VALIDATION.md) for the recorded results and a procedure for evaluating other setups.

To reproduce the shipped dependency-free checks:

```sh
node --test tests/*.test.cjs
node scripts/check.cjs
```
