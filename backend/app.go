package backend

import (
	"context"
	"fmt"
)

type Device struct {
	Serial string
	Status string
}
type DeviceInfo struct {
	Model          string
	AndroidVersion string
	BuildNumber    string
	BatteryLevel   string
	Serial         string 
	IPAddress      string 
	RootStatus     string
	Codename       string
	RamTotal       string
	StorageInfo    string
	Brand          string
	DeviceName     string
}
type FileEntry struct {
	Name        string
	Type        string
	Size        string
	Permissions string
	Date        string
	Time        string
}
type InstalledPackage struct {
	Name string
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
