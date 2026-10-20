import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAppLayout } from '../../hooks/useAppLayout';
import ReactMarkdown from 'react-markdown';
import { createChat, getChat, getChats, sendMessage } from '../../utils/api';
import type { Chat as ChatType, Message } from '../../utils/api';
import './Chat.css';
import { createId } from '../../utils/createId';
import { Link } from 'react-router-dom';
import plusIcon from '../../assets/plus.svg';
import sendIcon from '../../assets/send.svg';
import errorIcon from '../../assets/chat-error.svg';

export default function Chat() {
  const { isMobile, sidebarContainer, setIsMenuOpen } = useAppLayout();
  const titleInput = useRef<HTMLInputElement>(null);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  const creatingChat = useRef(false);
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
      _id: createId(),
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
        _id: createId(),
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
    if (creatingChat.current) return;
    creatingChat.current = true;
    setIsSubmittingChat(true);
    const title = newChatTitle.trim() || 'New Chat';
    try {
      const res = await createChat(title);
      if (!res.success || !res.data) throw new Error('Failed to create chat.');
      const chat = res.data;
      closeTitleInput();
      setChatsError(null);
      setChats((current) => [chat, ...current]);
      selectChat(chat._id);
    } catch {
      setChatsError('Failed to create chat. Please try again.');
    } finally {
      creatingChat.current = false;
      setIsSubmittingChat(false);
    }
  };

  const sidebar = (
    <aside className="chat__sidebar" aria-label="Conversations">
      <button
        className="chat__new-btn"
        type="button"
        ref={newChatButton}
        aria-expanded={isCreatingChat}
        aria-label="+ New Chat"
        onClick={() => setIsCreatingChat(true)}
      >
        <img src={plusIcon} width="16" height="16" alt="" />New Chat
      </button>
      {isCreatingChat && (
        <form className="chat__create-form" onSubmit={(event) => { event.preventDefault(); void handleCreateChat(); }}>
          <input
            ref={titleInput}
            className="chat__title-input"
            type="text"
            aria-label="Chat name"
            placeholder="Chat name"
            value={newChatTitle}
            disabled={isSubmittingChat}
            onChange={(event) => setNewChatTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Escape') closeTitleInput();
            }}
            autoFocus
          />
          <button className="chat__create-submit" type="submit" disabled={isSubmittingChat}>
            {isSubmittingChat ? 'Creating…' : 'Create chat'}
          </button>
        </form>
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
      <section className={`chat__main${!activeChatId || (!isLoadingMessages && !messagesError && messages.length === 0) ? ' chat__main_empty' : ''}${isLoadingMessages ? ' chat__main_loading' : ''}${messagesError ? ' chat__main_error' : ''}`} aria-label="Conversation messages" aria-busy={isLoadingMessages}>
        {!activeChatId ? (
          <div className="chat__no-messages">
            <h1 className="chat__state-title">Create a new chat or select an existing one to start the conversation</h1>
            <button className="chat__new-btn chat__start-btn" type="button" onClick={startNewChat}>Start New Chat</button>
          </div>
        ) : isLoadingMessages ? (
          <p className="chat__no-messages chat__loading" role="status">Loading...</p>
        ) : messagesError ? (
          <div className="chat__error" role="alert">
            <div className="chat__error-icon"><img src={errorIcon} alt="" /></div>
            <h2 className="chat__state-title">Looks like something went wrong</h2>
            <p>Try reloading the page or creating the chat again</p>
            <Link className="chat__main-link" to="/">Go to the Main Page</Link>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="chat__no-messages">
                <h2 className="chat__state-title"><span className="chat__empty-desktop">Ask a question below<br />to start the conversation</span><span className="chat__empty-mobile">Ask a question<br />below to start<br />the conversation</span></h2>
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
                <img src={sendIcon} width="24" height="24" alt="" />
              </button>
            </div>
            {isSending && <p className="chat__sending" role="status">Sending message…</p>}
          </>
        )}
      </section>
    </div>
  );
}
