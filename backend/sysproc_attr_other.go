//go:build !windows

package backend

import "syscall"

func defaultSysProcAttr() *syscall.SysProcAttr {
	return nil
}
