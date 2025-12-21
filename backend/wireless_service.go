package backend

import (
	"fmt"
	"strings"
)

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
