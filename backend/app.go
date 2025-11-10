package backend

import (
	"context"
	"fmt"
	"sync"
)

type Device struct {
	Serial string
	Status string
}
type DeviceInfo struct {
	Model               string
	AndroidVersion      string
	BuildNumber         string
	BatteryLevel        string
	SecurityPatch       string
	Uptime              string
	StorageTotal        string
	StorageUsed         string
	StorageFree         string
	IsRooted            bool
	BootloaderLocked    bool
	ScreenResolution    string
	ScreenDensity       string
	IMEI                string
	SerialNumber        string
	LocalIP             string
	WiFiStatus          string
	Baseband            string
}
type FileEntry struct {
	Name        string
	Type        string
	Size        string
	Permissions string
	Date        string
	Time        string
}

type PackageInfo struct {
	Name      string
	ApkPath   string
	IsSystem  bool
	Label     string
	Installer string
}

type UninstallResult struct {
	Package string
	Success bool
	Message string
}

type FileOperationResult struct {
	Path    string
	Success bool
	Message string
}

type PackageDetail struct {
	Name                 string
	Label                string
	Installer            string
	VersionName          string
	VersionCode          string
	ApkPath              string
	DataDir              string
	FirstInstallTime     string
	LastUpdateTime       string
	ApkSize              string
	DataSize             string
	RequestedPermissions []string
	GrantedPermissions   []string
}

// App struct
type App struct {
	ctx               context.Context
	packageLabelCache map[string]string
	cacheMutex        sync.RWMutex
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		packageLabelCache: make(map[string]string),
	}
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
