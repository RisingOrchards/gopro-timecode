# Camera Settings QR

Research date: **2026-09-11**. This extension adds a second static page using the existing QR encoder and visual style. Timecode's clock/reference logic is unchanged. The earlier shoot result applies to Timecode QR; settings commands still need a camera acceptance test.

**Firmware requirement:** settings QR uses GoPro Labs firmware for the selected camera. GoPro’s [Labs overview](https://gopro.com/en/us/info/gopro-labs) explicitly describes special firmware for configuration QR, and its [control index](https://gopro.github.io/labs/control/) lists MISSION configuration under Labs-enabled cameras. The project’s successful stock-firmware timecode tests do not establish support for these configuration commands.

**Hardware report, 2026-09-11:** the project owner scanned a configuration QR on original GoPro firmware and saw “Timecode not synced”; no settings changed. The exact command and numeric firmware version were not provided. The likely explanation is the stock timecode reader rejecting a Labs settings payload, but the exact firmware error path has not been independently confirmed. The UI now states the Labs requirement before the form and links to troubleshooting. On stock firmware, set capture options manually and use Timecode QR to jam. Do not interpret this failed scan as successful camera-settings validation.

## Source decisions

- [GoPro MISSION configurator](https://gopro.github.io/labs/control/mission/) supplies MISSION-specific tokens and the depth/HLG/color choices. Its 8-bit choices omit GP-Log2; the 10-bit, non-HLG choices include it. Its shutter/ISO selection logic hides EV when both are explicitly set and shutter is manual. The HTML retrieved on the research date had SHA-256 `30a51c67429173cf5969bf2023a8e710e4f192f972898a0ac802ba7f4511602e`. No GoPro implementation code is bundled.
- [Settings reference](https://gopro.github.io/labs/control/settings/) and [command language](https://gopro.github.io/labs/control/tech/) verify token spelling and ordered concatenation. Mode comes first so settings apply to the selected capture mode. Numeric FPS tokens select camera modes; they do not independently select integer versus fractional timing.
- [MISSION model comparison](https://gopro.com/en/us/shop/buy-cameras/mission-1-series) provides separate MISSION 1 / PRO / PRO ILS resolution-rate lists. These become explicit capability tables, not a maximum-rate heuristic. Vertical modes are also present in the official MISSION configurator.
- [MISSION Media Mod](https://gopro.com/en/us/shop/mounts-accessories/camera-media-mod/AGFMD-001.html) specifies micro-HDMI output up to 4K60. This informs the Streaming / Live preset’s capture-rate ceiling, not a promise of the negotiated HDMI signal. The [Labs matrix](https://gopro.github.io/labs/) marks HDMI display settings unavailable for MISSION and the [command reference](https://gopro.github.io/labs/control/tech/) scopes `HDMI` to HERO8–13. No `HDMI` command is emitted; clean output and output format are configured on-camera.
- [MISSION PRO ILS announcement](https://investor.gopro.com/press-releases/press-release-details/2026/GoPro-Launches-MISSION-1-PRO-ILS-the-Worlds-Smallest-Most-Rugged-Compact-Cinema-Camera-with-Interchangeable-Lenses/default.aspx) lists supported rectilinear MFT lenses and five specifically profiled fisheye lenses in footnote 3. The checkbox confirms a supported lens and camera setup; it is not limited to prime lenses. ILS shares the PRO capture table but has a separate lens confirmation rule.
- [Release notes](https://gopro.github.io/labs/control/notes/) record the MISSION 2.02.70 Protune/metadata fix, the earlier photo WB/EV fix, and the ILS 3.00.70 removal of broken EXPQ/EXPN/EXPX. These are the documentation baselines for this tool. A blanket claim that stock firmware requires Labs for timecode would contradict the project's field report; no such claim is made.
- [Extensions](https://gopro.github.io/labs/control/extensions/) distinguishes temporary/permanent metadata and documents ALLI/24HZ. This first settings tool emits no metadata extensions. Existing camera timing therefore remains in effect.

## Implemented controls

The mapping below is an overview; `public/settings-capabilities.js` is the allowlist. Free text never enters camera commands.

| Control | Emission / policy |
|---|---|
| Video / Photo | `mV` / `mP`, first in the command |
| Resolution and aspect | `r8T`, `r8`, `r4T`, `r4`, `r14`, `r1`, `r4V`, `r1V`, checked against the chosen model |
| Frame-rate mode | `p24`, `p25`, `p30`, `p50`, `p60`, `p100`, `p120`, `p200`, `p240`; resolution and rate must be specified together |
| Bit depth | `d0` / `d1` for 8 / 10-bit |
| Color | GP-Log2, Natural, Cinematic, Flat, Vibrant; `cL`, `cN`, `cC`, `cF`, `cG` |
| HLG interaction | `hH0` when color or bit depth is set; visible in the UI and command |
| Bitrate | Standard / High: `bS` / `bH`; these are camera presets, not guaranteed Mbps |
| Shutter angle | Auto, 360°, 180°, 90°, 45°, 22°; `s0`, `s360`, `s180`, `s90`, `s45`, `s22` |
| ISO | Range ceiling `iN`, or fixed `iNMN`; N is ISO / 100. Values: 100–6400 in documented doubling steps |
| White balance | Auto, Native, 2300, 2800, 3200, 4000, 4500, 5000, 5500, 6000, 6500K |
| Sharpness | Low / Medium / High: `sL`, `sM`, `sH` |
| EV | −2 to +2 in 0.5 steps, preserving documented decimal syntax such as `x-.5` |
| HyperSmooth | Off / On / AutoBoost: `e0`, `e1`, `e4` |
| Noise reduction | Low / Medium / High: `dL`, `dM`, `dH`; distinct from numeric bit-depth tokens |
| Photo output | RAW on / off: `r` / `r0`; Photo only also offers WB and EV |

Blank fields omit their tokens. GP-Log2 requires explicitly selecting 10-bit. Manual angle requires a rate and is checked against the documented shutter-speed limit. EV with both a manual shutter and explicit ISO is rejected. Partial resolution/rate and partial ISO selections are rejected. Photo rejects video-only settings rather than sending hidden fields to the wrong mode.

Stabilization coverage is intentionally narrower than the camera's possible features: On/AutoBoost is offered here only for 16:9 8K/4K/1080 modes through 60 fps. Unverified Open Gate, vertical and higher-rate stabilization combinations are rejected with a coverage explanation. They are **not declared unsupported by the camera**. Leave stabilization unchanged to configure it on-camera. ILS On/AutoBoost also requires lens confirmation. The tool cannot inspect a lens, firmware or current camera settings.

## Starter presets

The global **Capture target** defaults to **8K 16:9 / 24 fps**. Cinema, Run & Gun and Custom inherit it; Streaming / Live keeps 4K and follows the rate up to 60 fps; Slow Motion and High Frame Rate have fixed overrides. Every preset defaults to 16:9 and resolves into a fresh, editable form. Open Gate remains available as a target or manual choice. Editing any field changes the selector to Custom. The five configured video presets all use 10-bit, High bitrate and Low sharpness. Streaming / Live uses Natural color; the other four use GP-Log2. Noise reduction and EV are left unchanged. ISO is an auto ceiling, not an asserted 100 minimum.

| Preset | Resolution / rate mode | Shutter | WB | ISO ceiling | HyperSmooth |
|---|---|---|---|---|---|
| Production / Cinema | Target (default 8K 16:9 / 24) | 180° | 5500K | 400 | Off |
| Run & Gun | Target (default 8K 16:9 / 24) | Auto | Auto | 1600 | On; Off initially on ILS or outside verified coverage |
| Streaming / Live | 4K 16:9 / target rate, capped at 60 (default 24) | 180° | 5500K | 800 | Off |
| Slow Motion | 4K 16:9 / 60 | 180° | 5500K | 800 | Off |
| High Frame Rate | 4K 16:9 / 120 | 180° | 5500K | 1600 | Off |
| Custom | Target (default 8K 16:9 / 24) | Unchanged | Unchanged | Unchanged | Unchanged |

Changing the target updates the active normal preset. In Custom it changes only resolution and frame rate, preserving other edits. Slow Motion and High Frame Rate keep their capture overrides while selected; once edited into Custom, subsequent target changes update their resolution and rate too. The UI compares the actual capture settings with the target and explicitly explains differences. A 4K30 target therefore produces 4K30 Cinema, Run & Gun and Custom commands, while the two special presets remain 4K60 / 4K120. The angle-based shutter follows the resulting frame rate automatically.

Streaming / Live always starts in 4K 16:9. A target rate of 24, 25, 30, 50 or 60 is inherited; 100/120/200/240 targets explicitly resolve to 60. That override is visible, persists with the selected preset, and never changes the global target itself. Once edited into Custom, the normal Custom target behavior applies. Natural is an application default for live use without a log LUT, not a GoPro-mandated setting. Users can choose GP-Log2 for a live LUT pipeline. The 10-bit and High bitrate selections are camera recording controls; HDMI format, color and bit depth must be verified at the capture device. The preset does not configure an HDMI link or encoder, start a stream, disable sleep, or change audio. See the [HDMI streaming workflow](../public/guide.html#streaming-live).

Unsupported capture pairs remain visible and block command generation instead of silently changing the target. A special preset can still generate its supported override when the target is unavailable on the selected model; both the unavailable target and actual override are shown. Run & Gun switches HyperSmooth Off when its target falls outside the tool’s verified stabilization coverage, with an explanation. Custom stabilization choices are validated without being changed automatically.

Photo mode emits none of the target's video settings. During a session the video draft retains its preset behavior, and target changes apply to that draft when appropriate. Returning from Photo restores that draft. If the page reloads or the camera model changes while in Photo, there is no video draft; returning to Video starts from Custom at the current target.

Exact commands for **MISSION 1 PRO**, with the default 8K24 target:

```text
Production / Cinema
mVr8p24e0d1hH0cLbHw55i4s180sL

Run & Gun
mVr8p24e1d1hH0cLbHwAi16s0sL

Streaming / Live
mVr4p24e0d1hH0cNbHw55i8s180sL

Slow Motion
mVr4p60e0d1hH0cLbHw55i8s180sL

High Frame Rate
mVr4p120e0d1hH0cLbHw55i16s180sL

Custom
mVr8p24
```

Cinema uses the same 8K 16:9 / 24 command on all three supported models. ILS Run & Gun substitutes `e0` for `e1` until the user chooses stabilization and confirms a suitable lens. Photo with RAW, 5500K and +0.5 EV produces `mPrw55x.5`.

**24 does not promise 24.000:** `p24` can select 23.976 with the camera's default broadcast timing. The 180° shutter hint is calculated from the nominal rate; at 23.976 it is approximately 1/47.952 second. Configure exact integer timing separately and check clip metadata. These commands do not change timecode, ALLI, 24HZ or TCAL.

## Intentionally omitted

- Independent ISO minimum: legacy `i(max)M(min)` range semantics explicitly exclude MISSION. The release-notes-only `LMTI` alternative is experimental and lacks the cross-model/mode coverage needed here. Fixed ISO is supported instead.
- 5600K: the published discrete command list includes 5500K, not 5600K. No `w56` is invented.
- Direct shutter fractions via EXPQ/EXPN/EXPX: removed as broken in the current ILS notes. Common documented shutter angles cover the requested approximate 1/48, 1/120 and 1/240 presets. Conflicting uncommon angle choices between the settings list and configurator are also omitted.
- Max bitrate / custom Mbps: `bM` exists but support is conditional on mode; no complete matrix was established. Standard and High remain editable.
- HLG-on presets, digital FOV/zoom/horizon controls, Low Light, timelapse, burst slow motion, 400/480/800/960 modes, and general HERO/MAX profiles: no complete combination validation in this release. Photo resolution/ISO/shutter are configured on-camera.
- Factory reset, preset deletion, formatting, recording actions, arbitrary command entry, network setup and persistent metadata writes are outside this settings form. Reset affects the local form only.
- Named user presets, JSON import/export and share URLs are deferred. Optional last-form local storage is implemented without a backend. All supported settings fit one automatically sized QR, so sequential codes are unnecessary.

## Architecture and verification

| File | Responsibility |
|---|---|
| `public/settings.html`, `public/settings-app.js` | Form state, mode switching, validation feedback, Generate, Copy, Reset, fullscreen and opt-in local storage |
| `public/settings-presets.js` | Global target defaults/validation, preset inheritance and explicit capture overrides |
| `public/settings-capabilities.js` | Immutable model tables and documented token allowlists |
| `public/settings-core.js` | Pure `validate`, `components`, `buildGoProCommand`, shutter hints and versioned state validation |
| `public/qr.js` | Shared canvas renderer; optional automatic sizing for settings, original version-3 default for timecode |
| `tests/settings.test.cjs` | Command fixtures, compatibility, preset independence, individual edits, invalid stored data and QR geometry |
| `scripts/check-browser.cjs` | Optional Playwright integration checks; no runtime/build dependency |

Run `node --test tests/*.test.cjs` and `node scripts/build.cjs`. Existing timecode tests remain in the suite. The command fixtures use tokens from the official references, including the non-extension subset of the documented `mVr4p60x-.5cFw55$BITR=150$LEVL=6` example. Command ordering follows the builder's declared sequence; semantic equivalence does not require matching the reference example's byte order.

For browser checks, start `node scripts/serve.cjs`, then run `node scripts/check-browser.cjs` in a tooling environment with Playwright and Chromium installed. `TEST_BROWSER_CHANNEL=msedge` selects an installed Edge instead. `TEST_BASE_URL` overrides localhost:4173; `TEST_SCREENSHOT_DIR` optionally captures desktop/mobile views. These environment variables are for tests only and are not needed to host the app.

The settings form uses the same-origin local-storage key `igorbox.camera-settings.v1` only after the user opts in. The payload is now version 2 and includes the target and active preset, so special preset overrides survive reload. Version-1 forms migrate to Custom with their existing resolution/rate as the target; Photo or partial video forms use the default target without changing their saved fields. Invalid saved content is rejected. Loading or restoring a page never displays a settings QR automatically. Reset keeps the target, restores Cinema and removes only this key, not unrelated application data. No timecode reference state is persisted by this feature.

Before claiming field validation for Camera Settings QR, record the camera model, exact firmware, lens where relevant, command, acknowledgment and actual resulting menu/clip values. Scan settings first, then jam timecode. Existing camera extensions can override normal controls; the utility neither reads nor clears those extensions.
