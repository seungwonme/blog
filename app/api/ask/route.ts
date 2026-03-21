import { NextResponse } from "next/server";
import { getGroq } from "@/shared/api/groq";
import { getAboutContent, searchPosts } from "@/shared/lib/content";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeContent(text: string): string {
  return text.replace(/<[^>]*>/g, "").slice(0, MAX_MESSAGE_LENGTH);
}

function validateHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  const validated: ChatMessage[] = [];
  for (const msg of history.slice(-MAX_HISTORY_TURNS)) {
    if (
      msg &&
      typeof msg === "object" &&
      typeof msg.content === "string" &&
      (msg.role === "user" || msg.role === "assistant")
    ) {
      validated.push({
        role: msg.role,
        content: sanitizeContent(msg.content),
      });
    }
  }
  return validated;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, history } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Question too long (max ${MAX_QUESTION_LENGTH} characters)`,
        },
        { status: 400 },
      );
    }

    const chatHistory = validateHistory(history);

    // Search for relevant posts
    const relevantPosts = searchPosts(question).slice(0, 3);
    const aboutContent = getAboutContent();

    // Build context
    const postsContext = relevantPosts
      .map((p) => `## ${p.title}\n${p.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an AI assistant for seunan.dev, a terminal-style developer blog. Answer questions based on the blog content provided below. If the blog content doesn't contain relevant information, say so honestly. Always be concise and helpful. Respond in the same language as the question.

This blog works like a terminal. Available commands:
- help: Show all available commands
- banner: Show welcome banner
- ls: List files in current directory
- cd <dir>: Change directory (cd dev, cd .., cd ~)
- cat <slug>: Read a blog post (must be in the right directory, or use cat dev/slug)
- grep <keyword>: Search posts by keyword
- about: Show blog owner's profile
- tags: List all tags
- ask "question": Ask AI about blog content (current mode)
- !: Toggle between terminal mode and AI chat mode
- email: Send email to blog owner
- whoami, hostname, date, history, echo, clear: Standard terminal commands

Keyboard shortcuts: Tab (autocomplete), ↑/↓ (history), Ctrl+A/E (cursor), Ctrl+L/Cmd+K (clear)

Blog content:
${postsContext || "No relevant posts found."}

About the blog owner:
${aboutContent}`;

    // Build messages with conversation history
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];

    for (const msg of chatHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: "user", content: sanitizeContent(question) });

    const completion = await getGroq().chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const answer =
      completion.choices[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    const sources = relevantPosts.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
    }));

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 },
    );
  }
}
