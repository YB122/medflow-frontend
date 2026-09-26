'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { Send, Plus, MessageCircle, CheckCheck, History } from 'lucide-react';
import { api, useAuth, API_URL } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RequireRole } from '@/components/require-role';
import { useT } from '@/components/i18n-provider';

export default function ChatPage() {
  return (
    <RequireRole allow={['PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'STAFF']}>
      <Chat />
    </RequireRole>
  );
}

function Chat() {
  const t = useT();
  const token = useAuth((s) => s.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [peer, setPeer] = useState('');
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [msgPage, setMsgPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const MSG_LIMIT = 50;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<any[]>('/conversations').then(setConvs).catch(() => null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const base = API_URL.replace(/\/api\/v1$/, '');
    const s = io(`${base}/chat`, { auth: { token } });
    s.on('m:new', (m: any) => setMsgs((prev) => [...prev, m]));
    s.on('m:typing', () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    });
    s.on('m:read', () => {
      // Local update (not a refetch) so previously loaded older pages stay intact.
      setMsgs((prev) => prev.map((m) => ({ ...m, read: true })));
    });
    s.on('presence', (p: { userId: string; online: boolean }) =>
      setPresence((prev) => ({ ...prev, [p.userId]: p.online })),
    );
    setSocket(s);
    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const open = async (id: string) => {
    setActive(id);
    setMsgPage(1);
    setHasMore(true);
    socket?.emit('c:join', { conversationId: id });
    const h = await api<any[]>(`/conversations/${id}/messages?limit=${MSG_LIMIT}`);
    setMsgs(h);
    if (h.length < MSG_LIMIT) setHasMore(false);
    socket?.emit('c:read', { conversationId: id });
  };

  /** History is newest-first pages: prepend the next (older) page on top. */
  const loadOlder = async () => {
    if (!active || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const older = await api<any[]>(`/conversations/${active}/messages?page=${msgPage + 1}&limit=${MSG_LIMIT}`);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMsgs((prev) => [...older, ...prev]);
        setMsgPage((p) => p + 1);
        if (older.length < MSG_LIMIT) setHasMore(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  };

  const createConv = async () => {
    if (!peer.trim()) return;
    const conv = await api<any>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ patientId: peer.trim(), doctorId: peer.trim() }),
    }).catch(() => null);
    if (conv?._id) {
      setConvs((c) => [conv, ...c]);
      open(conv._id);
      setPeer('');
    }
  };

  const send = () => {
    if (!active || !text.trim()) return;
    socket?.emit('c:send', { conversationId: active, text });
    setText('');
  };

  const activeConv = convs.find((c) => c._id === active);
  const online = activeConv && (presence[activeConv.patientId] || presence[activeConv.doctorId]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-sm font-bold text-primary">{t.chat.kicker}</p>
        <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">{t.chat.title}</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
        <Card className="mt-6 grid overflow-hidden md:grid-cols-3">
          {/* conversations */}
          <div className="border-b border-border/70 bg-muted/30 p-3 md:border-b-0 md:border-e">
            <div className="flex gap-1.5" dir="ltr">
              <Input value={peer} onChange={(e) => setPeer(e.target.value)} placeholder={t.chat.newConvPh} className="h-9 font-mono text-xs" />
              <Button size="icon" onClick={createConv} className="shrink-0"><Plus /></Button>
            </div>
            <div className="mt-2 max-h-72 space-y-1 overflow-auto md:max-h-[480px]">
              {convs.map((c: any) => {
                const isOnline = presence[c.patientId] || presence[c.doctorId];
                return (
                  <button
                    key={c._id}
                    onClick={() => open(c._id)}
                    dir="ltr"
                    className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 text-start transition-colors ${active === c._id ? 'bg-card shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-card/70'}`}
                  >
                    <span className="relative">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-[10px]">{c._id.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isOnline && <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">…{c._id.slice(-8)}</span>
                      <span className="block text-[11px] text-muted-foreground">{isOnline ? `🟢 ${t.chat.online}` : t.chat.offlineEn}</span>
                    </span>
                  </button>
                );
              })}
              {convs.length === 0 && (
                <p className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="size-8 opacity-40" /> {t.chat.noConvs}
                </p>
              )}
            </div>
          </div>

          {/* messages */}
          <div className="flex min-h-[480px] flex-col md:col-span-2">
            <div className="flex items-center gap-2.5 border-b border-border/70 p-3.5">
              <Avatar className="size-9">
                <AvatarFallback className="text-[10px]">{active ? active.slice(-2).toUpperCase() : '💬'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-extrabold" dir="ltr">{active ? `…${active.slice(-8)}` : t.chat.selectConv}</p>
                <p className="text-[11px] text-muted-foreground">
                  {active ? (online ? t.chat.onlineNow : t.chat.offline) : t.chat.fromList}
                </p>
              </div>
              {online && <Badge variant="success" className="ms-auto">{t.chat.online}</Badge>}
            </div>

            <div className="flex-1 space-y-2 overflow-auto bg-muted/20 p-4" dir="ltr">
              {hasMore && msgs.length > 0 && (
                <div className="flex justify-center pb-1">
                  <Button size="sm" variant="ghost" onClick={loadOlder} disabled={loadingOlder}>
                    <History /> {loadingOlder ? '…' : t.chat.loadOlder}
                  </Button>
                </div>
              )}
              <AnimatePresence initial={false}>
                {msgs.map((m: any, i: number) => {
                  const mine = m.mine ?? false;
                  return (
                    <motion.div
                      key={m._id ?? i}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-6 shadow-sm ${
                          mine
                            ? 'rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-bl-md border border-border/70 bg-card'
                        }`}
                      >
                        {m.text}
                        <span className={`mt-0.5 flex items-center justify-end gap-0.5 text-[10px] ${mine ? 'text-blue-100/80' : 'text-muted-foreground'}`}>
                          {m.read ? <CheckCheck className="size-3" /> : null}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {typing && <p className="text-xs text-muted-foreground">{t.chat.typing}</p>}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 border-t border-border/70 p-3">
              <Input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (active) socket?.emit('c:typing', { conversationId: active });
                }}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={t.chat.typePh}
                dir="ltr"
                disabled={!active}
              />
              <Button onClick={send} disabled={!active || !text.trim()}><Send /> {t.chat.send}</Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
