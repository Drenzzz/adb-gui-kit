package backend

import (
	"fmt"
	"regexp"
	"strings"
)

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
