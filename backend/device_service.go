package backend

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"sync"
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
	var wg sync.WaitGroup
	var mu sync.Mutex

	propKeys := []struct {
		prop   string
		setter func(val string)
	}{
		{"ro.product.model", func(val string) { info.Model = val }},
		{"ro.build.version.release", func(val string) { info.AndroidVersion = val }},
		{"ro.build.id", func(val string) { info.BuildNumber = val }},
		{"ro.product.device", func(val string) { info.Codename = val }},
		{"ro.product.brand", func(val string) { info.Brand = val }},
		{"ro.product.name", func(val string) { info.DeviceName = val }},
	}

	for _, pk := range propKeys {
		wg.Add(1)
		go func(prop string, setter func(string)) {
			defer wg.Done()
			val := a.getProp(prop)
			mu.Lock()
			setter(val)
			mu.Unlock()
		}(pk.prop, pk.setter)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		val := a.getIPAddress()
		mu.Lock()
		info.IPAddress = val
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		val := a.checkRootStatus()
		mu.Lock()
		info.RootStatus = val
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		val := a.getRamTotal()
		mu.Lock()
		info.RamTotal = val
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		val := a.getStorageInfo()
		mu.Lock()
		info.StorageInfo = val
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		if serial, err := a.runCommand("adb", "get-serialno"); err == nil {
			mu.Lock()
			info.Serial = strings.TrimSpace(serial)
			mu.Unlock()
		} else {
			val := a.getProp("ro.serialno")
			mu.Lock()
			info.Serial = strings.TrimSpace(val)
			mu.Unlock()
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		batteryOutput, err := a.runShellCommand("dumpsys battery | grep level")
		mu.Lock()
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
		mu.Unlock()
	}()

	wg.Wait()

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
