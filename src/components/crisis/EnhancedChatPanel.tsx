import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEnhancedChat, EnhancedMessage } from '@/hooks/crisis/useEnhancedChat';
import { useAuth } from '@/hooks/auth/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { uploadVoiceNote } from '@/hooks/crisis/useVoiceNoteUpload';
import {
  Send, Smile, Reply, Check, CheckCheck, Mic, MicOff, X,
} from 'lucide-react';

interface Props {
  caseId: string;
  tenantId: string;
}

// ── Quick emoji reactions ────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😊', '🙏', '💪'];

// ── Date separator ───────────────────────────────────────────────────
function formatDateSeparator(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

// ── Group messages by date ───────────────────────────────────────────
function groupMessagesByDate(messages: EnhancedMessage[]) {
  const groups: { date: string; messages: EnhancedMessage[] }[] = [];
  let currentDate = '';

  for (const msg of messages) {
    const dateStr = format(new Date(msg.created_at), 'yyyy-MM-dd');
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ date: dateStr, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function EnhancedChatPanel({ caseId, tenantId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    messages, sendMessage, markAsRead, toggleReaction,
    broadcastTyping, typingUsers,
  } = useEnhancedChat(caseId);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<EnhancedMessage | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showNewIndicator, setShowNewIndicator] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Auto-scroll ────────────────────────────────────────────────────
  const isNearBottom = () => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowNewIndicator(false);
    } else if (messages.length > 0) {
      setShowNewIndicator(true);
    }
  }, [messages.length]);

  // ── Mark as read when visible ──────────────────────────────────────
  useEffect(() => {
    markAsRead();
  }, [messages.length, markAsRead]);

  // ── Typing indicator throttle ──────────────────────────────────────
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    broadcastTyping();
  };

  // ── Send ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage.mutateAsync({
        case_id: caseId,
        tenant_id: tenantId,
        message: newMessage.trim(),
        message_type: 'text',
        reply_to_id: replyTo?.id,
      });
      setNewMessage('');
      setReplyTo(null);
    } catch { /* handled */ } finally {
      setSending(false);
    }
  };

  // ── Voice recording ────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const filePath = await uploadVoiceNote(caseId, blob);
        if (filePath) {
          const fileName = `voice-${Date.now()}.webm`;
          await sendMessage.mutateAsync({
            case_id: caseId,
            tenant_id: tenantId,
            message: '🎤 Voice note',
            message_type: 'voice_note',
            attachments: { path: filePath, type: 'audio/webm', name: fileName },
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // Mic permission denied
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewIndicator(false);
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-3 space-y-1 relative">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            {t('crisisSupport.mySupport.noMessages')}
          </p>
        ) : (
          messageGroups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <span className="text-2xs text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                  {formatDateSeparator(new Date(group.date))}
                </span>
              </div>

              {group.messages.map((msg, idx) => {
                const isMe = msg.sender_user_id === user?.id;
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const isSameSender = prevMsg?.sender_user_id === msg.sender_user_id;
                const repliedMsg = msg.reply_to_id
                  ? messages.find(m => m.id === msg.reply_to_id)
                  : null;
                const isRead = msg.read_at !== null;
                const reactions = (msg.reactions || {}) as Record<string, string[]>;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => { setHoveredMsgId(null); setShowReactions(null); }}
                  >
                    <div className="relative max-w-[80%] group">
                      {/* Reply reference */}
                      {repliedMsg && (
                        <div className={`text-2xs px-3 py-1 mb-0.5 rounded-t-lg border-s-2 border-primary/40 ${isMe ? 'bg-primary/10' : 'bg-muted/60'} text-muted-foreground truncate`}>
                          <Reply className="h-2.5 w-2.5 inline me-1" />
                          {repliedMsg.message.substring(0, 60)}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`rounded-lg px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {msg.message_type === 'voice_note' ? (
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            <span className="text-sm">{t('crisisSupport.chat.voiceNote')}</span>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-2xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                          {isMe && (
                            isRead
                              ? <CheckCheck className="h-3 w-3 text-primary-foreground/90" />
                              : <Check className="h-3 w-3 opacity-60" />
                          )}
                        </div>
                      </div>

                      {/* Reactions display */}
                      {Object.keys(reactions).length > 0 && (
                        <div className={`flex gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction.mutate({ messageId: msg.id, emoji })}
                              className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                users.includes(user?.id || '') ? 'border-primary bg-primary/10' : 'border-border bg-background'
                              }`}
                            >
                              {emoji} {users.length > 1 && users.length}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Hover actions */}
                      {hoveredMsgId === msg.id && (
                        <div className={`absolute top-0 ${isMe ? '-start-20' : '-end-20'} flex gap-0.5`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setReplyTo(msg)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Quick reaction picker */}
                      {showReactions === msg.id && (
                        <div className={`absolute -top-8 ${isMe ? 'end-0' : 'start-0'} bg-popover border border-border rounded-full px-2 py-1 flex gap-1 shadow-lg z-10`}>
                          {QUICK_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              className="hover:scale-125 transition-transform text-sm"
                              onClick={() => {
                                toggleReaction.mutate({ messageId: msg.id, emoji });
                                setShowReactions(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start mt-2">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* New messages indicator */}
      {showNewIndicator && (
        <div className="flex justify-center -mt-8 relative z-10">
          <Button variant="secondary" size="sm" className="rounded-full text-xs shadow-md" onClick={scrollToBottom}>
            {t('crisisSupport.chat.newMessages')} ↓
          </Button>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border">
          <Reply className="h-3 w-3 text-primary" />
          <span className="truncate flex-1">{replyTo.message.substring(0, 80)}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyTo(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2 items-center">
          {isRecording ? (
            <>
              <div className="flex-1 flex items-center gap-2 text-sm text-destructive">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                {t('crisisSupport.chat.recording')}
              </div>
              <Button size="icon" variant="destructive" onClick={stopRecording}>
                <MicOff className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={startRecording} className="shrink-0">
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={e => handleInputChange(e.target.value)}
                placeholder={t('crisisSupport.mySupport.messagePlaceholder')}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
