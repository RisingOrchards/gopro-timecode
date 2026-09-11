# Verification notes — 2026-09-09

These are documentation findings, not camera-test results. The cached conversation was treated as a lead and checked against current primary sources before implementation.

| Question | Primary evidence | Decision |
|---|---|---|
| Does MISSION 1 support this QR route? | [GoPro Labs matrix](https://gopro.github.io/labs/) lists M1P/M1 time/date/timecode QR support. Separately, the project owner reported successful QR acceptance on a new stock MISSION 1 on 2026-09-09 | Stock firmware is sufficient for the reported MISSION 1 workflow; no mandatory Labs installation |
| Exact command? | [Command language, Time and date](https://gopro.github.io/labs/control/tech/) specifies fractional-second `oT`, daylight saving flag and signed timezone fields | Emit numeric-only date/time commands |
| How does animation work? | [Official source](https://github.com/gopro/labs/blob/master/docs/control/precisiontime/README.md) constructs `oT...oTD...oTZ...oTI...` and schedules `requestAnimationFrame` | Fresh payload each animation frame; `oTI0` matches the current generator |
| Fractional-rate reference? | Same source divides seconds since local midnight by 1.001 before calculating its 24/30-family labels; 25 is unscaled | Use exact rational rates and separate integer modes |
| Integer capture? | [Extensions](https://gopro.github.io/labs/control/extensions/) document 24HZ and ALLI; [MISSION release notes](https://gopro.github.io/labs/control/notes/) include related timing fixes | Configure capture separately; verify integer-mode MP4 timecode |
| Drift/calibration? | [Precision Time](https://gopro.github.io/labs/control/precisiontime/) recommends a fresh scan near the shoot; extensions document signed TCAL milliseconds | No numerical accuracy guarantee, no automatic TCAL writes |
| MovieSlate controls? | [Keypad FAQ](https://www.movie-slate.com/FAQs/10544/9/10/) and [Slate features](https://www.movie-slate.com/slate/) describe Clock/manual entry and rates | Offer clock offset and manual readout matching |
| Premiere sync? | [Adobe multicamera guide](https://helpx.adobe.com/premiere/desktop/edit-projects/set-up-multi-camera-sequences-for-editing/create-a-multi-camera-source-sequence.html) | Verify actual source TC before synchronizing by Timecode |

Official generator source retrieved from `https://raw.githubusercontent.com/gopro/labs/master/docs/control/precisiontime/README.md` on the verification date. Download SHA-256: `068608bd261c79897f8ad68402d83f1936752bf0ad3c2d960944ac36db983274`. This identifies the inspected bytes, not a firmware build. The file is not redistributed. Upstream links can evolve.

## Explicit inference boundaries

- The older Precision Time page footer excludes MISSION; the newer compatibility matrix resolves model support. That does not establish app-specific accuracy.
- The mathematical NDF conversion is derived from the generator preview. It is not a public specification of every camera’s MP4 `tmcd` implementation.
- True 24/30/60 use an integer clock model. Capture support is documented and successful production use was reported on 2026-09-11; rate-by-rate embedded MISSION timecode measurements were not supplied. The official generator includes a fractional 60-family preview; 59.94 NDF uses the same 60000/1001 conversion. High-frame-rate capture and embedded timecode can have different timebases, so validate a file when using a new capture mode.
- `oTI0` is retained from the current generator. No claim is made about its undocumented camera-side semantics.
- Fixed UTC offset includes DST; `oTD0` is deliberate. Metadata reports that fixed offset, not a named timezone with automatic future DST transitions.
- A manual offset can make the camera’s wall-clock metadata differ from real civil time. The UI shows that QR clock alongside predicted timecode.
- MovieSlate's [user guide](https://www.movie-slate.com/ms_online/UserGuide/HTML_docs/help_hd.html?block_526=) confirms Wall Clock uses device Date & Time and warns about fractional NDF. Both apps on one iPad therefore share a wall-time reference. Matching frame labels and recorded camera accuracy do not follow automatically. Device Clock's display follows the capture selector; Jam exposes the independent source rate. No private API, Bluetooth or LTC input is implemented.
- Current Labs matrix also marks M1/M1P LTC support; older feature pages may lag. The prior conversation’s blanket LTC exclusion should not be treated as current. LTC is outside this utility’s scope.

## Original implementation choices

GoPro’s [MISSION 1 Series specs](https://gopro.com/en/us/shop/buy-cameras/mission-1-series) list capture mode families through 240 as 24/25/30/50/60/100/120/200/240, with resolution and model restrictions. The UI offers those capture rates and corresponding broadcast fractional variants. Capture cadence is independent of source timecode; high-speed choices do not fabricate 120/240 fps timecode tracks. Capture and Jam rate default to 30. Source Timecode Rate is shown only under Jam. Device Clock's display and frame nudge follow the capture selector, with high-speed counts labeled as previews and fractional rates using rational NDF counting. The QR command does not include a camera frame-rate setting.

## Field observations

On 2026-09-09 the project owner reported that the utility works on a new, out-of-the-box MISSION 1 without installing GoPro Labs. The setup instructions therefore start with stock firmware.

On 2026-09-11 the project owner confirmed successful use on a real shoot, reporting that it “worked perfectly.” This adds production experience to the earlier QR acceptance result. Both dates are report dates. Firmware versions, per-mode MP4 metadata and numerical offset/drift measurements were not supplied. See the [field testing record](HARDWARE_VALIDATION.md) for the results and a measurement procedure for other setups.

The app code is independently written, not copied from the GoPro generator. Unlike its legacy rate labels, selections distinguish fractional and true integer rates. QR output has a four-module quiet zone. Applied clock state uses a monotonic anchor. Invalid input or discontinuities invalidate output; calibration is deliberately not persisted across reloads. These are engineering choices, not GoPro protocol requirements.
