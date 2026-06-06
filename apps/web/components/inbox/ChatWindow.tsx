'use client';

import { useState, useRef, RefObject, useEffect } from 'react';
import { Message, Conversation } from '@/lib/types';
import { ArrowRight, Send, Info, CheckCheck, Check } from 'lucide-react';
import { getSocket } from '@/lib/socket';

export default function ChatWindow({
  conversation,
  messages,
  onSend,
  onBack,
  onUpdateStatus,
  onToggleContact,
  showBackButton,
  messagesEndRef,
  token,
}: {
  conversation: any;
  messages: Message[];
  onSend: (body: string) => void;
  onBack: () => void;
  onUpdateStatus: (s: 'OPEN' | 'PENDING' | 'CLOSED') => void;
  onToggleContact: () => void;
  showBackButton: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  token: string;
}) {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef<any>(null);

  function handleChange(v: string) {
    setText(v);
    if (!typing) {
      setTyping(true);
      const sock = getSocket(token);
      sock.emit('typing', { conversationId: conversation.id, isTyping: true });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      const sock = getSocket(token);
      sock.emit('typing', { conversationId: conversation.id, isTyping: false });
    }, 1500);
  }

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    setTyping(false);
    const sock = getSocket(token);
    sock.emit('typing', { conversationId: conversation.id, isTyping: false });
  }

  const contact = conversation.contact;
  const name = contact.name || contact.pushName || contact.phone;

  return (
    <>
      {/* Header */}
      <div className="bg-wa-green-darker text-white px-3 py-2.5 flex items-center gap-3">
        {showBackButton && (
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded">
            <ArrowRight size={20} />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-xs opacity-80">{contact.phone}</div>
        </div>
        <button onClick={onToggleContact} className="p-2 hover:bg-white/10 rounded md:hidden">
          <Info size={20} />
        </button>
        <select
          value={conversation.status}
          onChange={(e) => onUpdateStatus(e.target.value as any)}
          className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/20"
        >
          <option className="text-black" value="OPEN">مفتوحة</option>
          <option className="text-black" value="PENDING">قيد الانتظار</option>
          <option className="text-black" value="CLOSED">مغلقة</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin chat-bg p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">لا توجد رسائل</div>
        )}
        {messages.map((m) => {
          const isOut = m.direction === 'OUTBOUND';
          return (
            <div key={m.id} className={`flex ${isOut ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] px-3 py-2 shadow-sm ${isOut ? 'bubble-out' : 'bubble-in'}`}>
                <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {m.body || `[${m.type}]`}
                </div>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="text-[10px] text-gray-500">
                    {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOut && (
                    m.status === 'READ' ? <CheckCheck size={14} className="text-blue-500" /> :
                    m.status === 'DELIVERED' ? <CheckCheck size={14} className="text-gray-500" /> :
                    m.status === 'SENT' ? <Check size={14} className="text-gray-500" /> :
                    m.status === 'FAILED' ? <span className="text-red-500 text-[10px]">فشل</span> :
                    <Check size={14} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-wa-panel border-t p-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wa-green"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white w-11 h-11 rounded-full flex items-center justify-center"
        >
          <Send size={18} className="rotate-180" />
        </button>
      </div>
    </>
  );
}
