'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { Conversation, Message } from '@/lib/types';
import ConversationList from '@/components/inbox/ConversationList';
import ChatWindow from '@/components/inbox/ChatWindow';
import ContactPanel from '@/components/inbox/ContactPanel';
import { Menu, X } from 'lucide-react';

export default function InboxPage() {
  const token = useAuthStore((s) => s.token);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.on('message:new', (p: any) => {
      // refresh conversation list
      loadConversations();
      if (p.conversationId === activeId) {
        setMessages((m) => [...m, p.message]);
        scrollToBottom();
        // mark as read
        api.post(`/conversations/${activeId}/read`).catch(() => {});
      }
    });
    sock.on('conversation:updated', () => {
      loadConversations();
      if (activeId) loadActive(activeId);
    });
    return () => {
      sock.off('message:new');
      sock.off('conversation:updated');
    };
  }, [token, activeId]);

  useEffect(() => {
    if (activeId) {
      loadActive(activeId);
      loadMessages(activeId);
      // mark as read
      api.post(`/conversations/${activeId}/read`).catch(() => {});
    }
  }, [activeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversations() {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
      if (!activeId && data.length > 0) {
        // don't auto-select on mobile
        if (window.innerWidth >= 768) setActiveId(data[0].id);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function loadActive(id: string) {
    try {
      const { data } = await api.get(`/conversations/${id}`);
      setActiveConv(data);
    } catch {}
  }

  async function loadMessages(id: string) {
    try {
      const { data } = await api.get(`/conversations/${id}/messages`);
      setMessages(data);
    } catch {}
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function onSelectConversation(id: string) {
    setActiveId(id);
    setShowSidebar(false); // mobile: hide list
  }

  function onBack() {
    setActiveId(null);
    setShowSidebar(true);
    setShowContact(false);
  }

  async function onSend(body: string) {
    if (!activeId) return;
    try {
      const { data } = await api.post(`/conversations/${activeId}/messages`, { body });
      setMessages((m) => [...m, data]);
      scrollToBottom();
    } catch (e: any) {
      alert(e.response?.data?.message || 'فشل الإرسال');
    }
  }

  async function onUpdateStatus(status: 'OPEN' | 'PENDING' | 'CLOSED') {
    if (!activeId) return;
    await api.patch(`/conversations/${activeId}/status`, { status });
  }

  async function onAssign(userId: string | null) {
    if (!activeId) return;
    await api.patch(`/conversations/${activeId}/assign`, { userId });
    loadActive(activeId);
  }

  async function onAddNote(body: string) {
    if (!activeId) return;
    await api.post(`/conversations/${activeId}/notes`, { body });
    loadActive(activeId);
  }

  return (
    <div className="h-full flex bg-white md:gap-0">
      {/* LEFT: conversation list */}
      <div
        className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-l bg-white`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelectConversation}
          loading={loading}
        />
      </div>

      {/* CENTER: chat */}
      <div
        className={`${!showSidebar || activeId ? 'flex' : 'hidden'} md:flex flex-col flex-1 border-l bg-white`}
      >
        {activeId && activeConv ? (
          <ChatWindow
            conversation={activeConv}
            messages={messages}
            onSend={onSend}
            onBack={onBack}
            onUpdateStatus={onUpdateStatus}
            onToggleContact={() => setShowContact((s) => !s)}
            showBackButton={!showSidebar}
            messagesEndRef={messagesEndRef}
            token={token!}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="text-7xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-1">مرحباً بك في صندوق الوارد</h2>
            <p className="text-sm">اختر محادثة من القائمة لبدء المراسلة</p>
          </div>
        )}
      </div>

      {/* RIGHT: contact info */}
      {activeId && activeConv && (
        <div className={`${showContact ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 absolute md:relative inset-0 md:inset-auto z-10 md:z-auto`}>
          <ContactPanel
            conversation={activeConv}
            onClose={() => setShowContact(false)}
            onAssign={onAssign}
            onAddNote={onAddNote}
            onUpdateStatus={onUpdateStatus}
          />
        </div>
      )}
    </div>
  );
}
