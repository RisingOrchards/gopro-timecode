# Field testing and hardware measurements

**Timecode QR is field tested on a real MISSION 1 shoot.** The project owner confirmed successful production use on 2026-09-11.

**Camera Settings QR is owner-confirmed working after a firmware update.** The follow-up report was received on 2026-09-11.

## Reported results

| Report received | Result |
|---|---|
| 2026-09-09 | A new, out-of-the-box MISSION 1 accepted the app's time QR with stock firmware. No GoPro Labs installation was required. |
| 2026-09-11 | The project owner reported: “we used it for a shoot and it worked perfectly.” |
| 2026-09-11 | Camera Settings QR scan on original GoPro firmware displayed “Timecode not synced”; the owner confirmed no settings changed. This was a failed configuration scan, separate from the successful Timecode QR result. Exact command and numeric firmware version were not supplied. |
| 2026-09-11 | Following the configuration-scan failure, the owner reported: “I updated the firmware and everything works perfectly.” This confirms the settings workflow works on the owner's MISSION 1 setup after the update. The firmware build and individual presets tested were not supplied. |

These dates record when the results were reported. The successful shoot establishes practical use of the workflow. Exact firmware versions, per-mode clip metadata and numerical offset/drift measurements were not supplied, so the report does not define a frame-accuracy tolerance for every setup.

Camera Settings QR uses GoPro's documented Labs configuration commands. The firmware update resolved the owner's reported configuration-scan problem. This report does not establish results for every model/preset or a specific HDMI capture chain. The original stock-firmware error is consistent with a timecode-only QR reader rejecting a settings payload; the exact firmware error path has not been independently confirmed. See [settings firmware requirements and troubleshooting](../public/guide.html#settings-timecode-error).

## Measure your setup

Use this optional record when evaluating a new camera/mode or choosing a re-jam interval:

| Field | Measured value |
|---|---|
| Camera model / identifier | |
| Firmware version / stock or Labs | |
| Actual file frame rate / DF or NDF | |
| Integer-rate settings (if any) | |
| Display hardware / OS / browser | |
| Reference device or app / version / source mode / rate | |
| Date / UTC offset / app reference offset | |
| Existing camera TCAL setting | |
| On-camera QR acknowledgment | |
| Premiere version / imported start TC | |
| Signed start-clap error (frames) | |
| Signed end-clap error (frames) | |
| Elapsed recording duration | |
| Derived relative drift / chosen tolerance | |

1. Verify one short file at each intended capture mode through 240 fps, including fractional versus integer variants. Separately check its embedded timecode base and source timecode rate (Jam supports 23.976 NDF, 24, 25, 29.97 NDF, 30, 50, 59.94 NDF, 60; Device Clock displays at the selected capture rate, with high-speed counts as previews). For 8K/60, ensure actual rates match expectations; a camera menu label alone is insufficient. Check slow-motion and conformed media separately.
2. Compare with the source, such as MovieSlate. For a same-iPad Wall Clock workflow compare wall time and account for display-rate differences. Scan while idle. Confirm camera acceptance, then record slate/clap footage.
3. Verify embedded starting timecode, not file creation timestamps. Align in Premiere by source timecode; inspect the visible/audible cue. Repeat jams to estimate repeatability.
4. Run 30–60 minutes and compare the end clap. End error minus start error is the relative drift accumulated in that run. Choose a re-jam interval from results.
5. Repeat after reboot/battery change and in representative temperatures. Measure each camera; don't reuse calibration blindly.
6. If overnight operation is needed, test QR date rollover, fractional NDF daily reset and the source's continuous numbering separately. Jam mode stops at QR midnight by design.
7. Record successful and failed results with sample metadata. Do not infer hardware accuracy from software tests.

Keep measured results alongside the production report. Automated math, lifecycle and QR checks validate software behavior; offset and drift measurements come from the cameras and recordings.
