package backend

import (
	"errors"
	"fmt"

	"github.com/ncruces/zenity"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// SelectImageFile opens a native file picker restricted to *.img files.
func (a *App) SelectImageFile() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("application context not initialised")
	}

	selectedPath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Image File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Image Files (*.img)",
				Pattern:     "*.img",
			},
		},
	})
	if err != nil {
		return "", err
	}

	return selectedPath, nil
}

func (a *App) SelectApkFile() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("application context not initialised")
	}

	selectedPath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select APK File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Android Package (*.apk)",
				Pattern:     "*.apk",
			},
		},
	})
	if err != nil {
		return "", err
	}
	return selectedPath, nil
}

func (a *App) SelectZipFile() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("application context not initialised")
	}

	selectedPath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Update Package",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "ZIP Archives (*.zip)",
				Pattern:     "*.zip",
			},
		},
	})
	if err != nil {
		return "", err
	}

	return selectedPath, nil
}

// SelectFilesToPush allows picking multiple files for import.
func (a *App) SelectFilesToPush() ([]string, error) {
	paths, err := zenity.SelectFileMultiple(
		zenity.Title("Select Files to Import"),
	)
	if errors.Is(err, zenity.ErrCanceled) {
		return nil, nil
	}
	return paths, err
}

// SelectFoldersToPush allows picking multiple directories for import.
func (a *App) SelectFoldersToPush() ([]string, error) {
	paths, err := zenity.SelectFileMultiple(
		zenity.Directory(),
		zenity.Title("Select Folders to Import"),
	)
	if errors.Is(err, zenity.ErrCanceled) {
		return nil, nil
	}
	return paths, err
}

func (a *App) SelectFileToPush() (string, error) {
	selectedPath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File to Import",
	})
	if err != nil {
		return "", err
	}
	return selectedPath, nil
}

func (a *App) SelectSaveDirectory(defaultFilename string) (string, error) {
	selectedPath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Select Save Location",
		DefaultFilename: defaultFilename,
	})
	if err != nil {
		return "", err
	}
	return selectedPath, nil
}

func (a *App) SelectDirectoryForPull() (string, error) {
	selectedPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Location",
	})
	if err != nil {
		return "", err
	}
	return selectedPath, nil
}

func (a *App) SelectDirectoryToPush() (string, error) {
	selectedPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Folder to Import",
	})
	if err != nil {
		return "", err
	}
	return selectedPath, nil
}

func (a *App) SelectSaveFile(defaultFilename string) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Title:           "Save File As...",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return "", err
	}

	return filePath, nil
}
