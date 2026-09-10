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
- True 24/30/60 use an integer clock model. Capture support is documented, but matching embedded MISSION timecode has not been tested here. The official generator includes a fractional 60-family preview; 59.94 NDF uses the same 60000/1001 conversion. High-frame-rate capture and embedded timecode can have different timebases, so validate a file from the intended 8K/60 mode.
- `oTI0` is retained from the current generator. No claim is made about its undocumented camera-side semantics.
- Fixed UTC offset includes DST; `oTD0` is deliberate. Metadata reports that fixed offset, not a named timezone with automatic future DST transitions.
- A manual offset can make the camera’s wall-clock metadata differ from real civil time. The UI shows that QR clock alongside predicted timecode.
- MovieSlate's [user guide](https://www.movie-slate.com/ms_online/UserGuide/HTML_docs/help_hd.html?block_526=) confirms Wall Clock uses device Date & Time and warns about fractional NDF. Both apps on one iPad therefore share a wall-time reference. Matching frame labels and recorded camera accuracy do not follow automatically. Device Clock displays at 30 fps; Jam exposes the source rate. No private API, Bluetooth or LTC input is implemented.
- Current Labs matrix also marks M1/M1P LTC support; older feature pages may lag. The prior conversation’s blanket LTC exclusion should not be treated as current. LTC is outside this utility’s scope.

## Original implementation choices

GoPro’s [MISSION 1 Series specs](https://gopro.com/en/us/shop/buy-cameras/mission-1-series) list capture mode families through 240 as 24/25/30/50/60/100/120/200/240, with resolution and model restrictions. The UI offers those capture rates and corresponding broadcast fractional variants. Capture cadence is independent of source timecode; high-speed choices do not fabricate 120/240 fps timecode tracks. Capture and Jam rate default to 30. Source Timecode Rate is shown only under Jam; Device Clock uses a fixed 30 fps display and frame nudge. The QR command does not include a camera frame-rate setting.

## Stock firmware observation

On 2026-09-09 the project owner reported that the utility works on a new, out-of-the-box MISSION 1 without installing GoPro Labs. This is direct user-reported QR acceptance, not a documentation inference. The firmware version and exact model variant were not captured beyond MISSION 1. The setup instructions now start with stock firmware. Embedded MP4 timecode accuracy, repeatability, high-speed behavior and drift remain pending measured validation; do not extend this single report to every GoPro model or firmware.

The app code is independently written, not copied from the GoPro generator. Unlike its legacy rate labels, selections distinguish fractional and true integer rates. QR output has a four-module quiet zone. Applied clock state uses a monotonic anchor. Invalid input or discontinuities invalidate output; calibration is deliberately not persisted across reloads. These are engineering choices, not GoPro protocol requirements.
