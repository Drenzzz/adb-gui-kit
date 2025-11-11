# ADBKit 

A simple, modern GUI for ADB and Fastboot. 
Built with Wails (Go + React) for a fast, lightweight.

---

##  Features

* **Polished UX**
    * Welcome/loading screen.
    * Integrated light/dark theme toggle.
* **Dashboard**
    * Unified connected-device list with editable nicknames (stored locally).
    * Rich device info card.
    * Wireless ADB, connect/disconnect via IP/port, and quick status refresh.
* **Terminal (Universal Shell)**
    * Run `adb`, `adb shell`, or `fastboot` commands from a terminal.
* **Utilities**
    * One-click reboot actions (system, recovery, bootloader) with automatic ADB/Fastboot detection.
* **App Manager**
    * Install APKs from your computer.
    * Uninstall packages by name with confirmation dialog.
* **File Explorer**
    * Browse the `/sdcard/` directory.
    * **Import:** Upload files from PC to device.
    * **Export:** Download files/folders from device to PC.
    * Includes loading and empty-folder states.
* **Flasher**
    * Flash `.img` files to specific partitions (e.g., `boot`, `recovery`).
    * Wipe Data (factory reset) with safety confirmation.
    * Flash ZIP packages through `adb sideload` while in recovery mode.

---

## Screenshots

* About Screenshots [see here](screenshots/README.md)

---

##  Installation

1.  Go to the **[Releases](https://github.com/drenzzz/adb-gui-kit/releases)** page.
2.  Download the `.zip` file.
3.  Unzip the file.
4.  **IMPORTANT:** Keep the `ADB-Kit` executable in the same folder as `bin/windows/` (on Windows) or `bin/linux/` (on Linux) so the bundled platform tools (`adb`, `fastboot`, etc.) can be found.
5.  Run the application.

---

##  Tech Stack

* **Framework:** Wails v2
* **Backend:** Go
* **Frontend:** React (via Astro) & TypeScript
* **UI:** shadcn/ui & Tailwind CSS

---

##  Building from Source

1.  Ensure you have Wails dependencies: `wails doctor`
2.  Install frontend dependencies:
    ```bash
    cd frontend
    pnpm install
    cd ..
    ```
3.  Run in development mode:
    ```bash
    wails dev
    ```
4.  Build for production:
    ```bash
    wails build
    ```
