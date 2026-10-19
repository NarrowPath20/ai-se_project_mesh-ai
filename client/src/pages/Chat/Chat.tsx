import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAppLayout } from '../../components/AppLayout/useAppLayout';
import ReactMarkdown from 'react-markdown';
import { createChat, getChat, getChats, sendMessage } from '../../utils/api';
import type { Chat as ChatType, Message } from '../../utils/api';
import './Chat.css';

export default function Chat() {
  const { isMobile, sidebarContainer, setIsMenuOpen } = useAppLayout();
  const titleInput = useRef<HTMLInputElement>(null);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sending = useRef(false);
  const selectionVersion = useRef(0);
  const newChatButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getChats();
        if (!res.success) throw new Error(res.error?.message || 'Failed to load chats.');
        if (active) setChats((current) => [...current, ...(res.data || [])]);
      } catch {
        if (active) setChatsError('Failed to load chats.');
      } finally {
        if (active) setIsLoadingChats(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    let active = true;
    const load = async () => {
      setMessages([]);
      setMessagesError('');
      setIsLoadingMessages(true);
      try {
        const res = await getChat(activeChatId);
        if (!res.success) throw new Error('Failed to load messages.');
        if (active) setMessages(res.data?.messages || []);
      } catch {
        if (active) setMessagesError('Failed to load messages. Please select another chat and try again.');
      } finally {
        if (active) setIsLoadingMessages(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [activeChatId]);

  const selectChat = (chatId: string) => {
    setIsMenuOpen(false);
    if (chatId === activeChatId) return;
    selectionVersion.current += 1;
    setInput('');
    setMessages([]);
    setMessagesError('');
    setIsLoadingMessages(true);
    setActiveChatId(chatId);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeChatId || isSending || sending.current || isLoadingMessages || messagesError) return;

    const chatId = activeChatId;
    const version = selectionVersion.current;
    const userMessage: Message = {
      _id: crypto.randomUUID(),
      chatId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    sending.current = true;
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const res = await sendMessage(chatId, text);
      if (!res.success || !res.data) throw new Error('Failed to send message.');
      const reply = res.data;
      if (selectionVersion.current === version) setMessages((current) => [...current, reply]);
    } catch {
      const errorMessage: Message = {
        _id: crypto.randomUUID(),
        chatId,
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        createdAt: new Date().toISOString(),
      };
      if (selectionVersion.current === version) setMessages((current) => [...current, errorMessage]);
    } finally {
      sending.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  const startNewChat = () => {
    setIsMenuOpen(true);
    setIsCreatingChat(true);
    requestAnimationFrame(() => titleInput.current?.focus());
  };

  const closeTitleInput = () => {
    setIsCreatingChat(false);
    setNewChatTitle('');
    newChatButton.current?.focus();
  };

  const handleCreateChat = async () => {
    const title = newChatTitle.trim() || 'New Chat';
    closeTitleInput();
    try {
      const res = await createChat(title);
      if (!res.success || !res.data) throw new Error('Failed to create chat.');
      const chat = res.data;
      setChats((current) => [chat, ...current]);
      selectChat(chat._id);
    } catch {
      setChatsError('Failed to create chat. Please try again.');
    }
  };

  const sidebar = (
    <aside className="chat__sidebar" aria-label="Conversations">
      <button
        className="chat__new-btn"
        type="button"
        ref={newChatButton}
        aria-expanded={isCreatingChat}
        onClick={() => setIsCreatingChat(true)}
      >
        + New Chat
      </button>
      {isCreatingChat && (
        <input
          ref={titleInput}
          className="chat__title-input"
          type="text"
          aria-label="Chat name"
          placeholder="Chat name"
          value={newChatTitle}
          onChange={(event) => setNewChatTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleCreateChat();
            }
            if (event.key === 'Escape') closeTitleInput();
          }}
          autoFocus
        />
      )}
      {isLoadingChats && <p className="chat__sidebar-message" role="status">Loading…</p>}
      {chatsError && <p className="chat__sidebar-message chat__sidebar-message_error" role="alert">{chatsError}</p>}
      <ul className="chat__list" aria-label="Chats" aria-busy={isLoadingChats}>
        {chats.map((chat) => (
          <li className={`chat__item${activeChatId === chat._id ? ' chat__item_active' : ''}`} key={chat._id}>
            <button
              className="chat__select-btn"
              type="button"
              aria-pressed={activeChatId === chat._id}
              onClick={() => selectChat(chat._id)}
            >
              {chat.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <div className="chat">
      {isMobile && sidebarContainer ? createPortal(sidebar, sidebarContainer) : sidebar}
      <section className="chat__main" aria-label="Conversation messages" aria-busy={isLoadingMessages}>
        {!activeChatId ? (
          <div className="chat__no-messages">
            <h1 className="chat__state-title">Start a conversation</h1>
            <p>Select a chat or create a new one to explore your knowledge.</p>
            <button className="chat__new-btn chat__start-btn" type="button" onClick={startNewChat}>Start New Chat</button>
          </div>
        ) : isLoadingMessages ? (
          <p className="chat__no-messages" role="status">Loading messages…</p>
        ) : messagesError ? (
          <div className="chat__error" role="alert">
            <h2 className="chat__state-title">Couldn't load this conversation</h2>
            <p>{messagesError}</p>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="chat__no-messages">
                <h2 className="chat__state-title">No messages yet</h2>
                <p>This conversation is ready for your first question.</p>
              </div>
            ) : (
              <ul className="chat__messages" aria-label="Messages">
                {messages.map((message) => (
                  <li className={`chat__message chat__message_${message.role}`} key={message._id}>
                    <span className="chat__message-author">{message.role === 'user' ? 'You' : 'MeshAI'}</span>
                    <div className="chat__message-content">
                      {message.role === 'assistant' ? <ReactMarkdown>{message.content}</ReactMarkdown> : <p>{message.content}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="chat__input-bar">
              <textarea
                className="chat__input"
                aria-label="Message"
                placeholder="Ask any question"
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <button
                className="chat__send"
                type="button"
                aria-label="Send message"
                onClick={() => void handleSend()}
                disabled={isSending || !input.trim()}
              >
                <span aria-hidden="true">↑</span>
              </button>
            </div>
            {isSending && <p className="chat__sending" role="status">Sending message…</p>}
          </>
        )}
      </section>
    </div>
  );
}
