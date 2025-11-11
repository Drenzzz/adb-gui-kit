//go:build !windows
// +build !windows

package backend

import "os/exec"

func setCommandWindowMode(cmd *exec.Cmd) {
	// no-op for non-Windows platforms
	_ = cmd
}
