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
	    Serial: string;
	    IPAddress: string;
	    RootStatus: string;
	    Codename: string;
	    RamTotal: string;
	    StorageInfo: string;
	    Brand: string;
	    DeviceName: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Model = source["Model"];
	        this.AndroidVersion = source["AndroidVersion"];
	        this.BuildNumber = source["BuildNumber"];
	        this.BatteryLevel = source["BatteryLevel"];
	        this.Serial = source["Serial"];
	        this.IPAddress = source["IPAddress"];
	        this.RootStatus = source["RootStatus"];
	        this.Codename = source["Codename"];
	        this.RamTotal = source["RamTotal"];
	        this.StorageInfo = source["StorageInfo"];
	        this.Brand = source["Brand"];
	        this.DeviceName = source["DeviceName"];
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

}

