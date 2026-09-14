"use client";
import { useEffect, useRef, useState } from "react";
import {  ChatMessage, formatFileSize, Phase, dotCanvas} from "./utils";
import { UploadIcon } from "./icons/upload-icon";
import { FileIcon } from "./icons/file-icon";
import { CheckIcon } from "./icons/check-icon";
import { CopyIcon } from "./icons/copy-icon";
import { SendIcon } from "./icons/send-icon";
import { PulseBar } from "./components/pulse-bar";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const phase: Phase = loading ? "processing" : isProcessed ? "done" : file ? "preview" : "idle";

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatHistory, chatLoading]);

  const applyNewFile = (f: File | null) => {
    setFile(f);
    setSummary("");
    setIsProcessed(false);
    setChatHistory([]);
    setCopied(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyNewFile(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") applyNewFile(f);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setSummary("");
    setIsProcessed(false);
    setChatHistory([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/summarize", { method: "POST", body: formData });
      const data = await res.json();

      if (data.summary) {
        setSummary(data.summary);
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentText: data.extractedText || data.summary, query: "" }),
        });
        setIsProcessed(true);
      } else {
        setSummary(`Error: ${data.error}`);
      }
    } catch {
      setSummary("An unexpected error occurred during ingestion.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !isProcessed) return;

    const userMessage = chatInput;
    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "ai", text: data.answer || `Error: ${data.error}` }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Failed to communicate with engine." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied - fail silently
    }
  };

  return (
    <main
      className="min-h-screen bg-[#FAF8F3] p-6 md:p-10"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 items-baseline gap-x-3 gap-y-1">
          <h1  className="text-[28px] font-semibold text-[#1C1B19]">
            Summariza
          </h1>
          <p className="text-sm text-[#6B6457]">Upload a document, read the essentials, then ask it anything.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: document intake */}
          <div className="flex flex-col rounded-2xl border border-[#DDD6C7] bg-white p-6 lg:col-span-2 lg:h-[calc(100vh-200px)] lg:overflow-y-auto">
            <input
              ref={fileInputRef}
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {phase === "idle" && (
              <label
                htmlFor="pdf-upload"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={isDragging ? undefined : dotCanvas}
                className={`flex grow cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                  isDragging ? "border-[#A8752E] bg-[#F3E7CF]" : "border-[#DDD6C7]"
                }`}
              >
                <UploadIcon className="h-7 w-7 text-[#A8752E]" />
                <div>
                  <p className="text-sm font-medium text-[#1C1B19]">Drop a PDF here, or click to browse</p>
                  <p className="mt-1 text-xs text-[#6B6457]">One document at a time · PDF only</p>
                </div>
              </label>
            )}

            {phase === "preview" && (
              <form onSubmit={handleUploadSubmit} className="flex grow flex-col justify-between gap-5">
                <div>
                  <div style={dotCanvas} className="rounded-xl p-5">
                    <div className="mx-auto aspect-3/4 w-full max-w-60 overflow-hidden rounded-lg bg-white shadow-[0_12px_30px_-10px_rgba(28,27,25,0.35)]">
                      {previewUrl && (
                        <iframe
                          src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                          className="h-full w-full border-none"
                          title="Document preview"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2 text-[#6B6457]">
                      <FileIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{file?.name}</span>
                      {file && <span className="shrink-0 text-xs">· {formatFileSize(file.size)}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 text-xs font-medium text-[#A8752E] hover:underline cursor-pointer"
                    >
                      Choose a different file
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!file}
                  className="w-full rounded-lg bg-[#1C1B19] py-2.5 text-sm font-medium text-white transition hover:bg-[#33312C] disabled:cursor-not-allowed disabled:bg-[#DDD6C7] cursor-pointer"
                >
                  Summarize document
                </button>
              </form>
            )}

            {phase === "processing" && (
              <div className="flex grow flex-col justify-center gap-6">
                <div className="flex items-center gap-2 text-sm text-[#6B6457]">
                  <FileIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{file?.name}</span>
                </div>
                <div className="rounded-xl border border-[#DDD6C7] bg-[#FAF8F3] px-6 py-10 text-center flex flex-col items-center">
                  <p className="mb-4 text-sm text-[#1C1B19]">Reading your document…</p>
                  <PulseBar />
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="flex grow flex-col gap-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2 text-[#6B6457]">
                    <FileIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 text-xs font-medium text-[#A8752E] hover:underline cursor-pointer"
                  >
                    Replace
                  </button>
                </div>

                <div className="rounded-xl border border-[#DDD6C7] bg-white p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3  className="text-base font-semibold text-[#1C1B19]">
                      Document summary
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Copy summary to clipboard"
                      className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#6B6457] transition hover:bg-[#F3E7CF] hover:text-[#A8752E]"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="max-h-64 overflow-y-auto whitespace-pre-wrap pr-1 text-[14px] leading-relaxed text-[#332F28]">
                    {summary}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: chat */}
          <div className="flex flex-col rounded-2xl border border-[#DDD6C7] bg-white lg:col-span-3 lg:h-[calc(100vh-200px)]">
            <div className="shrink-0 border-b border-[#DDD6C7] px-6 py-4">
              <h2  className="text-base font-semibold text-[#1C1B19]">
                Ask the document
              </h2>
              <p className="mt-0.5 text-xs text-[#6B6457]">
                {isProcessed ? "Answers are grounded in the file you uploaded." : "Upload a document to start."}
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {!isProcessed ? (
                <div className="flex h-full min-h-55 flex-col items-center justify-center text-center">
                  <p className="text-sm text-[#A39C8A]">
                    Upload a document on the left to start a conversation about it.
                  </p>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex h-full min-h-55 flex-col items-center justify-center text-center">
                  <p className="text-sm text-[#6B6457]">Your document is ready. Try asking:</p>
                  <p className="mt-1 text-sm font-medium text-[#A8752E]">“What does page 2 cover?”</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "user" ? (
                      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#223047] px-4 py-2.5 text-[15px] leading-relaxed text-white">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed text-[#1C1B19]">
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="pl-0.5">
                  <PulseBar width="w-20" />
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-[#DDD6C7] px-4 py-3"
            >
              <input
                type="text"
                value={chatInput}
                disabled={!isProcessed || chatLoading}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isProcessed ? "Ask a question about this document…" : "Upload a document to start chatting"}
                className="flex-1 rounded-full border border-[#DDD6C7] bg-[#FAF8F3] px-4 py-2 text-sm text-[#1C1B19] placeholder:text-[#A39C8A] focus:outline-none focus:ring-2 focus:ring-[#A8752E]/40 disabled:cursor-not-allowed disabled:bg-[#F3F1EA]"
              />
              <button
                type="submit"
                disabled={!isProcessed || !chatInput.trim() || chatLoading}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C1B19] text-white transition hover:bg-[#33312C] disabled:cursor-not-allowed disabled:bg-[#DDD6C7] disabled:text-[#A39C8A]"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}