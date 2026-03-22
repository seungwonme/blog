import { Annotation, StateGraph } from "@langchain/langgraph";
import { getGroq } from "@/shared/api/groq";
import type { PostData } from "./content";
import { getAboutContent, searchPosts } from "./content";
import { semanticSearch } from "./semantic-search";

interface Source {
  title: string;
  slug: string;
  category: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AskState = Annotation.Root({
  question: Annotation<string>,
  history: Annotation<ChatMessage[]>,
  route: Annotation<"rag" | "chat">,
  relevantPosts: Annotation<PostData[]>,
  answer: Annotation<string>,
  sources: Annotation<Source[]>,
});

// Node 1: 질문 분류
async function classify(state: typeof AskState.State) {
  const groq = getGroq();
  const result = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a query classifier for a developer blog. Classify the user's message into one of two categories:
- "rag": The user is asking about blog content, technical topics, the blog owner, or anything that could be answered by searching blog posts.
- "chat": The user is making casual conversation, greeting, or asking something unrelated to blog content.

Respond with ONLY "rag" or "chat", nothing else.`,
      },
      { role: "user", content: state.question },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    max_tokens: 10,
  });

  const classification = result.choices[0]?.message?.content
    ?.trim()
    .toLowerCase();
  const route = classification === "rag" ? "rag" : "chat";

  return { route };
}

// Node 2: RAG 검색
async function retrieve(state: typeof AskState.State) {
  let relevantPosts = await semanticSearch(state.question, 3);
  if (relevantPosts.length === 0) {
    relevantPosts = searchPosts(state.question).slice(0, 3);
  }
  return { relevantPosts };
}

// Node 3: RAG 기반 답변 생성
async function generateWithRag(state: typeof AskState.State) {
  const aboutContent = getAboutContent();
  const postsContext = state.relevantPosts
    .map(
      (p) =>
        `## ${p.title} (slug: ${p.slug}, category: ${p.category})\n${p.content}`,
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are an AI assistant for seunan.dev, a terminal-style developer blog. Answer questions based on the blog content provided below. If the blog content doesn't contain relevant information, say so honestly. Always be concise and helpful. Respond in the same language as the question.

IMPORTANT: When suggesting a command to read a post, always use the English slug with its category. NEVER use Korean titles in commands.
Available posts:
${state.relevantPosts.map((p) => `- cat ${p.category}/${p.slug}`).join("\n")}

Blog content:
${postsContext || "No relevant posts found."}

About the blog owner:
${aboutContent}`;

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  for (const msg of state.history) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: state.question });

  const completion = await getGroq().chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
  });

  const answer =
    completion.choices[0]?.message?.content ??
    "Sorry, I couldn't generate a response.";
  const sources = state.relevantPosts.map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category,
  }));

  return { answer, sources };
}

// Node 4: 일반 대화 답변
async function generateChat(state: typeof AskState.State) {
  const aboutContent = getAboutContent();

  const systemPrompt = `You are a friendly AI assistant for seunan.dev, a terminal-style developer blog. You are having a casual conversation with a visitor. Be warm, concise, and helpful. Respond in the same language as the question.

If the visitor asks something that might be related to blog content, suggest they use 'ask "question"' or 'grep keyword' commands to search.

About the blog owner:
${aboutContent}`;

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  for (const msg of state.history) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: state.question });

  const completion = await getGroq().chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 512,
  });

  const answer =
    completion.choices[0]?.message?.content ??
    "Sorry, I couldn't generate a response.";

  return { answer, sources: [] };
}

// 라우팅 함수
function routeByClassification(state: typeof AskState.State) {
  return state.route === "rag" ? "retrieve" : "generate_chat";
}

// 그래프 빌드
const workflow = new StateGraph(AskState)
  .addNode("classify", classify)
  .addNode("retrieve", retrieve)
  .addNode("generate_rag", generateWithRag)
  .addNode("generate_chat", generateChat)
  .addEdge("__start__", "classify")
  .addConditionalEdges("classify", routeByClassification, {
    retrieve: "retrieve",
    generate_chat: "generate_chat",
  })
  .addEdge("retrieve", "generate_rag")
  .addEdge("generate_rag", "__end__")
  .addEdge("generate_chat", "__end__");

const askGraph = workflow.compile();

export async function runAskGraph(
  question: string,
  history: ChatMessage[],
  threadId?: string,
): Promise<{ answer: string; sources: Source[] }> {
  const result = await askGraph.invoke(
    {
      question,
      history,
      route: "chat" as const,
      relevantPosts: [],
      answer: "",
      sources: [],
    },
    threadId
      ? {
          metadata: { thread_id: threadId },
          configurable: { thread_id: threadId },
        }
      : undefined,
  );

  return {
    answer: result.answer,
    sources: result.sources,
  };
}
