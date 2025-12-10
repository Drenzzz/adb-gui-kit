package backend

import (
	"errors"
	"net"
	"regexp"
	"strconv"
	"strings"
)

var (
	ErrEmptyInput         = errors.New("input cannot be empty")
	ErrInvalidPackageName = errors.New("invalid package name format")
	ErrInvalidFilePath    = errors.New("invalid file path")
	ErrPathTraversal      = errors.New("path traversal not allowed")
	ErrInvalidIPAddress   = errors.New("invalid IP address format")
	ErrInvalidPort        = errors.New("invalid port number")
	ErrInvalidPartition   = errors.New("invalid partition name")
	ErrInvalidRebootMode  = errors.New("invalid reboot mode")
	ErrDangerousChars     = errors.New("dangerous characters detected")
)

var packageNameRegex = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$`)

var dangerousShellChars = []string{
	";", "&", "|", "`", "$", "(", ")", "{", "}", "[", "]",
	"\n", "\r", "\\", "<", ">", "!", "~", "*", "?",
}

var allowedPartitions = map[string]bool{
	"boot":          true,
	"recovery":      true,
	"system":        true,
	"vendor":        true,
	"dtbo":          true,
	"vbmeta":        true,
	"vbmeta_system": true,
	"vbmeta_vendor": true,
	"cache":         true,
	"userdata":      true,
	"metadata":      true,
	"super":         true,
	"product":       true,
	"odm":           true,
	"oem":           true,
	"radio":         true,
	"modem":         true,
	"bootloader":    true,
	"aboot":         true,
	"init_boot":     true,
	"vendor_boot":   true,
}

var allowedRebootModes = map[string]bool{
	"":           true,
	"recovery":   true,
	"bootloader": true,
	"fastboot":   true,
	"download":   true,
	"edl":        true,
	"sideload":   true,
}

func ValidatePackageName(name string) error {
	if name == "" {
		return ErrEmptyInput
	}
	
	name = strings.TrimSpace(name)
	
	if !packageNameRegex.MatchString(name) {
		return ErrInvalidPackageName
	}
	
	if len(name) > 256 {
		return ErrInvalidPackageName
	}
	
	return nil
}

func ValidateFilePath(path string) error {
	if path == "" {
		return ErrEmptyInput
	}
	
	path = strings.TrimSpace(path)
	
	if strings.Contains(path, "..") {
		return ErrPathTraversal
	}
	
	for _, char := range dangerousShellChars {
		if strings.Contains(path, char) {
			return ErrDangerousChars
		}
	}
	
	return nil
}

func ValidateRemotePath(path string) error {
	if path == "" {
		return ErrEmptyInput
	}
	
	path = strings.TrimSpace(path)
	
	if strings.Contains(path, "..") {
		return ErrPathTraversal
	}
	
	dangerousForRemote := []string{";", "&", "|", "`", "$", "(", ")", "\n", "\r"}
	for _, char := range dangerousForRemote {
		if strings.Contains(path, char) {
			return ErrDangerousChars
		}
	}
	
	return nil
}

func ValidateIPAddress(ip string) error {
	if ip == "" {
		return ErrEmptyInput
	}
	
	ip = strings.TrimSpace(ip)
	
	for _, char := range dangerousShellChars {
		if strings.Contains(ip, char) {
			return ErrDangerousChars
		}
	}
	
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ErrInvalidIPAddress
	}
	
	if parsed.To4() == nil {
		return ErrInvalidIPAddress
	}
	
	return nil
}

func ValidatePort(port string) error {
	if port == "" {
		return nil
	}
	
	port = strings.TrimSpace(port)
	
	portNum, err := strconv.Atoi(port)
	if err != nil {
		return ErrInvalidPort
	}
	
	if portNum < 1 || portNum > 65535 {
		return ErrInvalidPort
	}
	
	return nil
}

func ValidatePartitionName(partition string) error {
	if partition == "" {
		return ErrEmptyInput
	}
	
	partition = strings.TrimSpace(strings.ToLower(partition))
	
	if !allowedPartitions[partition] {
		return ErrInvalidPartition
	}
	
	return nil
}

func ValidateRebootMode(mode string) error {
	mode = strings.TrimSpace(strings.ToLower(mode))
	
	if !allowedRebootModes[mode] {
		return ErrInvalidRebootMode
	}
	
	return nil
}

func SanitizeShellArg(arg string) string {
	arg = strings.TrimSpace(arg)
	
	arg = strings.ReplaceAll(arg, "'", "'\"'\"'")
	
	return arg
}

func ContainsDangerousShellChars(input string) bool {
	for _, char := range dangerousShellChars {
		if strings.Contains(input, char) {
			return true
		}
	}
	return false
}
