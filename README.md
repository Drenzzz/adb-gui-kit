# ADBKit

A simple, modern GUI for ADB and Fastboot.
Built with **Wails** (Go + React) for speed, lightweight resource usage, and native performance.

---

## Features

### **Dashboard**

- **Unified Device List**: View all connected devices and emulators with editable nicknames.
- **Rich Device Info**: Real-time battery, storage, RAM, and root status.
- **Wireless ADB**: Toggle wireless debugging and standard pairing via IP/Port.

### **App Manager**

- **Performance**: Virtualized lists for handling thousands of packages smoothly.
- **Batch Operations**: Install, Uninstall, Enable, and Disable multiple apps at once.
- **APK Management**: Install local APKs or pull installed APKs from device.
- **Analysis**: Filter by User/System apps and sort by name/state.

### **File Explorer**

- **Optimized Transfer**: **Unlimited timeout** support for large file transfers (100GB+).
- **Concurrent I/O**: Fast listing and operation execution.
- **Full Control**: Push, Pull, Rename, Delete, and Create Folders.
- **Virtualization**: Efficient rendering of large directory structures.

### **Reliability & Safety**

- **Smart Timeouts**: Short timeouts for quick commands, unlimited duration for large transfers.
- **User Cancellation**: Cancel any long-running operation (Install, Push, Pull) instantly.
- **Modular Backend**: Service-based architecture ensures stability and easier maintenance.

### **Terminal & Utilities**

- **Universal Shell**: Built-in terminal for direct `adb` or `fastboot` commands.
- **One-Click Actions**: Reboot to System, Recovery, or Bootloader.
- **Flasher**: Flash images/ZIPs with validation.

---

## Screenshots

- About Screenshots [see here](screenshots/README.md)

---

## Installation

1.  Go to the **[Releases](https://github.com/drenzzz/adb-gui-kit/releases)** page.
2.  Download the latest release for your OS.
3.  **For Windows/Linux**: Ensure `platform-tools` (adb, fastboot) are reachable or placed in `bin/`.
4.  Run the application.

---

## Technology Stack

- **Core:** [Wails v2](https://wails.io)
- **Backend:** Go (Modular Service Architecture)
- **Frontend:** React (via Astro) + TypeScript
- **State Management:** Custom React Hooks + Composition
- **UI:** [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS

---

## Building from Source

### Prerequisites

- Go 1.21+
- Node.js 18+
- pnpm

### Steps

1.  Clone the repository.
2.  Install frontend dependencies:
    ```bash
    cd frontend
    pnpm install
    cd ..
    ```
3.  Run in development mode (Hot Reload):
    ```bash
    wails dev
    ```
4.  Build for production:
    ```bash
    wails build
    ```
