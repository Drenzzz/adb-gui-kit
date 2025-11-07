# ADB-Kit 

A simple, modern GUI for ADB and Fastboot. 
Built with Wails (Go + React) for a fast, lightweight.

---

##  Features

* **Dashboard:**
    * View connected device info (Model, Battery, Status).
    * Auto-detects ADB & Fastboot devices.
* **Utilities:**
    * One-click reboot buttons (Reboot, Recovery, Bootloader).
* **App Manager:**
    * Install APKs from your computer.
    * Uninstall packages by name.
    * Includes a confirmation dialog to prevent mistakes.
* **File Explorer:**
    * Browse device `/sdcard/` directory.
    * **Push:** Upload files from PC to device.
    * **Pull:** Download files/folders from device to PC.
    * Includes loading and empty folder states.
* **Flasher:**
    * Flash `.img` files to a specific partition (e.g., `boot`, `recovery`).
    * Wipe Data (Factory Reset) with a safety confirmation dialog.
    * Flash a flashable ZIP via adb sideload while your device is in recovery.

---

## Screenshots

* About Screenshots [see here](screenshots/README.md)

---

##  Installation

1.  Go to the **[Releases](https://github.com/drenzzz/adb-gui-kit/releases)** page.
2.  Download the `.zip` (Windows) file.
3.  Unzip the file.
4.  **IMPORTANT:** Make sure the `ADB-Kit` executable is in the same folder as the `bin/` directory (which contains `adb` and `fastboot` file).
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
    