# Changelog

## Unreleased

- Added multi-select app list with search, batch uninstall, labels (via cached `dumpsys package` map), installer badges, and detail dialogs populated from `dumpsys package`.
- Expanded file explorer with import/export toasts, multi-select operations, `/storage/emulated/0` normalization, quick-path shortcuts, path bar, and a browseable destination picker for copy/move.
- Backend now exposes package metadata/permissions and quotes all adb shell operations for paths with spaces.
- Upgraded Wails dependency to v2.11.0 and refreshed the Windows cross-build (Go 1.23, Node 20, Zig 0.13) output.
- Documented roadmap items and future tasks in `docs/TODO.md`.
