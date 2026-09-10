# IgorBox Timecode

**Use the app: [timecode.igorbox.com](https://timecode.igorbox.com/)**

Source: [RisingOrchards/gopro-timecode](https://github.com/RisingOrchards/gopro-timecode). Hosted on Vercel.

A small, static GoPro precision date/time QR utility with **Device Clock** and manual **Jam** modes. No framework, build dependencies, backend, pairing, analytics or CDN. One vendored MIT QR encoder. The software is MIT licensed.

![IgorBox Timecode in dark mode, showing Device Clock at 30 fps and the live GoPro time QR](docs/images/app-screenshot.jpg)

*Preview image only. Open [timecode.igorbox.com](https://timecode.igorbox.com/) to scan a current, animated QR.*

The app and documentation use IgorBox's forest green and warm charcoal palette, a black header and the locally bundled silver logo. Button shades are adjusted for readable contrast. The animated QR retains black modules and a white quiet zone for scanning. Branding can be replaced in `public/assets/igorbox-logo.png` and the two HTML headers; logo rights are separate from the code's MIT license.

**Status: v0.1.0, documentation verified on 2026-09-09.** The project owner reports successful QR acceptance on a new, out-of-the-box MISSION 1 with stock firmware; **GoPro Labs installation is not required for that workflow**. The exact stock firmware version was not recorded. Recorded timecode accuracy and drift remain to be measured. The app uses the viewing device's clock or a manually matched reference; it does not receive LTC or automatically follow an external source.

## Run

Open `public/index.html` directly for a local/offline copy, or use any static HTTP server. Node 22+ provides the included server and tests:

```sh
node scripts/serve.cjs
# http://127.0.0.1:4173
node --test tests/*.test.cjs
node scripts/check.cjs
```

No package installation is required. `npm start` and `npm test` are aliases. The optional `npm run build` (or `node scripts/build.cjs`) validates and copies `public/` to `dist/`; Vercel, GitHub Pages and Cloudflare Pages can serve `public/` directly. `private: true` prevents accidental npm publication, not open-source use. Modern Safari, Chromium or Firefox with canvas and animation frames is needed. Fullscreen/wake lock are progressive enhancements, usually requiring HTTPS or localhost. Offline use means downloading `public/`; this is not an installable PWA with an offline cache.

The local server listens on all IPv4 interfaces (`0.0.0.0`) and prints its network addresses. To open it on an iPad on the same network, use the computer's LAN address and port 4173. The ordinary HTTP LAN page supports the current QR workflow; browser features that require HTTPS, such as wake lock or a future audio input, may be unavailable there.

## Quick workflow

**Defaults:** Device Clock, 30 fps camera capture and a 30 fps reference display. **Source Timecode Rate** appears only when **Jam** is selected and initially uses 30. Device Clock always displays at 30 fps; switching back from Jam does not retain a hidden source rate. The camera capture selector includes 24, 25, 30, 50, 60, 100, 120, 200 and 240 fps mode families, with fractional choices 23.976, 29.97, 59.94, 119.88 and 239.76. For 8K/60, choose your actual 60 or 59.94 capture mode. Available modes depend on model and resolution; see [GoPro’s specs](https://gopro.com/en/us/shop/buy-cameras/mission-1-series).

**Capture fps and timecode fps are separate.** For example, 240 fps capture and a 60 fps Jam source gives four captured frames per timecode frame. The capture choice displays this relationship without changing the timecode or QR math. Under Jam, set Source Timecode Rate to the actual source rate. This version supports source labels through 60 fps and NDF only. Do not select NDF against a drop-frame source. The Device Clock readout's 30 fps does not change camera recording rates: the QR contains date/time, not a frame-rate command. Verify original and slow-motion/conformed clips separately.

1. Use your MISSION 1 with its stock firmware and select the intended capture mode. Check its acknowledgment of the live QR. Set the capture selector to the actual rate; confirm original test-clip metadata because menu labels can hide fractional rates.
2. Leave **Device Clock** selected to use the current time on the device showing this page. Confirm the production UTC offset and start with a **0 ms** reference offset.
3. To match a different reference, select **Jam**, set **Source Timecode Rate**, enter a future timecode and press **Jam now** when that source reaches it. Manual matching includes reaction time.
4. Use milliseconds or ±1f to adjust, then apply the reference. Positive offset advances the QR clock. The selector only changes the reference math; it does not configure cameras. Settings reset on reload.
5. Start the QR and show it to each idle camera. Wait for on-camera acknowledgment, then move the camera away. The browser cannot know whether the camera accepted it. Scan the animation, never a screenshot.
6. Record a slate/clap and verify initial alignment and end-of-take drift. Re-jam before setups and after power, battery or frame-rate changes. Backgrounding pauses the QR and requires reapplying the reference.

Switching from Jam back to **Device Clock** immediately restores the live clock with the displayed offset. The hidden Jam rate no longer affects it. The QR remains stopped until **Start QR** is pressed.

Use the included [Documentation](public/guide.html) for Device Clock and Jam workflows, a MovieSlate example, MISSION 1 + Premiere Pro instructions, drift measurement and troubleshooting. It is linked in the app and remains available offline.

### Example: MovieSlate on the same iPad

Set MovieSlate to **Clock / Wall Clock** and use **Device Clock** here on the same iPad, with the device timezone and zero offset. Both use the iPad's time reference, so a manual match is unnecessary. At integer rates such as 30 or 60 they share wall-clock seconds; a 60 fps slate has different frame digits from this app's 30 fps display. The [MovieSlate user guide](https://www.movie-slate.com/ms_online/UserGuide/HTML_docs/help_hd.html?block_526=) documents its wall-clock source and fractional NDF limitations. Confirm actual camera alignment with a slate test.

The page uses the viewing iPad's clock even when hosted by another computer or Vercel. It makes no internet time request. Returning from another app requires **Apply reference**, then **Start QR**. At fractional NDF rates, check numbering explicitly; a shared wall clock does not resolve a DF/NDF mismatch. Use Jam for custom or external timecode. See the [same-iPad example](public/guide.html#movieslate-example).

Automatic matching from MovieSlate Pro is feasible via a wired LTC audio input and a future browser decoder. It is not implemented in this release. See [automatic-sync research](docs/AUTO_SYNC.md) for the verified signal path, documented LTC-rate limit, same-device constraints and validation needed.

## What was verified

- GoPro’s [current Labs matrix](https://gopro.github.io/labs/) marks **Time/date/timecode QR Code** supported for MISSION 1 / MISSION 1 PRO. This documents Labs compatibility; it does not imply Labs is required. The project owner's stock MISSION 1 acceptance report is separate field evidence.
- The [Precision Time page](https://gopro.github.io/labs/control/precisiontime/) animates a date/time QR. Its older May 2025 compatibility footer omits MISSION; the newer main matrix explicitly includes it.
- The [command reference](https://gopro.github.io/labs/control/tech/) and [generator source](https://github.com/gopro/labs/blob/master/docs/control/precisiontime/README.md) establish the payload format. See [research notes](docs/RESEARCH.md) for the evidence, assumptions and limitations.

```text
oTYYMMDDhhmmss.sssoTD0oTZ<timezone>oTI0

# Example: September 9, 2026, 13:00:00.125, UTC
oT260909130000.125oTD0oTZ0oTI0
```

`oT` uses camera-local calendar fields with three millisecond digits. `oTZ` accepts signed hours or minutes; this app sends hours for integral-hour zones and minutes otherwise. Its fixed production offset already includes DST, so `oTD0` avoids double counting. `oTI0` follows the current official generator; no extra meaning is assumed. No frame rate, record control, `TCAL`, or persistent camera customization is sent. A scan changes the camera’s date/time and timezone information, not merely this app’s display.

## Timecode model

Rates are represented as exact rationals, not rounded decimal clocks:

| Selection | Actual frames/second | Label base | Frame duration |
|---|---:|---:|---:|
| 23.976 NDF | 24000/1001 | 24 | 41.708333 ms |
| 24 | 24 | 24 | 41.666667 ms |
| 25 | 25 | 25 | 40 ms |
| 29.97 NDF | 30000/1001 | 30 | 33.366667 ms |
| 30 (default) | 30 | 30 | 33.333333 ms |
| 50 | 50 | 50 | 20 ms |
| 59.94 NDF | 60000/1001 | 60 | 16.683333 ms |
| 60 | 60 | 60 | 16.666667 ms |

For elapsed milliseconds `t` since the QR clock’s local midnight:

```text
frameCount = floor(t × numerator / (1000 × denominator))
```

Format that frame count in the nominal label base. At wall time 01:00:00.000, 29.97 NDF yields `00:59:56:12`, not `01:00:00:00`. This numbering effect is separate from oscillator drift. MovieSlate clock mode may use a different starting convention; compare readouts or match manually instead of assuming equal “TOD” settings mean equal TC.

Manual matching inverts the equation to find a QR clock timestamp at the beginning of the requested frame, rounded up to a representable millisecond. For `01:00:00:00` at 29.97 NDF it encodes a QR clock starting at `01:00:03.600`. The adjusted QR clock then advances in real milliseconds using `performance.now()`. The visible “QR clock” exposes that deliberate offset.

**Midnight:** a daily GoPro clock mapping resets at QR midnight. Fractional NDF has not yet reached 24 nominal hours at that point; the last approximately 86 seconds of nominal labels cannot be represented. Manual matching rejects that unreachable range, and manual references stop at a QR-date rollover. Device-clock mode follows the daily reset. This utility does not claim uninterrupted arbitrary SMPTE free-run across midnight.

True 24/30/60 camera timecode is an explicitly labeled inference from integer capture support and the time-of-day model, not a measured MISSION result. GoPro documents [24HZ and ALLI](https://gopro.github.io/labs/control/extensions/) for integer capture. Verify actual file rate and embedded timecode in every intended mode before trusting the readout.

## Accuracy, jam sync and genlock

QR jam establishes an initial time relationship; cameras then free-run. It does not genlock sensor readout/exposure cadence, continuously distribute timecode, discipline oscillators or fix drift within a clip.

No ±1-frame or hourly-drift guarantee is made. Measure start/end slates over 30–60 minutes with your exact firmware, display and settings. Compare initial offset separately from the change over time. Repeated measurements determine the usable re-jam interval. Example only: 10 ppm relative drift is 36 ms/hour, approximately 1.08 frames at 29.97.

QR updates follow animation frames with fresh timestamps. There is no invented latency compensation. The QR has error correction M and a four-module white quiet zone. It is hidden on pause, edits, backgrounding, restore, clock jumps over 250 ms, display stalls over 200 ms and rendering over 100 ms. A browser/OS freeze can retain old pixels until code runs again, so these are detection measures, not a real-time guarantee. Do not scan a frozen display. Millisecond fields do not imply millisecond physical accuracy.

## Premiere Pro

Import original clips and verify actual rates and starting timecodes. Choose **Use Media Source** for timecode display. Select clips in the Project panel, then **Clip → Create Multi-Camera Source Sequence → Timecode**. Preserve hour matching for a shared reference. Check clap/slate alignment at both ends. If media lacks usable embedded timecode, align using a clap, clip markers or common audio and resolve the acquisition problem; this app does not write metadata into files. Independently sync any separate audio recorder.

Sources: Adobe’s [source timecode display](https://helpx.adobe.com/premiere/desktop/organize-media/apply-labeling/choose-timecode-display-format.html) and [multicamera workflow](https://helpx.adobe.com/premiere/desktop/edit-projects/set-up-multi-camera-sequences-for-editing/create-a-multi-camera-source-sequence.html); MovieSlate’s [keypad instructions](https://www.movie-slate.com/FAQs/10544/9/10/) and [rates](https://www.movie-slate.com/slate/).

## Hosting

All paths inside `public/` are relative, including the guide, so the app works below a repository path. Only deploy `public/`; the source, tests and hosting metadata need not be publicly served.

### Vercel

The production app is live at **[timecode.igorbox.com](https://timecode.igorbox.com/)** on Vercel. The included `vercel.json` selects no framework, skips package installation, validates the static files and publishes `public/`.

To deploy your own copy, import your repository into Vercel or run `vercel deploy` from this directory after signing in with Vercel CLI. Test with the project's `.vercel.app` address, then add your domain in the Vercel project settings and apply the DNS records Vercel provides. Update the HTML canonical URLs and package homepage for a separately hosted fork. See [Vercel deployment](https://vercel.com/docs/cli/deploying-from-cli) and [domains](https://vercel.com/docs/cli/domains).

Pages request `noindex, nofollow` for a discreet deployment. `robots.txt` allows crawlers to read the sharing metadata, images and indexing instructions. These are indexing preferences, not authentication: anyone with the public URL can open the app. See [Google's noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

### Link previews and share images

Both pages include [Open Graph metadata](https://ogp.me/) and an X/Twitter large-image card, with absolute production URLs and image descriptions. The same assets can be shared manually:

- [Landscape card, 1200 × 630](public/assets/og-image.png) — used for automatic link previews.
- [Square share card, 1080 × 1080](public/assets/share-card.png) — for image posts and other square placements.

The artwork's QR opens **https://timecode.igorbox.com/**; it contains no camera clock-setting command. The animated QR inside the app performs time sync.

Editable artwork is in `docs/social/`. Run `node scripts/social-card.cjs` to regenerate both SVGs using the existing logo and vendored QR encoder. To also regenerate PNGs, use `--png` in a tooling environment with `sharp` installed. PNGs are checked in, so ordinary builds and hosting require no image tooling or added dependencies. The layout uses system sans-serif fonts; it does not bundle IgorBox's website font.

Link previews become available after these files are pushed and deployed. Platforms may cache a previous preview; a cached result does not update until that platform fetches it again. The included static check validates page metadata, local image existence and PNG dimensions; platform-specific preview rendering must be checked after deployment.

### GitHub Pages

For an alternative to Vercel, choose **Settings → Pages → Source → GitHub Actions**, then manually run **Publish GitHub Pages** from the repository's Actions tab. The optional `.github/workflows/pages.yml` tests the app and uploads `public/`; it does not publish automatically on push. No bundling or package installation. The separate CI workflow checks pushes and pull requests. Publishing audience is determined by your GitHub Pages settings. See [GitHub’s publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Cloudflare Pages

Import the repository, choose framework **None**, production branch **main**, build command **`exit 0`**, and output directory **`public`**. Or use Direct Upload with the contents of `public/` at the upload root. No Functions, environment secrets or account integration. See [Cloudflare’s static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/). The optional `_headers` file sets a same-origin content policy; GitHub Pages ignores it.

The optional `node scripts/build.cjs` produces a plain `dist/` copy for hosts that prefer that directory. No hosting account or project identifier is included in the source.

## Repository layout

```text
public/                 Deploy this directory; also opens directly
  index.html            Working surface
  app.js                UI and timing lifecycle
  core.js               Pure reference/timecode/payload math
  qr.js                 Canvas renderer
  guide.html            Offline documentation
  assets/               Locally bundled IgorBox branding
  vendor/               Pinned qrcode-generator 1.4.4 + MIT notice
tests/                  Node built-in tests; no dependencies
scripts/                Local server and static integrity check
docs/                   Research and hardware acceptance checklist
.github/workflows/      CI and optional GitHub Pages publication
```

Contributions should preserve the plain static app and keep protocol/timebase logic testable. Report hardware results with the model, firmware, rate, zone, display, initial error and end error. Never present a browser-side test as a camera sync measurement.

## License

The software and original documentation are released under the **MIT License**. See [LICENSE](LICENSE). The vendored QR encoder is also MIT licensed; retain its separate copyright notice in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `public/vendor/qrcode.LICENSE`.

The supplied IgorBox logo and trademark are excluded from the software license. Replace branding for separately branded forks. GoPro firmware/docs are not bundled or relicensed. This project is not endorsed by GoPro, MovieSlate/PureBlend Software or Adobe.

No credentials, deployment account identifiers or environment files are required. Keep local credentials and hosting metadata out of commits; `.gitignore` excludes `.env*`, `.vercel/`, `.openai/` and logs. Deploy only `public/`, which contains the app, documentation and local assets. The app makes no network requests for timecode and stores no calibration or personal data.
