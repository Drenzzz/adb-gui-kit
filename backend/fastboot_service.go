package backend

import (
	"fmt"
	"strings"
)
func (a *App) WipeData() error {
	output, err := a.runCommand("fastboot", "-w")
	if err != nil {
		return fmt.Errorf("failed to run fastboot -w: %w. Output: %s", err, output)
	}
	return nil
}

func (a *App) FlashPartition(partition string, filePath string) error {
	if partition == "" || filePath == "" {
		return fmt.Errorf("partition and file path cannot be empty")
	}

	output, err := a.runCommand("fastboot", "flash", partition, filePath)
	if err != nil {
		return fmt.Errorf("failed to run fastboot flash: %w. Output: %s", err, output)
	}
	return nil
}

func (a *App) GetFastbootDevices() ([]Device, error) {
	output, err := a.runCommand("fastboot", "devices")
	if err != nil {
		if output == "" {
			return []Device{}, nil
		}
		return nil, err
	}

	var devices []Device
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		parts := strings.Fields(line)
		if len(parts) >= 2 && parts[1] == "fastboot" {
			devices = append(devices, Device{
				Serial: parts[0],
				Status: parts[1],
			})
		}
	}

	return devices, nil
}

func (a *App) RunFastbootHostCommand(args string) (string, error) {
	if args == "" {
		return "", fmt.Errorf("command cannot be empty")
	}

	argSlice := strings.Fields(args)

	output, err := a.runCommand("fastboot", argSlice...)
	if err != nil {
		return "", fmt.Errorf("command failed: %w. Output: %s", err, output)
	}

	return output, nil
}
