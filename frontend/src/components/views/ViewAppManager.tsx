import React from "react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Loader2, Trash2, Eraser, Eye, EyeOff } from "lucide-react";
import { AppManagerOverviewCard } from "@/components/appManager/AppManagerOverviewCard";
import { AppManagerQuickControlsCard } from "@/components/appManager/AppManagerQuickControlsCard";
import { InstalledPackagesCard } from "@/components/appManager/InstalledPackagesCard";
import { InstallApplicationCard } from "@/components/appManager/InstallApplicationCard";
import { useAppManager } from "@/hooks/useAppManager";

export function ViewAppManager({ activeView }: { activeView: string }) {
  const {
    apkPath,
    isInstalling,
    isLoadingList,
    filter,
    searchTerm,
    setSearchTerm,
    isClearing,
    pkgToAction,
    setPkgToAction,
    isClearDataOpen,
    setIsClearDataOpen,
    isTogglingPackageName,
    isPullingPackageName,
    selectedPackages,
    isBatchUninstalling,
    isBatchUninstallOpen,
    setIsBatchUninstallOpen,
    isBatchDisabling,
    isBatchDisablingOpen,
    setIsBatchDisablingOpen,
    isBatchEnabling,
    isBatchEnablingOpen,
    setIsBatchEnablingOpen,
    loadPackages,
    handleSelectApk,
    handleInstall,
    handleClearData,
    handleTogglePackage,
    handlePullApk,
    handleSelectPackage,
    handleSelectAllPackages,
    handleMultiUninstall,
    handleMultiDisable,
    handleMultiEnable,
    visiblePackages,
    allVisibleSelected,
    totalPackages,
    enabledPackages,
    disabledPackages,
    selectedCount,
    filterLabel,
    statusLabel,
    sortLabel,
    quickControlSelects,
    handleClearSelection,
    handleResetFilters,
    isBusy,
  } = useAppManager({ activeView });

  return (
    <>
      <AlertDialog open={isClearDataOpen} onOpenChange={setIsClearDataOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to clear data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all app data (logins, files, settings) for <span className="font-semibold text-foreground">{pkgToAction}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleClearData} disabled={isClearing}>
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
              Yes, Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBatchUninstallOpen} onOpenChange={setIsBatchUninstallOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to uninstall <span className="font-semibold text-foreground">{selectedPackages.length} selected packages</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchUninstalling}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleMultiUninstall} disabled={isBatchUninstalling}>
              {isBatchUninstalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Yes, Uninstall {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBatchDisablingOpen} onOpenChange={setIsBatchDisablingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to attempt to disable <span className="font-semibold text-foreground">{selectedPackages.length} selected packages</span>
              .
              <br />
              <strong className="text-destructive">System apps will likely fail (this is normal).</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDisabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiDisable} disabled={isBatchDisabling}>
              {isBatchDisabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
              Yes, Disable {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBatchEnablingOpen} onOpenChange={setIsBatchEnablingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to attempt to enable <span className="font-semibold text-foreground">{selectedPackages.length} selected packages</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchEnabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiEnable} disabled={isBatchEnabling}>
              {isBatchEnabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Yes, Enable {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <AppManagerOverviewCard
          isBusy={isBusy}
          onSync={() => loadPackages(filter)}
          metrics={[
            { label: "Total packages", value: totalPackages },
            { label: "Enabled", value: enabledPackages },
            { label: "Disabled", value: disabledPackages },
            { label: "Selected", value: selectedCount },
          ]}
        />

        <AppManagerQuickControlsCard
          quickControlSelects={quickControlSelects}
          selectedCount={selectedCount}
          isBusy={isBusy}
          onEnableSelected={() => setIsBatchEnablingOpen(true)}
          onDisableSelected={() => setIsBatchDisablingOpen(true)}
          onUninstallSelected={() => setIsBatchUninstallOpen(true)}
          onClearSelection={handleClearSelection}
          onResetFilters={handleResetFilters}
        />

        <InstalledPackagesCard
          visiblePackages={visiblePackages}
          totalPackages={totalPackages}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterLabel={filterLabel}
          statusLabel={statusLabel}
          sortLabel={sortLabel}
          isLoadingList={isLoadingList}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAll={(checked) => handleSelectAllPackages(checked, visiblePackages)}
          onSelectPackage={handleSelectPackage}
          onTogglePackage={handleTogglePackage}
          onPullApk={handlePullApk}
          onRequestClearData={(pkg) => {
            setPkgToAction(pkg.PackageName);
            setIsClearDataOpen(true);
          }}
          selectedPackages={selectedPackages}
          isTogglingPackageName={isTogglingPackageName}
          isPullingPackageName={isPullingPackageName}
        />

        <InstallApplicationCard apkPath={apkPath} isInstalling={isInstalling} onSelectApk={handleSelectApk} onInstall={handleInstall} />
      </div>
    </>
  );
}
