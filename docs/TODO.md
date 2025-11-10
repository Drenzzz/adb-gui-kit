## TODO / Roadmap

### File Explorer Improvements
- [x] Replace manual destination text boxes with a browsable folder picker when copying or moving.
- [x] Normalize device paths so `/sdcard` and `/storage/emulated/0` resolve to the same location, and add quick-jump shortcuts.
- [ ] Offline caching and better error messages when shell commands fail mid-transfer.

### Application Manager Enhancements
- [x] Display human-readable app labels and installer/source metadata.
- [x] Add detail drawer with version info, install times, sizes, and permissions.
- [ ] Surface app icons and Play/F-Droid links directly in the grid.
- [ ] Expose APK export hooks (open in SDK/WSA, share to desktop tools).

### Backups & Advanced Device Workflows
- [ ] App/data backup plus restore (with root-only enhancements when available).
- [ ] Bulk uninstall/report export (CSV/JSON).
- [ ] Root utilities (freeze, component toggle, logcat filters per app).

### Release Engineering
- [ ] Keep `CHANGELOG.md` up to date for every feature/fix.
- [ ] Add automated CI build steps (Linux + Windows targets).
- [ ] Document contributor setup steps (Go/Node/Zig versions) in `README`.
