import { NextResponse } from "next/server";
import { runAskGraph } from "@/shared/lib/ask-graph";

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
    const { question, history, sessionId } = body;

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
    const threadId =
      typeof sessionId === "string" && sessionId.length > 0
        ? sessionId
        : undefined;
    const result = await runAskGraph(
      sanitizeContent(question),
      chatHistory,
      threadId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 },
    );
  }
}
