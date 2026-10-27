import type { CurrentUser } from '../types';

const BASE_URL = '/api';
export type KnowledgeDoc = {
  _id: string;
  title: string;
  fileName: string;
  userId: string;
  createdAt: string;
};

export type Chat = {
  _id: string;
  title: string;
  userId: string;
  createdAt: string;
};

export type Message = {
  _id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type ChatDetails = { chat: Chat; messages: Message[] };

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth-token') ?? '';
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || 'Invalid credentials';
    if (localStorage.getItem('auth-token')) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    throw new Error(message);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || 'Request failed');
  }
  return res.json();
}

export function getCurrentUser() {
  return request<CurrentUser>(`${BASE_URL}/users/me`);
}

export function registerUser(name: string, email: string, password: string) {
  return request<CurrentUser>(`${BASE_URL}/auth/register`, {
    method: 'POST', body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser(email: string, password: string) {
  return request<{ token: string; user: CurrentUser }>(`${BASE_URL}/auth/login`, {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export const getChats = async (): Promise<ApiResponse<Chat[]>> => {
  return request<Chat[]>(`${BASE_URL}/chats`);
};

export const createChat = async (title: string): Promise<ApiResponse<Chat>> => {
  return request<Chat>(`${BASE_URL}/chats`, {
    method: 'POST', body: JSON.stringify({ title }),
  });
};

export const getChat = async (chatId: string): Promise<ApiResponse<ChatDetails>> => {
  return request<ChatDetails>(`${BASE_URL}/chats/${encodeURIComponent(chatId)}`);
};

export const sendMessage = async (chatId: string, question: string): Promise<ApiResponse<Message[]>> => {
  return request<Message[]>(`${BASE_URL}/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST', body: JSON.stringify({ question }),
  });
};
export const getDocuments = (): Promise<ApiResponse<KnowledgeDoc[]>> => {
  return request<KnowledgeDoc[]>(`${BASE_URL}/documents`);
};

export const uploadDocument = async (file: File): Promise<ApiResponse<KnowledgeDoc>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth-token') ?? ''}` },
    body: formData,
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => null);
    if (localStorage.getItem('auth-token')) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    throw new Error(body?.error?.message || 'Invalid credentials');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || 'Request failed');
  }
  return res.json();
};
