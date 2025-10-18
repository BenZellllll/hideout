import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Reply } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  username: string;
};

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    if (isOpen) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [isOpen]);

  const checkUser = async () => {
    // Prefer Hideout's own account system first (matches DB RLS on public.users)
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData?.id) {
          setUser(userData);
          return;
        }
      } catch {}
    }

    // Fallback to Supabase auth user (may not map to public.users)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id });
        return;
      }
    } catch {}

    setUser(null);
  };

  const fetchMessages = async () => {
    // Try Edge Function first, then DB, then localStorage
    try {
      const { data, error } = await supabase.functions.invoke('chat-history', { body: {} });
      if (!error && (data as any)?.success) {
        const msgs = (data as any).messages || [];
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
        localStorage.setItem('hideout_chat_messages', JSON.stringify(msgs.slice(-100)));
        return;
      }
    } catch {}

    // Fallback: Query directly via anon key (requires permissive RLS)
    try {
      const { data: msgs } = await (supabase as any)
        .from('global_chat')
        .select('id, user_id, message, created_at')
        .order('created_at', { ascending: true })
        .limit(100);

      if (msgs) {
        const userIds = Array.from(new Set(msgs.map((m: any) => m.user_id)));
        let usernames: Record<string, string> = {};
        if (userIds.length) {
          const { data: users } = await (supabase as any)
            .from('users')
            .select('id, username')
            .in('id', userIds);
          (users || []).forEach((u: any) => { usernames[u.id] = u.username || 'Unknown'; });
        }
        const enriched = msgs.map((m: any) => ({ ...m, username: usernames[m.user_id] || 'Unknown' }));
        setMessages(enriched);
        localStorage.setItem('hideout_chat_messages', JSON.stringify(enriched.slice(-100)));
        setTimeout(scrollToBottom, 100);
        return;
      }
    } catch {}

    // Last resort: localStorage (works offline)
    try {
      const cached = JSON.parse(localStorage.getItem('hideout_chat_messages') || '[]');
      setMessages(cached);
      setTimeout(scrollToBottom, 100);
    } catch {}
  };
  const subscribeToMessages = () => {
    const channel = supabase
      .channel('global_chat_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat'
        },
        async (payload) => {
          try {
            const { data: userData } = await (supabase as any)
              .from('users')
              .select('username')
              .eq('id', payload.new.user_id)
              .maybeSingle();

            const newMsg: ChatMessage = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              username: userData?.username || 'Unknown'
            };

            setMessages(prev => {
              const updated = [...prev, newMsg];
              
              // Delete oldest messages if over 100
              if (updated.length > 100) {
                const toDelete = updated.slice(0, updated.length - 100);
                toDelete.forEach(msg => {
                  (supabase as any).from('global_chat').delete().eq('id', msg.id).then();
                });
                return updated.slice(-100);
              }
              
              // Update localStorage cache
              localStorage.setItem('hideout_chat_messages', JSON.stringify(updated.slice(-100)));
              
              return updated;
            });
            
            setTimeout(scrollToBottom, 100);
          } catch (err) {
            console.error('Subscribe error:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Prefer Hideout account (public.users) to satisfy RLS policy, then fallback to Supabase auth
    let userId: string | null = null;

    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        userId = parsed?.id || null;
      } catch {}
    }

    if (!userId) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      userId = authUser?.id || null;
    }

    if (!userId) {
      toast.error("Please login to send messages");
      return;
    }

    const content = newMessage.trim().slice(0, 500);

    // 1) Try Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('chat-send', {
        body: { userId, message: content }
      });

      if (!error && !(data as any)?.error) {
        setNewMessage("");
        // Refresh list in case realtime isn't available
        fetchMessages();
        return;
      }
    } catch {}

    // 2) Try direct DB insert (requires permissive RLS)
    try {
      const { error: insErr } = await (supabase as any)
        .from('global_chat')
        .insert([{ user_id: userId, message: content }]);
      if (!insErr) {
        setNewMessage("");
        // Trim to last 100 in DB if possible
        try {
          const { data: ids } = await (supabase as any)
            .from('global_chat')
            .select('id, created_at')
            .order('created_at', { ascending: true });
          if (ids && ids.length > 100) {
            const toDelete = ids.slice(0, ids.length - 100).map((r: any) => r.id);
            if (toDelete.length) {
              await (supabase as any).from('global_chat').delete().in('id', toDelete);
            }
          }
        } catch {}
        fetchMessages();
        return;
      }
    } catch {}

    // 3) Fallback to localStorage-only so chat still works
    try {
      const cached: ChatMessage[] = JSON.parse(localStorage.getItem('hideout_chat_messages') || '[]');
      const now = new Date().toISOString();
      const newMsg: ChatMessage = { id: `${Date.now()}`, user_id: userId, message: content, created_at: now, username: user?.username || 'You' };
      const updated = [...cached, newMsg].slice(-100);
      localStorage.setItem('hideout_chat_messages', JSON.stringify(updated));
      setMessages(updated);
      setNewMessage("");
      setTimeout(scrollToBottom, 100);
      toast.success('Message sent locally (offline mode)');
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error(err?.message || "Failed to send message");
    }
  };
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <>
      {/* Chat Button */}
                <Button 
                  onClick={() => setIsOpen(true)}
                  className="fixed bottom-6 left-6 z-[9999] w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform"
                  size="icon"
                >
                  <MessageSquare className="w-6 h-6" />
                </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-[10000] shadow-2xl flex flex-col animate-slide-in-left">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Global Chat</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 p-3 rounded-lg ${
                    msg.user_id === user?.id
                      ? 'bg-primary/10 ml-auto max-w-[85%]'
                      : 'bg-muted max-w-[85%]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-primary">
                      {msg.username}
                    </span>
                    <span className="text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card/95 backdrop-blur">
            {!user ? (
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <a href="/auth" className="text-primary hover:underline">Login</a> to send messages
                </p>
              </div>
              ) : (
              <div className="space-y-2">
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                    <Reply className="w-3 h-3" />
                    <span>Replying to <strong>{replyTo.username}</strong></span>
                    <button onClick={() => setReplyTo(null)} className="ml-auto">✕</button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={500}
                    className="flex-1"
                  />
                  <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
};
