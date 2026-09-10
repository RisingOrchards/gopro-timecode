# Hardware acceptance record

**QR acceptance reported; recorded-timecode accuracy and drift validation pending.** On 2026-09-09 the project owner reported a successful scan on a new MISSION 1 with stock firmware and no Labs installation. The exact firmware version was not supplied. The measured acceptance record below remains to be completed.

For each camera/mode, record:

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

1. Verify one short file at each intended capture mode through 240 fps, including fractional versus integer variants. Separately check its embedded timecode base and source timecode rate (Jam supports 23.976 NDF, 24, 25, 29.97 NDF, 30, 50, 59.94 NDF, 60; Device Clock displays at 30). For 8K/60, ensure actual rates match expectations; a camera menu label alone is insufficient. Check slow-motion and conformed media separately.
2. Compare with the source, such as MovieSlate. For a same-iPad Wall Clock workflow compare wall time and account for display-rate differences. Scan while idle. Confirm camera acceptance, then record slate/clap footage.
3. Verify embedded starting timecode, not file creation timestamps. Align in Premiere by source timecode; inspect the visible/audible cue. Repeat jams to estimate repeatability.
4. Run 30–60 minutes and compare the end clap. End error minus start error is the relative drift accumulated in that run. Choose a re-jam interval from results.
5. Repeat after reboot/battery change and in representative temperatures. Measure each camera; don't reuse calibration blindly.
6. If overnight operation is needed, test QR date rollover, fractional NDF daily reset and the source's continuous numbering separately. Jam mode stops at QR midnight by design.
7. Record successful and failed results with sample metadata. Do not infer hardware accuracy from software tests.

The owner's acceptance report does not provide the measurements above. Automated math, lifecycle and QR checks cannot complete this record.
