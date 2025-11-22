package backend

import (
	"fmt"
	"regexp"
	"strings"
	"strconv"
)

type DeviceMode string

const (
	DeviceModeUnknown  DeviceMode = "unknown"
	DeviceModeADB      DeviceMode = "adb"
	DeviceModeFastboot DeviceMode = "fastboot"
)

func (a *App) GetDevices() ([]Device, error) {
	output, err := a.runCommand("adb", "devices")
	if err != nil {
		return nil, err
	}

	var devices []Device
	lines := strings.Split(output, "\n")

	if len(lines) > 1 {
		for _, line := range lines[1:] {
			parts := strings.Fields(line)
			if len(parts) == 2 {
				devices = append(devices, Device{
					Serial: parts[0],
					Status: parts[1],
				})
			}
		}
	}

	return devices, nil
}

func (a *App) getProp(prop string) string {
	output, err := a.runCommand("adb", "shell", "getprop", prop)
	if err != nil {
		return "N/A"
	}
	return strings.TrimSpace(output)
}

func (a *App) checkRootStatus() string {
	output, err := a.runCommand("adb", "shell", "su", "-c", "id -u")
	cleanOutput := strings.TrimSpace(output)
	if err == nil && cleanOutput == "0" {
		return "Yes"
	}
	return "No"
}

func (a *App) getIPAddress() string {
	output, err := a.runCommand("adb", "shell", "ip", "addr", "show", "wlan0")
	if err == nil {
		re := regexp.MustCompile(`inet (\d+\.\d+\.\d+\.\d+)/\d+`)
		matches := re.FindStringSubmatch(output)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	ip := a.getProp("dhcp.wlan0.ipaddress")
	if ip != "N/A" && ip != "" {
		return ip
	}
	
	return "N/A (Not on WiFi?)"
}

func (a *App) getRamTotal() string {
	output, err := a.runCommand("adb", "shell", "cat /proc/meminfo | grep MemTotal")
	if err != nil {
		return "N/A"
	}

	re := regexp.MustCompile(`MemTotal:\s*(\d+)\s*kB`)
	matches := re.FindStringSubmatch(output)
	if len(matches) < 2 {
		return "N/A"
	}

	kb, err := strconv.ParseFloat(matches[1], 64)
	if err != nil {
		return "N/A"
	}

	gb := kb / 1024 / 1024
	return fmt.Sprintf("%.1f GB", gb)
}

func (a *App) getStorageInfo() string {
	output, err := a.runCommand("adb", "shell", "df /data")
	if err != nil {
		return "N/A"
	}

	lines := strings.Split(output, "\n")
	if len(lines) < 2 {
		return "N/A"
	}

	fields := strings.Fields(lines[1])
	if len(fields) < 4 {
		return "N/A"
	}
	
	totalKB, errTotal := strconv.ParseFloat(fields[1], 64)
	usedKB, errUsed := strconv.ParseFloat(fields[2], 64)

	if errTotal != nil || errUsed != nil {
		return "N/A"
	}

	totalGB := totalKB / 1024 / 1024
	usedGB := usedKB / 1024 / 1024

	return fmt.Sprintf("%.1f GB / %.1f GB", usedGB, totalGB)
}


func (a *App) GetDeviceInfo() (DeviceInfo, error) {
	var info DeviceInfo

	info.Model = a.getProp("ro.product.model")
	info.AndroidVersion = a.getProp("ro.build.version.release")
	info.BuildNumber = a.getProp("ro.build.id")
	info.Codename = a.getProp("ro.product.device")
	info.IPAddress = a.getIPAddress()
	info.RootStatus = a.checkRootStatus()
	info.RamTotal = a.getRamTotal()
	info.StorageInfo = a.getStorageInfo()
	info.Brand = a.getProp("ro.product.brand")
	info.DeviceName = a.getProp("ro.product.name")

	if serial, err := a.runCommand("adb", "get-serialno"); err == nil {
		info.Serial = strings.TrimSpace(serial)
	} else {
		info.Serial = strings.TrimSpace(a.getProp("ro.serialno"))
	}

	batteryOutput, err := a.runShellCommand("dumpsys battery | grep level")
	if err != nil {
		info.BatteryLevel = "N/A"
	} else {
		re := regexp.MustCompile(`:\s*(\d+)`)
		matches := re.FindStringSubmatch(batteryOutput)
		if len(matches) > 1 {
			info.BatteryLevel = matches[1] + "%"
		} else {
			info.BatteryLevel = "N/A"
		}
	}

	return info, nil
}

func (a *App) detectDeviceMode() (DeviceMode, error) {
	adbDevices, adbErr := a.GetDevices()
	if adbErr == nil {
		for _, device := range adbDevices {
			status := strings.ToLower(strings.TrimSpace(device.Status))
			switch status {
			case "device", "recovery", "sideload":
				return DeviceModeADB, nil
			}
		}
	}

	fastbootDevices, fastbootErr := a.GetFastbootDevices()
	if fastbootErr == nil && len(fastbootDevices) > 0 {
		return DeviceModeFastboot, nil
	}

	if adbErr != nil && fastbootErr != nil {
		return DeviceModeUnknown, fmt.Errorf("failed to detect device mode: adb error: %w, fastboot error: %v", adbErr, fastbootErr)
	}

	return DeviceModeUnknown, nil
}

func (a *App) GetDeviceMode() (string, error) {
	mode, err := a.detectDeviceMode()
	return string(mode), err
}

func (a *App) Reboot(mode string) error {
	connectionMode, detectionErr := a.detectDeviceMode()
	if detectionErr != nil {
		return detectionErr
	}

	mode = strings.TrimSpace(mode)

	switch connectionMode {
	case DeviceModeADB:
		args := []string{"reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		_, err := a.runCommand("adb", args...)
		return err
	case DeviceModeFastboot:
		if mode == "bootloader" {
			_, err := a.runCommand("fastboot", "reboot-bootloader")
			return err
		}
		args := []string{"reboot"}
		if mode != "" {
			args = append(args, mode)
		}
		_, err := a.runCommand("fastboot", args...)
		return err
	default:
		return fmt.Errorf("no connected device detected in adb or fastboot mode")
	}
}

func (a *App) InstallPackage(filePath string) (string, error) {
	output, err := a.runCommand("adb", "install", "-r", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to install package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	output, err := a.runCommand("adb", "shell", "pm", "uninstall", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to uninstall package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) GetInstalledPackages() ([]InstalledPackage, error) {
	output, err := a.runCommand("adb", "shell", "pm", "list", "packages")
	if err != nil {
		return nil, fmt.Errorf("failed to get installed packages: %w", err)
	}

	var packages []InstalledPackage
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		
		packageName := strings.TrimPrefix(line, "package:")
		if packageName != line {
			packages = append(packages, InstalledPackage{
				Name: packageName,
			})
		}
	}

	return packages, nil
}

func (a *App) ListFiles(path string) ([]FileEntry, error) {
	output, err := a.runCommand("adb", "shell", "ls", "-lA", path)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w. Output: %s", err, output)
	}

	var files []FileEntry
	lines := strings.Split(output, "\n")

	spaceRegex := regexp.MustCompile(`\s+`)

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "total") {
			continue
		}

		parts := spaceRegex.Split(line, 9)
		if len(parts) < 8 {
			continue
		}

		permissions := parts[0]
		fileType := "File"
		size := ""
		if len(parts) > 4 {
			size = parts[4]
		}

		if len(permissions) > 0 {
			switch permissions[0] {
			case 'd':
				fileType = "Directory"
			case 'l':
				fileType = "Symlink"
			}
		}

		if fileType == "Symlink" {
			// hide the raw block size for symlinks; the target is more interesting
			size = ""
		}

		var name string
		var date string
		var time string

		switch {
		case len(parts) >= 8:
			date = parts[5]
			time = parts[6]
			name = strings.Join(parts[7:], " ")
		case len(parts) == 7:
			date = parts[5]
			name = parts[6]
		case len(parts) == 6:
			name = parts[5]
		}

		if name == "" && len(parts) > 0 {
			// Fall back to the tail components so we still render something useful
			name = parts[len(parts)-1]
			if len(parts) >= 3 {
				time = parts[len(parts)-2]
				date = parts[len(parts)-3]
			}
		}

		name = strings.TrimSpace(name)
		date = strings.TrimSpace(date)
		time = strings.TrimSpace(time)

		if fileType == "Symlink" {
			linkParts := strings.Split(name, " -> ")
			name = linkParts[0]
		}

		files = append(files, FileEntry{
			Name:        name,
			Type:        fileType,
			Size:        size,
			Permissions: permissions,
			Date:        date,
			Time:        time,
		})
	}

	return files, nil
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {
	output, err := a.runCommand("adb", "push", localPath, remotePath)
	if err != nil {
		return "", fmt.Errorf("failed to push file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	output, err := a.runCommand("adb", "pull", "-a", remotePath, localPath)
	if err != nil {
		return "", fmt.Errorf("failed to pull file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) SideloadPackage(filePath string) (string, error) {
	filePath = strings.TrimSpace(filePath)
	if filePath == "" {
		return "", fmt.Errorf("file path cannot be empty")
	}

	output, err := a.runCommand("adb", "sideload", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to sideload package: %w. Output: %s", err, output)
	}

	return output, nil
}

func (a *App) EnableWirelessAdb(port string) (string, error) {
	if port == "" {
		port = "5555"
	}
	
	output, err := a.runCommand("adb", "tcpip", port)
	if err != nil {
		return "", fmt.Errorf("failed to enable tcpip (is device connected via USB?): %w. Output: %s", err, output)
	}
	
	return output, nil
}

func (a *App) ConnectWirelessAdb(ipAddress string, port string) (string, error) {
	if ipAddress == "" {
		return "", fmt.Errorf("IP address cannot be empty")
	}
	if port == "" {
		port = "5555"
	}
	
	address := fmt.Sprintf("%s:%s", ipAddress, port)
	
	output, _ := a.runCommand("adb", "connect", address)

	cleanOutput := strings.TrimSpace(output)
	
	if strings.Contains(cleanOutput, "connected to") || strings.Contains(cleanOutput, "already connected to") {
		return cleanOutput, nil
	}
	
	if cleanOutput == "" {
		 return "", fmt.Errorf("failed to connect. No device found or IP is wrong")
	}
	
	return "", fmt.Errorf(cleanOutput)
}

func (a *App) DisconnectWirelessAdb(ipAddress string, port string) (string, error) {
	if ipAddress == "" {
		return "", fmt.Errorf("IP address cannot be empty")
	}
	if port == "" {
		port = "5555"
	}
	
	address := fmt.Sprintf("%s:%s", ipAddress, port)
	
	output, err := a.runCommand("adb", "disconnect", address)
	if err != nil {
		output, err = a.runCommand("adb", "disconnect", ipAddress)
		if err != nil {
			return "", fmt.Errorf("failed to disconnect: %w. Output: %s", err, output)
		}
	}

	cleanOutput := strings.TrimSpace(output)
	if cleanOutput == "" {
		return fmt.Sprintf("Disconnected from %s", address), nil
	}
	
	return cleanOutput, nil
}

func (a *App) RunShellCommand(command string) (string, error) {
	if command == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}

func (a *App) RunAdbHostCommand(args string) (string, error) {
	if args == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	argSlice := strings.Fields(args)

	output, err := a.runCommand("adb", argSlice...)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}
