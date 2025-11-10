package backend

import (
	"bufio"
	"fmt"
	"path"
	"regexp"
	"sort"
	"strings"
	"time"
)

type DeviceMode string

const (
	DeviceModeUnknown  DeviceMode = "unknown"
	DeviceModeADB      DeviceMode = "adb"
	DeviceModeFastboot DeviceMode = "fastboot"
)

const defaultDeviceRoot = "/storage/emulated/0"

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
	return output
}

func (a *App) GetDeviceInfo() (DeviceInfo, error) {
	var info DeviceInfo

	// Basic device info
	info.Model = a.getProp("ro.product.model")
	info.AndroidVersion = a.getProp("ro.build.version.release")
	info.BuildNumber = a.getProp("ro.build.id")
	info.SecurityPatch = a.getProp("ro.build.version.security_patch")
	info.SerialNumber = a.getProp("ro.serialno")
	info.Baseband = a.getProp("ro.baseband")

	// Battery level
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

	// Uptime
	uptimeOutput, err := a.runShellCommand("cat /proc/uptime")
	if err == nil {
		parts := strings.Fields(uptimeOutput)
		if len(parts) > 0 {
			if seconds := regexp.MustCompile(`^(\d+)`).FindString(parts[0]); seconds != "" {
				info.Uptime = a.formatUptime(seconds)
			}
		}
	}
	if info.Uptime == "" {
		info.Uptime = "N/A"
	}

	// Storage info
	storageOutput, err := a.runShellCommand("df /storage/emulated/0")
	if err == nil {
		lines := strings.Split(storageOutput, "\n")
		for _, line := range lines {
			if strings.Contains(line, "/storage/emulated/0") || strings.Contains(line, "/data") {
				fields := strings.Fields(line)
				if len(fields) >= 4 {
					info.StorageTotal = a.formatBytes(fields[1])
					info.StorageUsed = a.formatBytes(fields[2])
					info.StorageFree = a.formatBytes(fields[3])
					break
				}
			}
		}
	}
	if info.StorageTotal == "" {
		info.StorageTotal = "N/A"
		info.StorageUsed = "N/A"
		info.StorageFree = "N/A"
	}

	// Root detection
	suOutput, err := a.runShellCommand("which su")
	info.IsRooted = (err == nil && strings.TrimSpace(suOutput) != "")

	// Bootloader status (try fastboot method)
	bootloaderOutput, err := a.runShellCommand("getprop ro.boot.flash.locked")
	if err == nil && strings.TrimSpace(bootloaderOutput) == "1" {
		info.BootloaderLocked = true
	} else {
		// Fallback - check for unlocked indicators
		unlockOutput, err := a.runShellCommand("getprop ro.boot.verifiedbootstate")
		info.BootloaderLocked = !(err == nil && strings.Contains(strings.ToLower(unlockOutput), "orange"))
	}

	// Screen info
	displayOutput, err := a.runShellCommand("wm size")
	if err == nil {
		re := regexp.MustCompile(`(\d+x\d+)`)
		if match := re.FindString(displayOutput); match != "" {
			info.ScreenResolution = match
		}
	}
	if info.ScreenResolution == "" {
		info.ScreenResolution = "N/A"
	}

	densityOutput, err := a.runShellCommand("wm density")
	if err == nil {
		re := regexp.MustCompile(`(\d+)`)
		if match := re.FindString(densityOutput); match != "" {
			info.ScreenDensity = match + " dpi"
		}
	}
	if info.ScreenDensity == "" {
		info.ScreenDensity = "N/A"
	}

	// Network info
	ipOutput, err := a.runShellCommand("ip route get 8.8.8.8")
	if err == nil {
		re := regexp.MustCompile(`src (\d+\.\d+\.\d+\.\d+)`)
		if matches := re.FindStringSubmatch(ipOutput); len(matches) > 1 {
			info.LocalIP = matches[1]
		}
	}
	if info.LocalIP == "" {
		info.LocalIP = "N/A"
	}

	// WiFi status
	wifiOutput, err := a.runShellCommand("dumpsys wifi | grep 'mNetworkInfo'")
	if err == nil && strings.Contains(wifiOutput, "CONNECTED") {
		info.WiFiStatus = "Connected"
	} else {
		info.WiFiStatus = "Disconnected"
	}

	// IMEI (requires permission)
	imeiOutput, err := a.runShellCommand("service call iphonesubinfo 1")
	if err == nil {
		re := regexp.MustCompile(`'(.+)'`)
		if matches := re.FindStringSubmatch(imeiOutput); len(matches) > 1 {
			info.IMEI = strings.ReplaceAll(matches[1], " ", "")
		}
	}
	if info.IMEI == "" {
		info.IMEI = "N/A"
	}

	return info, nil
}

func (a *App) formatUptime(seconds string) string {
	if seconds == "" {
		return "N/A"
	}
	// Simple uptime formatting - could be enhanced
	return seconds + " seconds"
}

func (a *App) formatBytes(kbStr string) string {
	if kbStr == "" {
		return "N/A"
	}
	// Simple KB to human readable - could be enhanced
	return kbStr + " KB"
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

func (a *App) BatchUninstallPackages(packageNames []string) ([]UninstallResult, error) {
	if len(packageNames) == 0 {
		return nil, fmt.Errorf("no packages provided")
	}

	results := make([]UninstallResult, 0, len(packageNames))

	for _, pkg := range packageNames {
		pkg = strings.TrimSpace(pkg)
		if pkg == "" {
			continue
		}

		output, err := a.runCommand("adb", "shell", "pm", "uninstall", pkg)
		result := UninstallResult{
			Package: pkg,
			Message: output,
		}

		if err != nil {
			result.Success = false
			result.Message = fmt.Sprintf("error: %v (output: %s)", err, output)
		} else {
			lower := strings.ToLower(output)
			result.Success = strings.Contains(lower, "success")
			if !result.Success && result.Message == "" {
				result.Message = "uninstall failed"
			}
		}
		results = append(results, result)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("no valid package names provided")
	}

	return results, nil
}

func (a *App) ListInstalledPackages(includeSystem bool) ([]PackageInfo, error) {
	output, err := a.runCommand("adb", "shell", "pm", "list", "packages", "-f")
	if err != nil {
		return nil, fmt.Errorf("failed to list packages: %w. Output: %s", err, output)
	}

	lines := strings.Split(output, "\n")
	packages := make([]PackageInfo, 0, len(lines))

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		line = strings.TrimPrefix(line, "package:")
		parts := strings.SplitN(strings.TrimSpace(line), "=", 2)
		if len(parts) != 2 {
			continue
		}

		apkPath := parts[0]
		name := parts[1]

		info := PackageInfo{
			Name:     name,
			ApkPath:  apkPath,
			IsSystem: isSystemApkPath(apkPath),
			Label:    name, // Default to package name for fast loading
		}

		if !includeSystem && info.IsSystem {
			continue
		}

		packages = append(packages, info)
	}

	sort.Slice(packages, func(i, j int) bool {
		return packages[i].Name < packages[j].Name
	})

	// Get installer info quickly (this is fast)
	installerMap := a.getInstallerMap()
	
	// Try to get labels with timeout (only for first 20 packages to avoid blocking)
	labelMap := make(map[string]string)
	if len(packages) > 0 {
		labelMap = a.getLabelMapWithTimeout()
	}
	
	for i := range packages {
		if installer, ok := installerMap[packages[i].Name]; ok && installer != "" {
			packages[i].Installer = installer
		} else {
			packages[i].Installer = "unknown"
		}
		
		// Update label if we have it
		if label, ok := labelMap[packages[i].Name]; ok && label != "" && label != packages[i].Name {
			packages[i].Label = label
		}
	}

	return packages, nil
}

func (a *App) getLabelMapWithTimeout() map[string]string {
	// Quick attempt to get labels - if it takes too long, return empty
	labelChan := make(chan map[string]string, 1)
	
	go func() {
		labelChan <- a.getLabelMap()
	}()
	
	select {
	case labels := <-labelChan:
		return labels
	case <-time.After(2 * time.Second): // 2 second timeout
		return map[string]string{}
	}
}

func (a *App) UpdatePackageLabels(packageNames []string) ([]PackageInfo, error) {
	if len(packageNames) == 0 {
		return nil, fmt.Errorf("no package names provided")
	}

	// Try fast label fetch first
	labelMap := a.getLabelMap()
	
	results := make([]PackageInfo, 0, len(packageNames))
	
	for _, pkgName := range packageNames {
		info := PackageInfo{Name: pkgName}
		
		if label, ok := labelMap[pkgName]; ok && label != "" {
			info.Label = label
		} else {
			// Fallback to individual dumpsys for this package
			if fallbackLabel := a.getPackageLabel(pkgName); fallbackLabel != "" {
				info.Label = fallbackLabel
			} else {
				info.Label = pkgName // Keep package name if no label found
			}
		}
		
		results = append(results, info)
	}

	return results, nil
}

func (a *App) GetPackageDetail(packageName string) (PackageDetail, error) {
	pkg := strings.TrimSpace(packageName)
	if pkg == "" {
		return PackageDetail{}, fmt.Errorf("package name cannot be empty")
	}

	output, err := a.runCommand("adb", "shell", "dumpsys", "package", pkg)
	if err != nil {
		return PackageDetail{}, fmt.Errorf("failed to fetch package details: %w", err)
	}

	detail := PackageDetail{
		Name:      pkg,
		Label:     a.getPackageLabel(pkg),
		Installer: a.getInstallerMap()[pkg],
	}

	scanner := bufio.NewScanner(strings.NewReader(output))
	currentSection := ""

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		switch {
		case line == "":
			continue
		case strings.HasPrefix(line, "versionName="):
			detail.VersionName = strings.TrimPrefix(line, "versionName=")
		case strings.HasPrefix(line, "versionCode="):
			detail.VersionCode = strings.TrimPrefix(line, "versionCode=")
		case strings.HasPrefix(line, "codePath="):
			detail.ApkPath = strings.TrimPrefix(line, "codePath=")
		case strings.HasPrefix(line, "dataDir="):
			detail.DataDir = strings.TrimPrefix(line, "dataDir=")
		case strings.HasPrefix(line, "firstInstallTime="):
			detail.FirstInstallTime = strings.TrimPrefix(line, "firstInstallTime=")
		case strings.HasPrefix(line, "lastUpdateTime="):
			detail.LastUpdateTime = strings.TrimPrefix(line, "lastUpdateTime=")
		case strings.HasPrefix(line, "requested permissions"):
			currentSection = "requested"
			continue
		case strings.HasPrefix(line, "install permissions"):
			currentSection = ""
			continue
		case strings.HasPrefix(line, "grantedPermissions"):
			currentSection = "granted"
			continue
		default:
			if currentSection == "" {
				continue
			}
			perm := strings.TrimSpace(strings.TrimPrefix(line, "*"))
			if perm == "" {
				continue
			}
			switch currentSection {
			case "requested":
				detail.RequestedPermissions = append(detail.RequestedPermissions, perm)
			case "granted":
				detail.GrantedPermissions = append(detail.GrantedPermissions, perm)
			}
		}
	}

	if detail.ApkPath != "" {
		detail.ApkSize = a.getPathSize(detail.ApkPath)
	}
	if detail.DataDir != "" {
		detail.DataSize = a.getPathSize(detail.DataDir)
	}

	return detail, nil
}

func (a *App) ListFiles(targetPath string) ([]FileEntry, error) {
	normalizedPath := normalizeDevicePath(targetPath)
	output, err := a.runCommand("adb", "shell", "ls", "-lA", normalizedPath)
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
	remotePath = normalizeDevicePath(remotePath)
	output, err := a.runCommand("adb", "push", localPath, remotePath)
	if err != nil {
		return "", fmt.Errorf("failed to push file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	remotePath = normalizeDevicePath(remotePath)
	output, err := a.runCommand("adb", "pull", "-a", remotePath, localPath)
	if err != nil {
		return "", fmt.Errorf("failed to pull file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) CopyPaths(paths []string, destinationDir string) ([]FileOperationResult, error) {
	destinationDir = strings.TrimSpace(destinationDir)
	if destinationDir == "" {
		return nil, fmt.Errorf("destination directory cannot be empty")
	}

	// Normalize destination 
	destDir := normalizeDevicePath(destinationDir)
	if !strings.HasSuffix(destDir, "/") {
		destDir += "/"
	}

	results := make([]FileOperationResult, 0, len(paths))
	
	for _, p := range paths {
		srcPath := strings.TrimSpace(p)
		if srcPath == "" {
			results = append(results, FileOperationResult{
				Path: p, Success: false, Message: "empty source path",
			})
			continue
		}
		
		srcPath = normalizeDevicePath(srcPath)
		fileName := path.Base(srcPath)
		
		if fileName == "" || fileName == "." || fileName == "/" {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: false, Message: "invalid filename",
			})
			continue
		}
		
		// Simple cp command without variables
		cmd := fmt.Sprintf("cp -r %s %s", shellEscape(srcPath), shellEscape(destDir))
		
		_, err := a.runCommand("adb", "shell", cmd)
		if err != nil {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: false, Message: err.Error(),
			})
		} else {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: true, Message: fmt.Sprintf("Copied to %s", destDir),
			})
		}
	}
	
	return results, nil
}

func (a *App) MovePaths(paths []string, destinationDir string) ([]FileOperationResult, error) {
	destinationDir = strings.TrimSpace(destinationDir)
	if destinationDir == "" {
		return nil, fmt.Errorf("destination directory cannot be empty")
	}

	// Normalize destination 
	destDir := normalizeDevicePath(destinationDir)
	if !strings.HasSuffix(destDir, "/") {
		destDir += "/"
	}

	results := make([]FileOperationResult, 0, len(paths))
	
	for _, p := range paths {
		srcPath := strings.TrimSpace(p)
		if srcPath == "" {
			results = append(results, FileOperationResult{
				Path: p, Success: false, Message: "empty source path",
			})
			continue
		}
		
		srcPath = normalizeDevicePath(srcPath)
		fileName := path.Base(srcPath)
		
		if fileName == "" || fileName == "." || fileName == "/" {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: false, Message: "invalid filename",
			})
			continue
		}
		
		// Simple mv command without variables
		cmd := fmt.Sprintf("mv %s %s", shellEscape(srcPath), shellEscape(destDir))
		
		_, err := a.runCommand("adb", "shell", cmd)
		if err != nil {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: false, Message: err.Error(),
			})
		} else {
			results = append(results, FileOperationResult{
				Path: srcPath, Success: true, Message: fmt.Sprintf("Moved to %s", destDir),
			})
		}
	}
	
	return results, nil
}

func (a *App) DeletePaths(paths []string) ([]FileOperationResult, error) {
	return a.perPathOperation(paths, func(p string) (string, string, error) {
		cmd := fmt.Sprintf("rm -rf %s", shellEscape(p))
		return cmd, "Deleted", nil
	})
}

func (a *App) RenamePath(sourcePath string, newName string) (FileOperationResult, error) {
	sourcePath = strings.TrimSpace(sourcePath)
	newName = strings.TrimSpace(newName)

	result := FileOperationResult{Path: sourcePath}

	if sourcePath == "" || newName == "" {
		result.Message = "path and new name are required"
		return result, fmt.Errorf("path and new name are required")
	}

	if strings.Contains(newName, "/") {
		result.Message = "new name cannot include '/'"
		return result, fmt.Errorf("new name cannot include '/'")
	}

	sourcePath = normalizeDevicePath(sourcePath)
	result.Path = sourcePath

	dir := path.Dir(sourcePath)
	if dir == "." {
		dir = defaultDeviceRoot
	}
	target := path.Join(dir, newName)

	cmd := fmt.Sprintf("mv %s %s", shellEscape(sourcePath), shellEscape(target))
	_, err := a.runCommand("adb", "shell", "sh", "-c", cmd)
	if err != nil {
		result.Message = err.Error()
		return result, err
	}

	result.Success = true
	result.Path = target
	result.Message = fmt.Sprintf("Renamed to %s", newName)
	return result, nil
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

func (a *App) perPathOperation(paths []string, builder func(string) (string, string, error)) ([]FileOperationResult, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no paths provided")
	}

	results := make([]FileOperationResult, 0, len(paths))

	for _, p := range paths {
		trimmed := normalizeDevicePath(p)
		res := FileOperationResult{Path: trimmed}

		if trimmed == "" {
			res.Message = "path cannot be empty"
			results = append(results, res)
			continue
		}

		cmd, successMsg, err := builder(trimmed)
		if err != nil {
			res.Message = err.Error()
			results = append(results, res)
			continue
		}

		_, execErr := a.runCommand("adb", "shell", "sh", "-c", cmd)
		if execErr != nil {
			res.Message = execErr.Error()
		} else {
			res.Success = true
			res.Message = successMsg
		}

		results = append(results, res)
	}

	return results, nil
}

func isSystemApkPath(apkPath string) bool {
	lower := strings.ToLower(apkPath)
	systemPrefixes := []string{
		"/system/",
		"/system_ext/",
		"/product/",
		"/vendor/",
		"/odm/",
	}

	for _, prefix := range systemPrefixes {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}

	return false
}

func shellEscape(input string) string {
	if input == "" {
		return "''"
	}
	escaped := strings.ReplaceAll(input, "'", `'"'"'`)
	return "'" + escaped + "'"
}

func normalizeDevicePath(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return defaultDeviceRoot
	}

	trimmed = strings.ReplaceAll(trimmed, "\\", "/")

	if strings.HasPrefix(trimmed, "/sdcard") {
		suffix := strings.TrimPrefix(trimmed, "/sdcard")
		suffix = strings.TrimPrefix(suffix, "/")
		if suffix == "" {
			return defaultDeviceRoot
		}
		return path.Join(defaultDeviceRoot, suffix)
	}

	if !strings.HasPrefix(trimmed, "/") {
		return path.Join(defaultDeviceRoot, trimmed)
	}

	return path.Clean(trimmed)
}

func ensureDirSuffix(p string) string {
	if p == "" {
		return p
	}
	if strings.HasSuffix(p, "/") {
		return p
	}
	return p + "/"
}

func (a *App) getInstallerMap() map[string]string {
	output, err := a.runCommand("adb", "shell", "pm", "list", "packages", "-i")
	if err != nil {
		return map[string]string{}
	}

	installers := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "package:") {
			continue
		}

		parts := strings.Split(line, " installer=")
		pkgName := strings.TrimPrefix(parts[0], "package:")
		pkgName = strings.TrimSpace(pkgName)
		if pkgName == "" {
			continue
		}

		installer := "unknown"
		if len(parts) > 1 {
			installer = strings.TrimSpace(parts[1])
			if installer == "" {
				installer = "unknown"
			}
		}

		installers[pkgName] = installer
	}

	return installers
}

func (a *App) getPackageLabel(packageName string) string {
	if packageName == "" {
		return ""
	}

	a.cacheMutex.RLock()
	if cached, ok := a.packageLabelCache[packageName]; ok {
		a.cacheMutex.RUnlock()
		return cached
	}
	a.cacheMutex.RUnlock()

	cmd := fmt.Sprintf("dumpsys package %s", shellEscape(packageName))
	output, err := a.runShellCommand(cmd)
	if err != nil {
		return ""
	}

	label := parseLabelFromDump(output)

	a.cacheMutex.Lock()
	if label != "" {
		a.packageLabelCache[packageName] = label
	}
	a.cacheMutex.Unlock()

	return label
}

func parseLabelFromDump(dump string) string {
	scanner := bufio.NewScanner(strings.NewReader(dump))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "application-label:") {
			value := strings.TrimPrefix(line, "application-label:")
			return strings.Trim(value, " '\"")
		}
	}
	return ""
}

func (a *App) getPathSize(devicePath string) string {
	devicePath = strings.TrimSpace(devicePath)
	if devicePath == "" {
		return ""
	}

	cmd := fmt.Sprintf("du -sh %s | awk '{print $1}'", shellEscape(devicePath))
	output, err := a.runShellCommand(cmd)
	if err != nil {
		return ""
	}
	return output
}

func (a *App) getLabelMap() map[string]string {
	labelMap := make(map[string]string)

	// Method 1: Try the newer cmd package approach
	output, err := a.runCommand("adb", "shell", "cmd", "package", "list", "packages", "--user", "0", "--show-label")
	if err == nil && output != "" {
		cmdLabels := a.parseLabelMapFromCmdOutput(output)
		for pkg, label := range cmdLabels {
			labelMap[pkg] = label
		}
	}

	// Method 2: Try pm list with -3 flag (3rd party apps only, much faster)
	pmOutput, pmErr := a.runCommand("adb", "shell", "pm", "list", "packages", "-3")
	if pmErr == nil {
		lines := strings.Split(pmOutput, "\n")
		
		// Limit to first 15 user apps for performance
		count := 0
		for _, line := range lines {
			if count >= 15 {
				break
			}
			line = strings.TrimSpace(line)
			if !strings.HasPrefix(line, "package:") {
				continue
			}
			
			pkgName := strings.TrimPrefix(line, "package:")
			pkgName = strings.TrimSpace(pkgName)
			if pkgName == "" || labelMap[pkgName] != "" {
				continue // Skip if we already have a label
			}
			
			// Quick label extraction methods
			if label := a.getQuickLabel(pkgName); label != "" && label != pkgName {
				labelMap[pkgName] = label
				count++
			}
		}
	}

	// Method 3: Hardcoded common app mappings for instant recognition
	commonApps := map[string]string{
		"com.android.chrome":         "Chrome",
		"com.google.android.youtube": "YouTube",
		"com.facebook.katana":        "Facebook",
		"com.instagram.android":      "Instagram",
		"com.whatsapp":               "WhatsApp",
		"com.twitter.android":        "Twitter",
		"com.spotify.music":          "Spotify",
		"com.netflix.mediaclient":    "Netflix",
		"com.google.android.gm":      "Gmail",
		"com.google.android.apps.maps": "Maps",
		"com.google.android.googlequicksearchbox": "Google",
		"com.android.vending":        "Play Store",
		"com.google.android.apps.photos": "Google Photos",
		"com.google.android.apps.docs": "Google Drive",
		"com.microsoft.office.outlook": "Outlook",
		"com.adobe.reader":           "Adobe Reader",
		"com.dropbox.android":        "Dropbox",
		"com.skype.raider":           "Skype",
		"com.viber.voip":             "Viber",
		"com.snapchat.android":       "Snapchat",
		"com.tinder":                 "Tinder",
		"com.ubercab":                "Uber",
		"com.airbnb.android":         "Airbnb",
		"com.paypal.android.p2pmobile": "PayPal",
		"org.mozilla.firefox":        "Firefox",
		"com.opera.browser":          "Opera",
		"com.brave.browser":          "Brave",
	}

	for pkg, label := range commonApps {
		if labelMap[pkg] == "" { // Don't override if we have a better label
			labelMap[pkg] = label
		}
	}

	return labelMap
}

func (a *App) getQuickLabel(packageName string) string {
	if packageName == "" {
		return ""
	}

	// Method 1: Try aapt if available (faster than dumpsys)
	aaptCmd := fmt.Sprintf("aapt dump badging $(pm path %s | cut -d: -f2) | grep 'application-label:' | cut -d\\' -f2", shellEscape(packageName))
	if output, err := a.runShellCommand(aaptCmd); err == nil && output != "" {
		cleaned := strings.Trim(strings.TrimSpace(output), "\"'")
		if cleaned != "" && cleaned != packageName {
			return cleaned
		}
	}

	// Method 2: Try faster dumpsys approach with timeout
	dumpCmd := fmt.Sprintf("timeout 1s dumpsys package %s | grep 'application-label:' | head -1 | cut -d: -f2", shellEscape(packageName))
	if output, err := a.runShellCommand(dumpCmd); err == nil && output != "" {
		cleaned := strings.Trim(strings.TrimSpace(output), "\"' ")
		if cleaned != "" && cleaned != packageName {
			return cleaned
		}
	}

	// Method 3: Extract from package name (better than showing full package name)
	return a.extractLabelFromPackageName(packageName)
}

func (a *App) extractLabelFromPackageName(packageName string) string {
	if packageName == "" {
		return ""
	}

	// Remove common prefixes and try to extract meaningful name
	parts := strings.Split(packageName, ".")
	if len(parts) < 2 {
		return packageName
	}

	// Skip common prefixes
	meaningful := []string{}
	for _, part := range parts {
		if part != "com" && part != "org" && part != "android" && part != "google" && 
		   part != "app" && part != "apps" && part != "mobile" && len(part) > 2 {
			meaningful = append(meaningful, part)
		}
	}

	if len(meaningful) > 0 {
		// Capitalize first letter and return the most meaningful part
		best := meaningful[len(meaningful)-1] // Usually the last part is most specific
		if len(best) > 0 {
			return strings.ToUpper(best[:1]) + best[1:]
		}
	}

	return packageName
}

func (a *App) parseLabelMapFromCmdOutput(output string) map[string]string {
	labelMap := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || !strings.HasPrefix(line, "package:") {
			continue
		}

		pkg := ""
		label := ""

		if labelIdx := strings.Index(line, " label:"); labelIdx != -1 {
			label = strings.TrimSpace(line[labelIdx+len(" label:"):])
			line = line[:labelIdx]
		}

		pkg = strings.TrimSpace(strings.TrimPrefix(line, "package:"))
		if pkg == "" || label == "" {
			continue
		}

		labelMap[pkg] = strings.Trim(label, "\"'")
	}

	return labelMap
}
