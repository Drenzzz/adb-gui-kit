package backend

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
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
	if err := ValidateRebootMode(mode); err != nil {
		return fmt.Errorf("invalid reboot mode: %w", err)
	}
	
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
	if err := ValidateFilePath(filePath); err != nil {
		return "", fmt.Errorf("invalid file path: %w", err)
	}
	
	output, err := a.runCommand("adb", "install", "-r", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to install package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	if err := ValidatePackageName(packageName); err != nil {
		return "", fmt.Errorf("invalid package name: %w", err)
	}
	
	output, err := a.runCommand("adb", "shell", "pm", "uninstall", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to uninstall package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) ListPackages(filterType string) ([]PackageInfo, error) {
	var filterFlag string
	switch filterType {
	case "user":
		filterFlag = "-3"
	case "system":
		filterFlag = "-s"
	case "all":
		filterFlag = ""
	default:
		filterFlag = ""
	}

	packageMap := make(map[string]PackageInfo)
	prefix := "package:"

	argsEnabled := []string{"shell", "pm", "list", "packages", "-e"}
	if filterFlag != "" {
		argsEnabled = append(argsEnabled, filterFlag)
	}

	outputEnabled, errEnabled := a.runCommand("adb", argsEnabled...)
	if errEnabled != nil {
		return nil, fmt.Errorf("failed to list enabled packages: %w", errEnabled)
	}

	linesEnabled := strings.Split(outputEnabled, "\n")
	for _, line := range linesEnabled {
		trimmedLine := strings.TrimSpace(line)
		if strings.HasPrefix(trimmedLine, prefix) {
			packageName := strings.TrimPrefix(trimmedLine, prefix)
			packageMap[packageName] = PackageInfo{
				PackageName: packageName,
				IsEnabled:   true,
			}
		}
	}

	argsDisabled := []string{"shell", "pm", "list", "packages", "-d"}
	if filterFlag != "" {
		argsDisabled = append(argsDisabled, filterFlag)
	}

	outputDisabled, errDisabled := a.runCommand("adb", argsDisabled...)
	if errDisabled != nil {
		return nil, fmt.Errorf("failed to list disabled packages: %w", errDisabled)
	}

	linesDisabled := strings.Split(outputDisabled, "\n")
	for _, line := range linesDisabled {
		trimmedLine := strings.TrimSpace(line)
		if strings.HasPrefix(trimmedLine, prefix) {
			packageName := strings.TrimPrefix(trimmedLine, prefix)
			packageMap[packageName] = PackageInfo{
				PackageName: packageName,
				IsEnabled:   false,
			}
		}
	}

	var packages []PackageInfo
	for _, pkg := range packageMap {
		packages = append(packages, pkg)
	}
	
	return packages, nil
}


func (a *App) ClearData(packageName string) (string, error) {
	if err := ValidatePackageName(packageName); err != nil {
		return "", fmt.Errorf("invalid package name: %w", err)
	}

	output, err := a.runCommand("adb", "shell", "pm", "clear", packageName)

	if err != nil {
		return "", fmt.Errorf("failed to run clear data command for %s: %w", packageName, err)
	}

	if strings.Contains(output, "Failed") {
		return "", fmt.Errorf("failed to clear data for %s: %s", packageName, output)
	}

	return "Data cleared successfully", nil
}

func (a *App) DisablePackage(packageName string) (string, error) {
	if err := ValidatePackageName(packageName); err != nil {
		return "", fmt.Errorf("invalid package name: %w", err)
	}

	// pm disable requires a component name. disable-user targets the whole package for user 0 without root.
	output, err := a.runCommand("adb", "shell", "pm", "disable-user", "--user", "0", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to run disable command for %s: %w", packageName, err)
	}

	if strings.Contains(output, "new state: disabled") {
		return output, nil
	}

	if strings.Contains(output, "new state:") {
		return output, nil
	}
	
	return "", fmt.Errorf("failed to disable package %s: %s", packageName, output)
}

func (a *App) EnablePackage(packageName string) (string, error) {
	if err := ValidatePackageName(packageName); err != nil {
		return "", fmt.Errorf("invalid package name: %w", err)
	}

	output, err := a.runCommand("adb", "shell", "pm", "enable", "--user", "0", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to run enable command for %s: %w", packageName, err)
	}

	if strings.Contains(output, "new state: enabled") {
		return output, nil
	}

	return "", fmt.Errorf("failed to enable package %s: %s", packageName, output)
}

func (a *App) PullApk(packageName string) (string, error) {
	if err := ValidatePackageName(packageName); err != nil {
		return "", fmt.Errorf("invalid package name: %w", err)
	}

	pathOutput, err := a.runCommand("adb", "shell", "pm", "path", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to find package path for %s: %w", packageName, err)
	}

	if pathOutput == "" {
		return "", fmt.Errorf("package %s not found or no path returned", packageName)
	}

	remotePath := strings.TrimPrefix(pathOutput, "package:")
	remotePath = strings.TrimSpace(remotePath)

	if remotePath == "" {
		return "", fmt.Errorf("could not parse remote path from output: %s", pathOutput)
	}

	defaultFilename := packageName + ".apk"

	localPath, err := a.SelectSaveFile(defaultFilename)
	if err != nil {
		return "", fmt.Errorf("save file dialog failed: %w", err)
	}

	if localPath == "" {
		return "APK pull cancelled by user", nil
	}

	output, err := a.runCommand("adb", "pull", remotePath, localPath)
	if err != nil {
		return "", fmt.Errorf("adb pull failed: %w. Output: %s", err, output)
	}

	return fmt.Sprintf("APK saved to %s", localPath), nil
}

func (a *App) UninstallMultiplePackages(packageNames []string) (string, error) {
	if len(packageNames) == 0 {
		return "", fmt.Errorf("no packages selected")
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, pkgName := range packageNames {
		_, err := a.UninstallPackage(pkgName)
		if err != nil {
			failCount++
			errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", pkgName, err))
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully uninstalled %d packages.", successCount)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to uninstall %d packages.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) DisableMultiplePackages(packageNames []string) (string, error) {
	if len(packageNames) == 0 {
		return "", fmt.Errorf("no packages selected")
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, pkgName := range packageNames {
		_, err := a.DisablePackage(pkgName)
		if err != nil {
			failCount++
			errorMsg := err.Error()
			if strings.Contains(errorMsg, "is not allowed") {
				errorMessages.WriteString(fmt.Sprintf("Failed %s: (System app?)\n", pkgName))
			} else {
				errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", pkgName, err))
			}
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully disabled %d packages.", successCount)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to disable %d packages.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) EnableMultiplePackages(packageNames []string) (string, error) {
	if len(packageNames) == 0 {
		return "", fmt.Errorf("no packages selected")
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, pkgName := range packageNames {
		_, err := a.EnablePackage(pkgName)
		if err != nil {
			failCount++
			errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", pkgName, err))
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully enabled %d packages.", successCount)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to enable %d packages.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) DeleteMultipleFiles(fullPaths []string) (string, error) {
	if len(fullPaths) == 0 {
		return "", fmt.Errorf("no files selected")
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, path := range fullPaths {
		_, err := a.DeleteFile(path)
		if err != nil {
			failCount++
			errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", path, err))
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully deleted %d items.", successCount)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to delete %d items.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) PullMultipleFiles(remotePaths []string) (string, error) {
	if len(remotePaths) == 0 {
		return "", fmt.Errorf("no files selected to export")
	}

	localSaveFolder, err := a.SelectDirectoryForPull()
	if err != nil {
		return "", fmt.Errorf("failed to open folder dialog: %w", err)
	}

	if localSaveFolder == "" {
		return "Export cancelled by user.", nil
	}

	var successCount int
	var failCount int
	var errorMessages strings.Builder

	for _, remotePath := range remotePaths {
		_, err := a.PullFile(remotePath, localSaveFolder)
		if err != nil {
			failCount++
			errorMessages.WriteString(fmt.Sprintf("Failed %s: %v\n", remotePath, err))
		} else {
			successCount++
		}
	}

	summary := fmt.Sprintf("Successfully exported %d items to %s.", successCount, localSaveFolder)
	if failCount > 0 {
		summary += fmt.Sprintf(" Failed to export %d items.\nDetails:\n%s", failCount, errorMessages.String())
	}

	return summary, nil
}

func (a *App) ListFiles(path string) ([]FileEntry, error) {
	if err := ValidateRemotePath(path); err != nil {
		return nil, fmt.Errorf("invalid path: %w", err)
	}
	
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
	if err := ValidateFilePath(localPath); err != nil {
		return "", fmt.Errorf("invalid local path: %w", err)
	}
	if err := ValidateRemotePath(remotePath); err != nil {
		return "", fmt.Errorf("invalid remote path: %w", err)
	}
	
	output, err := a.runCommand("adb", "push", localPath, remotePath)
	if err != nil {
		return "", fmt.Errorf("failed to push file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	if err := ValidateRemotePath(remotePath); err != nil {
		return "", fmt.Errorf("invalid remote path: %w", err)
	}
	if err := ValidateFilePath(localPath); err != nil {
		return "", fmt.Errorf("invalid local path: %w", err)
	}
	
	output, err := a.runCommand("adb", "pull", "-a", remotePath, localPath)
	if err != nil {
		return "", fmt.Errorf("failed to pull file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) CreateFolder(fullPath string) (string, error) {
	if err := ValidateRemotePath(fullPath); err != nil {
		return "", fmt.Errorf("invalid path: %w", err)
	}

	sanitizedPath := SanitizeShellArg(fullPath)
	command := fmt.Sprintf("mkdir -p '%s'", sanitizedPath)

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to create folder %s: %w. Output: %s", fullPath, err, output)
	}

	return fmt.Sprintf("Folder created: %s", fullPath), nil
}

func (a *App) DeleteFile(fullPath string) (string, error) {
	if err := ValidateRemotePath(fullPath); err != nil {
		return "", fmt.Errorf("invalid path: %w", err)
	}

	sanitizedPath := SanitizeShellArg(fullPath)
	command := fmt.Sprintf("rm -rf '%s'", sanitizedPath)

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to delete %s: %w. Output: %s", fullPath, err, output)
	}

	return fmt.Sprintf("Deleted: %s", fullPath), nil
}

func (a *App) RenameFile(oldPath string, newPath string) (string, error) {
	if err := ValidateRemotePath(oldPath); err != nil {
		return "", fmt.Errorf("invalid old path: %w", err)
	}
	if err := ValidateRemotePath(newPath); err != nil {
		return "", fmt.Errorf("invalid new path: %w", err)
	}

	sanitizedOld := SanitizeShellArg(oldPath)
	sanitizedNew := SanitizeShellArg(newPath)
	command := fmt.Sprintf("mv '%s' '%s'", sanitizedOld, sanitizedNew)

	output, err := a.runShellCommand(command)
	if err != nil {
		return "", fmt.Errorf("failed to rename %s to %s: %w. Output: %s", oldPath, newPath, err, output)
	}

	return fmt.Sprintf("Renamed %s to %s", oldPath, newPath), nil
}

func (a *App) SideloadPackage(filePath string) (string, error) {
	if err := ValidateFilePath(filePath); err != nil {
		return "", fmt.Errorf("invalid file path: %w", err)
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
	if err := ValidatePort(port); err != nil {
		return "", fmt.Errorf("invalid port: %w", err)
	}
	
	output, err := a.runCommand("adb", "tcpip", port)
	if err != nil {
		return "", fmt.Errorf("failed to enable tcpip (is device connected via USB?): %w. Output: %s", err, output)
	}
	
	return output, nil
}

func (a *App) ConnectWirelessAdb(ipAddress string, port string) (string, error) {
	if err := ValidateIPAddress(ipAddress); err != nil {
		return "", fmt.Errorf("invalid IP address: %w", err)
	}
	if port == "" {
		port = "5555"
	}
	if err := ValidatePort(port); err != nil {
		return "", fmt.Errorf("invalid port: %w", err)
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
	if err := ValidateIPAddress(ipAddress); err != nil {
		return "", fmt.Errorf("invalid IP address: %w", err)
	}
	if port == "" {
		port = "5555"
	}
	if err := ValidatePort(port); err != nil {
		return "", fmt.Errorf("invalid port: %w", err)
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
