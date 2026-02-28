import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

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

export function OrderCommentsPanel({ orderId, comments, userId, onCommentAdded }: Props) {
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

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
    onCommentAdded();
  };

  return (
    <Card className="flex flex-col max-h-[calc(100vh-120px)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Komentari ({comments.length})
        </CardTitle>
      </CardHeader>
      <Separator />
      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="p-4 space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nema komentara. Budite prvi!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.user_name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {format(parseISO(c.created_at), "dd.MM.yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
      <Separator />
      <div className="p-4 flex gap-2">
        <Textarea
          placeholder="Napiši komentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
