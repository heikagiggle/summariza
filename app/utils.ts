// Types
export type ChatMessage = { role: "user" | "ai"; text: string };
export type Phase = "idle" | "preview" | "processing" | "done";

// Helpers
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

//Styles

export const dotCanvas: React.CSSProperties = {
  backgroundColor: "#EFEAE0",
  backgroundImage: "radial-gradient(#D9CFB8 1px, transparent 1px)",
  backgroundSize: "14px 14px",
};
