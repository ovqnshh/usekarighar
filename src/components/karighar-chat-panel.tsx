import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Image as ImageIcon, Camera, Smile,
  Check, CheckCheck, X, Download, Maximize2, MapPin,
  Sparkles, Clock, MessageSquare, Phone, ShieldCheck,
  ChevronRight, ArrowUpRight, Copy, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { inr } from "@/lib/karighar-api";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id?: string | null;
  content: string;
  created_at: string;
  read?: boolean;
  is_special_offer?: boolean;
  offer_amount?: number | null;
  reactions?: string[];
}

export interface ChatThread {
  projectId: string;
  title: string;
  location?: string;
  otherPartyName: string;
  otherPartyRole?: string;
  otherPartyAvatar?: string;
  otherPartyId?: string;
  lastMessage?: ChatMessage;
  unread?: boolean;
  messages: ChatMessage[];
  status?: string;
}

/** Parses attachment from message content: [ATTACHMENT:data_or_url|filename] text */
export function parseMessageContent(raw: string) {
  if (!raw) return { hasAttachment: false, attachmentUrl: null, attachmentName: null, text: "" };
  
  const match = raw.match(/^\[ATTACHMENT:(data:image\/[^;]+;base64,[^|]+|https?:\/\/[^|]+)\|([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    return {
      hasAttachment: true,
      attachmentUrl: match[1],
      attachmentName: match[2],
      text: match[3] || "",
    };
  }

  // Fallback: check if raw is a markdown image ![name](url)
  const mdMatch = raw.match(/^!\[([^\]]*)\]\((https?:\/\/[^\)]+|data:image\/[^\)]+)\)\s*([\s\S]*)$/);
  if (mdMatch) {
    return {
      hasAttachment: true,
      attachmentUrl: mdMatch[2],
      attachmentName: mdMatch[1] || "Attached photo",
      text: mdMatch[3] || "",
    };
  }

  return {
    hasAttachment: false,
    attachmentUrl: null,
    attachmentName: null,
    text: raw,
  };
}

interface KarigharChatPanelProps {
  threads: ChatThread[];
  activeProjectId: string | null;
  onSelectThread: (projectId: string) => void;
  currentUserId?: string;
  isPro?: boolean;
  onSendMessage: (projectId: string, content: string, receiverId?: string | null) => Promise<boolean | void>;
  emptyPlaceholder?: string;
  fastReplyOptions?: string[];
}

export function KarigharChatPanel({
  threads,
  activeProjectId,
  onSelectThread,
  currentUserId,
  isPro = false,
  onSendMessage,
  emptyPlaceholder = "Select a conversation to start chatting",
  fastReplyOptions,
}: KarigharChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; url: string } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = useMemo(() => {
    if (!threads || threads.length === 0) return null;
    if (activeProjectId) {
      const found = threads.find((t) => t.projectId === activeProjectId);
      if (found) return found;
    }
    return threads[0];
  }, [threads, activeProjectId]);

  // Default situational fast replies
  const defaultFastReplies = isPro
    ? [
        "I can arrive within 45 mins",
        "Please share a photo of the unit",
        "Quote submitted under Karighar SafePay",
        "On my way with replacement parts",
      ]
    : [
        "Are you available for a diagnostic visit today?",
        "I have attached photos of the issue",
        "What will be the estimated cost for spares?",
        "Please confirm arrival time",
      ];

  const chips = fastReplyOptions || defaultFastReplies;

  // Auto-scroll to bottom on thread change or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length, activeThread?.projectId]);

  // Handle fast reply click: populates textbox for edits!
  const handleFastReplyClick = (reply: string) => {
    setInputText(reply);
    textInputRef.current?.focus();
    toast.info("Fast reply inserted — you can edit before sending!");
  };

  // Handle photo/document attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        name: file.name,
        url: reader.result as string,
      });
      toast.success(`Attached "${file.name}" — add an optional note and hit send!`);
      textInputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if removed
    e.target.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeThread) return;

    const trimmed = inputText.trim();
    if (!trimmed && !pendingAttachment) return;

    let payload = trimmed;
    if (pendingAttachment) {
      payload = `[ATTACHMENT:${pendingAttachment.url}|${pendingAttachment.name}] ${trimmed}`;
    }

    setIsSending(true);
    const receiverId = activeThread.otherPartyId || null;

    try {
      await onSendMessage(activeThread.projectId, payload, receiverId);
      setInputText("");
      setPendingAttachment(null);
      // Simulate quick typing response indicator for 1.8 seconds in demo
      setIsTypingSimulated(true);
      setTimeout(() => setIsTypingSimulated(false), 2400);
    } catch (err: any) {
      toast.error("Message delivery failed: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      const existing = prev[messageId] || [];
      const updated = existing.includes(emoji)
        ? existing.filter((e) => e !== emoji)
        : [...existing, emoji];
      return { ...prev, [messageId]: updated };
    });
  };

  return (
    <div className="border border-border rounded-2xl h-[680px] bg-card shadow-warm flex overflow-hidden relative">

      {/* Hidden File Input for Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ─── Left Pane: Conversations List ──────────────────────────── */}
      <div className="w-80 md:w-88 border-r border-border flex flex-col shrink-0 bg-surface-subtle/40">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Conversations
            </span>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold bg-background">
            {threads.length} {threads.length === 1 ? "Thread" : "Threads"}
          </Badge>
        </div>

        {/* Thread items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 no-scrollbar">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
              <div className="size-12 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-muted-foreground">
                <MessageSquare className="size-6" />
              </div>
              <p className="font-semibold text-foreground">No conversations yet</p>
              <p className="text-[11px]">
                {isPro
                  ? "When Mumbai homeowners click 'Message on Karighar' on your storefront, their inquiry appears here with real-time alerts."
                  : "Start an inquiry with any verified Karighar professional or book a diagnostic visit to chat here."}
              </p>
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = activeThread?.projectId === t.projectId;
              const parsedLast = t.lastMessage ? parseMessageContent(t.lastMessage.content) : null;

              return (
                <div
                  key={t.projectId}
                  onClick={() => onSelectThread(t.projectId)}
                  className={`p-3.5 cursor-pointer transition-all relative group ${
                    isSelected
                      ? "bg-card border-l-4 border-primary shadow-warm-xs"
                      : "hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {t.otherPartyName ? t.otherPartyName.charAt(0).toUpperCase() : "K"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-foreground truncate">
                          {t.otherPartyName || t.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {t.otherPartyRole || t.title}
                        </p>
                      </div>
                    </div>

                    {t.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(t.lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  {/* Last message preview */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      {parsedLast?.hasAttachment && (
                        <ImageIcon className="size-3 text-primary shrink-0" />
                      )}
                      <span>{parsedLast?.text || (parsedLast?.hasAttachment ? "Photo attached" : "No messages")}</span>
                    </p>
                    {t.unread && (
                      <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right Pane: Active Chat Room ───────────────────────────── */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-full bg-card min-w-0">
          {/* Room Header */}
          <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-surface-subtle/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center border border-primary/20 shrink-0">
                {activeThread.otherPartyName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                    {activeThread.otherPartyName}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20 font-medium shrink-0">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SafePay Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span>{activeThread.location || "Mumbai"}</span>
                  <span>·</span>
                  <span className="font-medium text-foreground truncate">{activeThread.title}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/projects/$id"
                params={{ id: activeThread.projectId }}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-surface-subtle text-foreground shadow-warm-xs transition-colors"
              >
                <span>Project Status</span>
                <ArrowUpRight className="size-3 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* ─── Messages Stream ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-surface-subtle/10 to-transparent">
            {activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                <div className="size-12 rounded-2xl bg-surface-subtle flex items-center justify-center text-primary">
                  <MessageSquare className="size-6" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">SafePay Secure Conversation Initialized</h4>
                <p className="text-xs max-w-sm">
                  Send a note about your doorstep diagnostic, share photos of parts or leaks, and discuss exact arrival timings.
                </p>
              </div>
            ) : (
              activeThread.messages.map((msg, idx) => {
                const isMine = msg.sender_id === currentUserId;
                const parsed = parseMessageContent(msg.content);
                const msgReactions = reactions[msg.id] || [];

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className={`flex flex-col group relative ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`relative max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-warm-xs transition-shadow ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-card text-foreground rounded-bl-xs border border-border shadow-xs"
                      }`}
                    >
                      {/* Attached Photo / Document */}
                      {parsed.hasAttachment && parsed.attachmentUrl && (
                        <div className="mb-2.5 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 group/img relative bg-black/5">
                          <img
                            src={parsed.attachmentUrl}
                            alt={parsed.attachmentName || "Attached photo"}
                            className="w-full max-h-64 object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                            onClick={() => setZoomedImage(parsed.attachmentUrl)}
                          />
                          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-medium">
                            <Maximize2 className="size-3" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      )}

                      {/* Text content */}
                      {parsed.text && (
                        <p className="whitespace-pre-wrap leading-relaxed break-words">
                          {parsed.text}
                        </p>
                      )}

                      {/* Reactions on bubble */}
                      {msgReactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1">
                          {msgReactions.map((emoji, eIdx) => (
                            <span
                              key={eIdx}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="inline-flex items-center text-xs bg-background/90 text-foreground px-1.5 py-0.5 rounded-full border border-border shadow-xs cursor-pointer hover:scale-110 transition-transform"
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Floating Discord-style quick reaction bar on hover */}
                      <div
                        className={`absolute -top-7 ${
                          isMine ? "right-0" : "left-0"
                        } opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full py-0.5 px-1.5 flex items-center gap-1 shadow-warm-xs z-10`}
                      >
                        {["👍", "❤️", "🔧", "🙏"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Metadata: Timestamp & WhatsApp double checkmarks */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
                      <Clock className="size-2.5" />
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMine && (
                        <span className="text-primary font-bold ml-0.5 flex items-center" title={msg.read ? "Read" : "Delivered"}>
                          <CheckCheck className="size-3" />
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Simulated Live Typing Indicator */}
            {isTypingSimulated && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 bg-surface-subtle border border-border px-3 py-1.5 rounded-full w-fit text-xs text-muted-foreground shadow-xs"
              >
                <span className="text-[11px] font-medium">{activeThread.otherPartyName} is typing</span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Fast Reply Suggestions (Inserts into textbox for edits!) ─── */}
          <div className="px-4 py-2 border-t border-border bg-surface-subtle/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              Fast Replies:
            </span>
            <div className="flex items-center gap-1.5">
              {chips.map((replyText) => (
                <button
                  key={replyText}
                  type="button"
                  onClick={() => handleFastReplyClick(replyText)}
                  className="text-xs font-medium whitespace-nowrap bg-background hover:bg-surface-subtle border border-border hover:border-primary/50 text-foreground px-3 py-1 rounded-full transition-colors shadow-warm-xs hover:text-primary active:scale-95"
                >
                  {replyText}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Pending Attachment Preview Chip ────────────────────────── */}
          {pendingAttachment && (
            <div className="px-4 py-2 border-t border-border bg-primary/5 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={pendingAttachment.url}
                  alt={pendingAttachment.name}
                  className="size-9 rounded-lg object-cover border border-primary/30 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block truncate">
                    Ready to attach: {pendingAttachment.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Add an optional caption and hit send
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingAttachment(null)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {/* ─── Message Input Bar ────────────────────────────────────── */}
          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Attachment Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl shrink-0"
                title="Attach photo or diagnostic file"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:inline-flex h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl shrink-0"
                title="Take or upload photo"
              >
                <Camera className="size-4" />
              </Button>

              {/* Text Input */}
              <Input
                ref={textInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message on Karighar..."
                className="flex-1 bg-surface-subtle border-border rounded-xl text-xs sm:text-sm h-10 px-3.5 focus-visible:ring-1 focus-visible:ring-primary"
                autoComplete="off"
              />

              {/* Send Button */}
              <Button
                type="submit"
                disabled={isSending || (!inputText.trim() && !pendingAttachment)}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shadow-warm shrink-0 active:scale-95 transition-transform"
              >
                <span>Send</span>
                <Send className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card">
          <MessageSquare className="size-12 text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground text-sm">{emptyPlaceholder}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {isPro
              ? "All customer dispatches and inquiries from your profile will be collected here with real-time SafePay tracking."
              : "All conversations with Mumbai artisans and booking threads appear in your dashboard."}
          </p>
        </div>
      )}

      {/* ─── Modal: Zoomed Image Lightbox ─────────────────────────────── */}
      {zoomedImage && (
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-md border border-border p-3">
            <DialogHeader className="p-2 border-b border-border flex flex-row items-center justify-between">
              <DialogTitle className="text-xs font-semibold text-foreground">Attached Photo Preview</DialogTitle>
            </DialogHeader>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={zoomedImage}
                alt="Enlarged preview"
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-warm"
              />
            </div>
            <DialogFooter className="p-2 border-t border-border flex items-center justify-between">
              <a
                href={zoomedImage}
                download="karighar-attachment.jpg"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-card border border-border text-foreground transition-colors"
              >
                <Download className="size-3.5" />
                <span>Save Full Quality</span>
              </a>
              <Button onClick={() => setZoomedImage(null)} size="sm" className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
