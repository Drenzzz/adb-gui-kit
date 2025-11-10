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
	devPath := filepath.Join(".", "bin", name)
	if runtime.GOOS == "windows" {
		devPath += ".exe"
	}

	if _, err := os.Stat(devPath); err == nil {
		return filepath.Abs(devPath)
	}

	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	prodPath := filepath.Join(filepath.Dir(exePath), "bin", name)
	if runtime.GOOS == "windows" {
		prodPath += ".exe"
	}

	if _, err := os.Stat(prodPath); err == nil {
		return prodPath, nil
	}

	return "", fmt.Errorf("binary '%s' not found in dev path '%s' or prod path '%s'", name, devPath, prodPath)
}

func (a *App) runCommand(name string, args ...string) (string, error) {
	binaryPath, err := a.getBinaryPath(name)
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, args...)

	if attr := defaultSysProcAttr(); attr != nil {
		cmd.SysProcAttr = attr
	}

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to run %s: %s (stderr: %s)", name, err, stderr.String())
	}

	return strings.TrimSpace(out.String()), nil
}

func (a *App) runShellCommand(shellCommand string) (string, error) {
	binaryPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, "shell", shellCommand)

	if attr := defaultSysProcAttr(); attr != nil {
		cmd.SysProcAttr = attr
	}

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to run adb shell '%s': %s (stderr: %s)", shellCommand, err, stderr.String())
	}

	return strings.TrimSpace(out.String()), nil
}
