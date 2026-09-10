# Automatic MovieSlate sync: verified route and implementation boundary

The current release implements manual matching and device-clock offsets. An automatic LTC receiver is **not yet implemented**. No microphone permission is requested by the current app.

## Feasible client-only route

```text
MovieSlate Pro on iPad/iPhone
  → wired LTC audio output / compatible output adapter
  → appropriate cable and audio input (for example a USB audio interface)
  → browser LTC decoder on a second device
  → automatically maintained reference clock
  → live GoPro Labs precision-time QR
  → cameras scan once and then free-run
```

MovieSlate explicitly confirms [wired LTC output](https://www.movie-slate.com/FAQs/10697/111/148/). Its [Timecode Sync specifications](https://www.movie-slate.com/Specifications) list wired LTC rates of 23.976, 24, 25, 29.97 DF/NDF and 30 DF/NDF. This is separate from the broader set of slate-display rates. Do not assume that selecting 60 on the slate produces 60 fps LTC; verify the actual signal and label behavior first. A 60/120/240 fps camera may still use a lower timecode base.

Browser audio input is available through [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), with permission and a secure origin such as HTTPS or localhost. A future decoder could process that signal locally; the hosting provider would not need to receive the audio.

## Conditions to resolve with the production setup

- Which device displays the QR? A laptop with a real audio input is a straightforward architecture to validate. Phone/tablet support depends on audio adapters, routing and browser behavior.
- Is MovieSlate sending free-running LTC continuously, or a start/stop/rec-run source? QR output must not coast silently through an intentional timecode stop or jump.
- What LTC rate and DF/NDF flag actually arrive? Decoding must validate these and any high-frame-rate pairing convention; it must not infer a 60 fps LTC stream from an 8K/60 capture label.
- What adapter and input levels are available? A headphone-only laptop jack cannot receive audio. Avoid clipping and speech processing. Use a direct electrical feed rather than acoustic speaker-to-microphone pickup for timing work.
- What is the measured end-to-end offset? Audio capture buffering and screen/camera latency remain even after removing human reaction time.

Running both apps on the same iPad does not automatically give Safari access to MovieSlate’s internal audio. A same-device route would need verified hardware loopback or an explicit app integration; no public browser-readable MovieSlate timecode API was verified in this research. MovieSlate-to-MovieSlate WiFi support is not evidence of an open web API.

## Proposed receiver behavior

Keep Jam and Device Clock modes. Add a separately selected “LTC audio input” mode with an input/channel selector, decoded timecode, signal level, verified rate/DF indicator, and explicit states: no signal, acquiring, following, lost signal. Require consecutive valid frames before showing QR. Blank the QR on invalid signal, rate change, discontinuity, sleep or device removal; do not silently drift on a lost source. Use a selectable reference date because LTC does not inherently establish the camera calendar date.

Use sample timing to maintain the reference and expose a measured latency correction. Preserve the capture/timecode separation. At 59.94/60 capture with 29.97/30 LTC, do not simply multiply timecode labels without verifying the intended camera timebase.

The implementation would also need to permit an explicitly requested audio input in the hosting Permissions Policy, currently disabled by the static app. Confirm decoder licensing, independent encoded-audio fixtures and physical MovieSlate/camera tests before treating this route as production ready.

Continuous LTC following would keep the **browser reference** current. Each GoPro scan would still be a jam; this would not genlock cameras or continuously transmit timecode to them.
