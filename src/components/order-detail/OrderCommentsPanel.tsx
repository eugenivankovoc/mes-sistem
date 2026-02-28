import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import { hr } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface Props {
  orderId: string;
  comments: Comment[];
  userId: string;
  onCommentAdded: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function OrderCommentsPanel({ orderId, comments, userId, onCommentAdded }: Props) {
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialIdsRef = useRef<Set<string>>(new Set());

  // Track initial comment IDs so we only animate new ones
  useEffect(() => {
    if (initialIdsRef.current.size === 0 && comments.length > 0) {
      initialIdsRef.current = new Set(comments.map((c) => c.id));
    }
  }, [comments]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`order-comments-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_comments",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setAnimatedIds((prev) => new Set(prev).add(payload.new.id));
          onCommentAdded();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onCommentAdded]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !userId) return;

    setSending(true);
    const { error } = await supabase
      .from("order_comments")
      .insert({ order_id: orderId, user_id: userId, content: trimmed });

    setSending(false);
    if (error) {
      toast.error("Greška pri slanju komentara.");
      return;
    }
    setNewComment("");
  };

  const shouldAnimate = (id: string) =>
    !initialIdsRef.current.has(id) || animatedIds.has(id);

  return (
    <Card className="flex flex-col max-h-[calc(100vh-120px)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Komentari i aktivnost
        </CardTitle>
      </CardHeader>
      <Separator />
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <CardContent className="p-4 space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nema komentara. Budite prvi!
            </p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className={`flex gap-3 ${shouldAnimate(c.id) ? "animate-slide-in" : ""}`}
            >
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className="text-[11px] font-medium bg-muted text-muted-foreground">
                  {getInitials(c.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold truncate">{c.user_name}</span>
                  <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(parseISO(c.created_at), {
                      addSuffix: true,
                      locale: hr,
                    })}
                  </span>
                </div>
                <p className="text-[14px] text-foreground whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
      <Separator />
      <div className="p-4 space-y-2">
        <Textarea
          placeholder="Dodaj komentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newComment.trim() || sending}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Pošalji
          </Button>
        </div>
      </div>
    </Card>
  );
}
