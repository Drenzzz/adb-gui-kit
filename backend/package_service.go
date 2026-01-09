package backend

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"
)

func (a *App) InstallPackage(filePath string) (string, error) {

	
	a.opMutex.Lock()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	a.currentCancel = cancel
	a.opMutex.Unlock()

	defer func() {
		cancel() // context cancel
		a.opMutex.Lock()
		if a.currentCancel != nil {
			a.currentCancel = nil
		}
		a.opMutex.Unlock()
	}()

	// Use runCommandContext directly to utilize the cancellable context
	output, err := a.runCommandContext(ctx, "adb", "install", "-r", filePath)
	if err != nil {
		if ctx.Err() == context.Canceled {
			return "", fmt.Errorf("installation cancelled by user")
		}
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

	prefix := "package:"

	var wg sync.WaitGroup
	var mu sync.Mutex
	
	var enabledPackages []string
	var disabledPackages []string
	var errEnabled error
	var errDisabled error

	wg.Add(1)
	go func() {
		defer wg.Done()
		argsEnabled := []string{"shell", "pm", "list", "packages", "-e"}
		if filterFlag != "" {
			argsEnabled = append(argsEnabled, filterFlag)
		}

		outputEnabled, err := a.runCommand("adb", argsEnabled...)
		if err != nil {
			mu.Lock()
			errEnabled = fmt.Errorf("failed to list enabled packages: %w", err)
			mu.Unlock()
			return
		}

		lines := strings.Split(outputEnabled, "\n")
		for _, line := range lines {
			trimmedLine := strings.TrimSpace(line)
			if strings.HasPrefix(trimmedLine, prefix) {
				pkgName := strings.TrimPrefix(trimmedLine, prefix)
				mu.Lock()
				enabledPackages = append(enabledPackages, pkgName)
				mu.Unlock()
			}
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		argsDisabled := []string{"shell", "pm", "list", "packages", "-d"}
		if filterFlag != "" {
			argsDisabled = append(argsDisabled, filterFlag)
		}

		outputDisabled, err := a.runCommand("adb", argsDisabled...)
		if err != nil {
			mu.Lock()
			errDisabled = fmt.Errorf("failed to list disabled packages: %w", err)
			mu.Unlock()
			return
		}

		lines := strings.Split(outputDisabled, "\n")
		for _, line := range lines {
			trimmedLine := strings.TrimSpace(line)
			if strings.HasPrefix(trimmedLine, prefix) {
				pkgName := strings.TrimPrefix(trimmedLine, prefix)
				mu.Lock()
				disabledPackages = append(disabledPackages, pkgName)
				mu.Unlock()
			}
		}
	}()

	wg.Wait()

	if errEnabled != nil {
		return nil, errEnabled
	}
	if errDisabled != nil {
		return nil, errDisabled
	}

	packageMap := make(map[string]PackageInfo)
	
	for _, pkgName := range enabledPackages {
		packageMap[pkgName] = PackageInfo{
			PackageName: pkgName,
			IsEnabled:   true,
		}
	}
	
	for _, pkgName := range disabledPackages {
		packageMap[pkgName] = PackageInfo{
			PackageName: pkgName,
			IsEnabled:   false,
		}
	}

	var packages []PackageInfo
	for _, pkg := range packageMap {
		packages = append(packages, pkg)
	}
	
	return packages, nil
}


func (a *App) ClearData(packageName string) (string, error) {


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

	a.opMutex.Lock()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	a.currentCancel = cancel
	a.opMutex.Unlock()
	defer func() {
		cancel()
		a.opMutex.Lock()
		a.currentCancel = nil
		a.opMutex.Unlock()
	}()

	output, err := a.runCommandContext(ctx, "adb", "pull", remotePath, localPath)
	if err != nil {
		if ctx.Err() == context.Canceled {
			return "", fmt.Errorf("pull cancelled by user")
		}
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
