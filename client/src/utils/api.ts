// Local stubs: no backend or authentication is required in this stage.
import { createId } from './createId';
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

export type ChatDetails = { messages: Message[] };

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const getChats = async (): Promise<ApiResponse<Chat[]>> => {
  await delay(700);
  return {
    success: true,
    data: [
      { _id: 'chat-1', title: 'What is posthog', userId: 'u1', createdAt: new Date().toISOString() },
      { _id: 'chat-2', title: 'Who are our users', userId: 'u1', createdAt: new Date().toISOString() },
      { _id: 'chat-3', title: 'Marketing Hypothesis', userId: 'u1', createdAt: new Date().toISOString() },
    ],
    error: null,
  };
};

export const createChat = async (title: string): Promise<ApiResponse<Chat>> => {
  await delay(700);
  return {
    success: true,
    data: {
      _id: createId(),
      title,
      userId: 'u1',
      createdAt: new Date().toISOString(),
    },
    error: null,
  };
};

const sampleConversations: Record<string, { role: Message['role']; content: string }[]> = {
  'chat-1': [
    { role: 'user', content: 'What is posthog, and how can I use it? Give me 5 examples\nThink well' },
    { role: 'assistant', content: '**PostHog** is an **open-source product analytics platform** that helps teams understand **how users actually use their product**, not just how many users they have.\n\nUnlike tools that focus mainly on pageviews or dashboards, PostHog is built around events, behavior, and experimentation — with strong control over data ownership (cloud or self-hosted).\n\n---' },
    { role: 'assistant', content: '### What PostHog is (in simple terms)\n\nPostHog lets you answer questions like:\n\n- *What do users do after signing up?*\n- *Where do they drop off?*\n- *Which feature actually brings value?*\n- *Did this design change improve behavior or not?*\n\nIt combines:\n\n- Product analytics (events, funnels, retention)\n- Session recordings\n- Feature flags\n- A/B testing\n- Data warehouse sync\n\nAll in one platform.\n\n---' },
    { role: 'assistant', content: '### How you use PostHog (high level)\n\n1. **Track events** in your app\n\n   (e.g. `Signed up`, `Clicked “Generate”`, `Uploaded PDF`)\n\n2. **Attach properties**\n\n   (plan type, device, country, company size, etc.)\n\n3. **Analyze behavior** using:\n\n   - Funnels\n   - Trends\n   - Retention\n   - User paths\n\n4. **Experiment & iterate**\n\n   Turn features on/off, run A/B tests, watch recordings' },
  ],
  'chat-2': [
    { role: 'user', content: 'Who are our users?' },
    { role: 'assistant', content: 'In this sample conversation, our users are **teams working with shared knowledge**. They want to find answers without searching through every document.' },
    { role: 'user', content: 'What are their main needs?' },
    { role: 'assistant', content: '### Main user needs\n\nThey need:\n\n1. A central place for their documents.\n2. Clear answers to everyday questions.\n3. A way to revisit earlier conversations.\n\n*Validate these assumptions with user interviews.*' },
  ],
  'chat-3': [
    { role: 'user', content: 'Help me write a marketing hypothesis.' },
    { role: 'assistant', content: 'Start with a specific **audience**, a proposed **change**, and a measurable **outcome**.' },
    { role: 'user', content: 'Can you give me an example?' },
    { role: 'assistant', content: '> If we show a short product demo to knowledge teams, more visitors will start a trial.\n\nCompare trial sign-ups against a baseline and decide on a measurement period before running the experiment.' },
  ],
};

export const getChat = async (chatId: string): Promise<ApiResponse<ChatDetails>> => {
  await delay(700);
  return {
    success: true,
    data: {
      messages: (sampleConversations[chatId] || []).map((message, index) => ({
        ...message,
        _id: `${chatId}-message-${index + 1}`,
        chatId,
        createdAt: new Date().toISOString(),
      })),
    },
    error: null,
  };
};

export const sendMessage = async (chatId: string, text: string): Promise<ApiResponse<Message>> => {
  await delay(1500);
  return {
    success: true,
    data: {
      _id: createId(),
      chatId,
      role: 'assistant',
      content: `Thanks for your question: “${text}”\n\nThis is a sample response. Connect the chat API to get answers from your knowledge base.`,
      createdAt: new Date().toISOString(),
    },
    error: null,
  };
};

export const getDocuments = async (): Promise<ApiResponse<KnowledgeDoc[]>> => {
  await delay(700);
  return {
    success: true,
    data: [
      { _id: '1', title: 'Code Review Guidelines', fileName: 'code-review-guidelines.pdf', userId: 'u1', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Onboarding Handbook', fileName: 'onboarding-handbook.pdf', userId: 'u1', createdAt: new Date().toISOString() },
      { _id: '3', title: 'Engineering Best Practices', fileName: 'engineering-best-practices.pdf', userId: 'u1', createdAt: new Date().toISOString() },
    ],
    error: null,
  };
};
