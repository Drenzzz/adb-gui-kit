package backend

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func (a *App) getBinaryPath(name string) (string, error) {
	platformDir := runtime.GOOS
	extension := ""
	if runtime.GOOS == "windows" {
		extension = ".exe"
	}

	candidates := []string{
		filepath.Join(".", "bin", platformDir, name+extension),
		filepath.Join(".", "bin", name+extension), // Flat structure support
	}

	exePath, err := os.Executable()
	if err == nil {
		installDir := filepath.Dir(exePath)
		candidates = append(candidates, 
			filepath.Join(installDir, "bin", platformDir, name+extension),
			filepath.Join(installDir, "bin", name+extension),
		)
	}

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}

		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			if filepath.IsAbs(candidate) {
				return candidate, nil
			}
			abs, err := filepath.Abs(candidate)
			if err == nil {
				return abs, nil
			}
		}
	}

	return "", fmt.Errorf("binary '%s' not found. Please ensure 'bin/%s/%s%s' exists", name, platformDir, name, extension)
}

func (a *App) runCommand(name string, args ...string) (string, error) {
	binaryPath, err := a.getBinaryPath(name)
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, args...)
	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		// Clean up error message for UI
		errOutput := strings.TrimSpace(stderr.String())
		if errOutput == "" {
			errOutput = err.Error()
		}
		
		// Common ADB errors remapping
		if strings.Contains(errOutput, "device offline") {
			return "", fmt.Errorf("device is offline. Try reconnecting USB")
		}
		if strings.Contains(errOutput, "unauthorized") {
			return "", fmt.Errorf("unauthorized. Check phone screen to allow USB debugging")
		}

		return "", fmt.Errorf("%s", errOutput)
	}

	return strings.TrimSpace(out.String()), nil
}

func (a *App) runShellCommand(shellCommand string) (string, error) {
	if ContainsDangerousShellChars(shellCommand) {
		return "", fmt.Errorf("illegal characters in command")
	}


	binaryPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, "shell", shellCommand)
	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		errOutput := strings.TrimSpace(stderr.String())
		if errOutput == "" {
			errOutput = err.Error()
		}
		return "", fmt.Errorf("shell error: %s", errOutput)
	}

	return strings.TrimSpace(out.String()), nil
}

// CheckSystemRequirements verifies that necessary binaries are present and executable
func (a *App) CheckSystemRequirements() (string, error) {
	adbPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", fmt.Errorf("Critical: ADB not found. %w", err)
	}

	if _, err := a.getBinaryPath("fastboot"); err != nil {
		return "", fmt.Errorf("Critical: Fastboot not found. %w", err)
	}

	// Smoke test: checks if we can actually execute adb
	cmd := exec.Command(adbPath, "--version")
	setCommandWindowMode(cmd)
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ADB found at %s but failed to run: %v", adbPath, err)
	}

	return "All systems ready", nil
}
