export namespace backend {
	
	export class Device {
	    Serial: string;
	    Status: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Serial = source["Serial"];
	        this.Status = source["Status"];
	    }
	}
	export class DeviceInfo {
	    Model: string;
	    AndroidVersion: string;
	    BuildNumber: string;
	    BatteryLevel: string;
	    SecurityPatch: string;
	    Uptime: string;
	    StorageTotal: string;
	    StorageUsed: string;
	    StorageFree: string;
	    IsRooted: boolean;
	    BootloaderLocked: boolean;
	    ScreenResolution: string;
	    ScreenDensity: string;
	    IMEI: string;
	    SerialNumber: string;
	    LocalIP: string;
	    WiFiStatus: string;
	    Baseband: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Model = source["Model"];
	        this.AndroidVersion = source["AndroidVersion"];
	        this.BuildNumber = source["BuildNumber"];
	        this.BatteryLevel = source["BatteryLevel"];
	        this.SecurityPatch = source["SecurityPatch"];
	        this.Uptime = source["Uptime"];
	        this.StorageTotal = source["StorageTotal"];
	        this.StorageUsed = source["StorageUsed"];
	        this.StorageFree = source["StorageFree"];
	        this.IsRooted = source["IsRooted"];
	        this.BootloaderLocked = source["BootloaderLocked"];
	        this.ScreenResolution = source["ScreenResolution"];
	        this.ScreenDensity = source["ScreenDensity"];
	        this.IMEI = source["IMEI"];
	        this.SerialNumber = source["SerialNumber"];
	        this.LocalIP = source["LocalIP"];
	        this.WiFiStatus = source["WiFiStatus"];
	        this.Baseband = source["Baseband"];
	    }
	}
	export class FileEntry {
	    Name: string;
	    Type: string;
	    Size: string;
	    Permissions: string;
	    Date: string;
	    Time: string;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Type = source["Type"];
	        this.Size = source["Size"];
	        this.Permissions = source["Permissions"];
	        this.Date = source["Date"];
	        this.Time = source["Time"];
	    }
	}
	export class FileOperationResult {
	    Path: string;
	    Success: boolean;
	    Message: string;
	
	    static createFrom(source: any = {}) {
	        return new FileOperationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Success = source["Success"];
	        this.Message = source["Message"];
	    }
	}
	export class PackageDetail {
	    Name: string;
	    Label: string;
	    Installer: string;
	    VersionName: string;
	    VersionCode: string;
	    ApkPath: string;
	    DataDir: string;
	    FirstInstallTime: string;
	    LastUpdateTime: string;
	    ApkSize: string;
	    DataSize: string;
	    RequestedPermissions: string[];
	    GrantedPermissions: string[];
	
	    static createFrom(source: any = {}) {
	        return new PackageDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Label = source["Label"];
	        this.Installer = source["Installer"];
	        this.VersionName = source["VersionName"];
	        this.VersionCode = source["VersionCode"];
	        this.ApkPath = source["ApkPath"];
	        this.DataDir = source["DataDir"];
	        this.FirstInstallTime = source["FirstInstallTime"];
	        this.LastUpdateTime = source["LastUpdateTime"];
	        this.ApkSize = source["ApkSize"];
	        this.DataSize = source["DataSize"];
	        this.RequestedPermissions = source["RequestedPermissions"];
	        this.GrantedPermissions = source["GrantedPermissions"];
	    }
	}
	export class PackageInfo {
	    Name: string;
	    ApkPath: string;
	    IsSystem: boolean;
	    Label: string;
	    Installer: string;
	
	    static createFrom(source: any = {}) {
	        return new PackageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.ApkPath = source["ApkPath"];
	        this.IsSystem = source["IsSystem"];
	        this.Label = source["Label"];
	        this.Installer = source["Installer"];
	    }
	}
	export class UninstallResult {
	    Package: string;
	    Success: boolean;
	    Message: string;
	
	    static createFrom(source: any = {}) {
	        return new UninstallResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Package = source["Package"];
	        this.Success = source["Success"];
	        this.Message = source["Message"];
	    }
	}

}

