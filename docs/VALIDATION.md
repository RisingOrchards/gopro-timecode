# Software validation — 2026-09-09

## Display follows capture rate — 2026-09-11

Device Clock now labels its readout **Display timecode** and uses the selected capture rate for frame numbering and ±1f adjustments. Jam labels it **Source timecode** and continues using the independent source rate. Changing capture rate preserves the clock anchor, applied offset/timezone and live/paused QR state. High-speed displays through 240 are previews; supported manual Jam rates still stop at 60. Fractional readouts retain rational NDF counting and explain their difference from wall time.

All **46** Node tests passed, along with the static build. Core/lifecycle checks cover known half-second labels at every integer rate, fractional boundaries, midnight, high-speed padding, frame nudges, mode switching and unchanged QR timestamps across capture selections. Headless Edge browser checks passed for Device Clock and Jam, ongoing QR animation, and high-speed readout fit at 390 and 320 pixels. Desktop and mobile screenshots were visually inspected, and the README screenshot was refreshed at 24 fps. This display change does not claim additional physical sync precision.

## Timecode capture-rate fix — 2026-09-11

The owner reported that changing Camera capture rate stopped the timecode and prevented Start QR. The capture selector was incorrectly connected to the handler that invalidates an edited time reference. It now updates only rate information and the capture annotation; it preserves the applied clock, offset, timezone, running Jam anchor and live/paused QR state.

Three regression tests reproduced the failure before the fix and passed afterward. A fourth verifies that capture edits cannot revive an invalidated reference. All **42** tests passed, along with the static build and headless Edge browser checks. Browser checks cover choosing a rate before Start QR, changing it during live Device Clock and Jam output, preserving a pause, and requiring a new match after changing the actual Jam source rate. This is software verification; a physical camera/browser retest was not reported.

## Camera Settings QR extension — 2026-09-11

- A configuration QR scan on original GoPro firmware returned “Timecode not synced” and applied no settings, as confirmed by the project owner. The settings page, README and guide now state the GoPro Labs firmware requirement explicitly and provide a manual-settings workflow for stock firmware. This records a failed stock configuration scan, not a failure of the field-tested Timecode QR. Successful configuration scanning on Labs firmware remains unverified on hardware.

- Capture target defaults to 8K 16:9 / 24 fps. Cinema, Run & Gun and Custom inherit it on all three models; Slow Motion keeps 4K60 and High Frame Rate keeps 4K120 with visible override feedback. All supported model/target combinations were exercised for the three target-following presets. The documentation screenshot was refreshed. ILS lens confirmation follows GoPro’s current supported-lens guidance, including its specifically profiled fisheyes.

- Streaming / Live defaults to 4K 16:9, target rate up to 60 fps, Natural color, 10-bit, 5500K, 180° shutter, Auto ISO up to 800 and stabilization Off. All three models and every target rate were exercised, including explicit 60 fps overrides for higher targets. Browser checks cover persistence, Photo/Video transitions, editable color, QR invalidation and desktop/mobile layout. HDMI setup remains manual; successful HDMI capture has not been verified on hardware. The source references and setup steps are in the guide.

- All **42** Node tests passed: 27 timecode tests and 15 settings tests. Settings checks cover explicit preset command fixtures, target inheritance and overrides, model/resolution/rate limits, GP-Log2 depth, ISO/shutter/EV rules, ILS lens confirmation, Photo isolation, per-field command changes, versioned state migration, malformed stored state, command injection and QR quiet zones.
- Static validation and build passed for all three pages, including settings scripts, navigation/assets, Open Graph metadata and unchanged vendored encoder checksum.
- Playwright checks passed using installed Edge in headless mode at 1280, 390 and 320 pixels. They exercised every preset, shared targets and special overrides, custom edits, QR invalidation, incompatible target/model changes, Photo/Video target transitions, opt-in storage/reload/reset and legacy migration, ILS confirmation, native fullscreen and the CSS fallback, clipboard API handling with a test sink and manual-copy fallback, and navigation back to a live timecode QR. No page errors or horizontal overflow were observed. Desktop and mobile captures were visually inspected. This is not a physical iPad/Safari test.
- An independent jsQR decoder read **80** settings raster fixtures: six presets on three models, a longer advanced command and a Photo command, each at native size and 390, 280 and 220 pixels. All decoded strings matched the generated command.
- No new application or build dependency was added. `scripts/check-browser.cjs` is optional and uses a separate Playwright tooling environment.

These checks verify software output. Camera Settings QR has not yet received the hardware shoot validation recorded for Timecode QR. See [camera-settings research and omissions](CAMERA_SETTINGS.md) for the documented scope.

## Original timecode release

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
