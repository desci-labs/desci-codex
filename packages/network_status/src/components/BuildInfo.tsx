import { Wrench } from "lucide-react";

export function BuildInfo() {
  const buildDate = new Date(__BUILD_TIME__).toLocaleString();
  const commitHash = __COMMIT_HASH__.slice(0, 7);

  return (
    <div
      className="fixed bottom-4 right-4 opacity-30 hover:opacity-100 transition-opacity duration-200 z-50"
      title={`Build: ${buildDate}\nCommit: ${commitHash}`}
    >
      <div className="p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border/50">
        <Wrench className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
