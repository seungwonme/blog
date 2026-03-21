import { NextResponse } from "next/server";
import { getGroq } from "@/shared/api/groq";
import { getAboutContent, searchPosts } from "@/shared/lib/content";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Search for relevant posts
    const relevantPosts = searchPosts(question).slice(0, 3);
    const aboutContent = getAboutContent();

    // Build context
    const postsContext = relevantPosts
      .map((p) => `## ${p.title}\n${p.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an AI assistant for seunan.dev blog. Answer questions based on the blog content provided below. If the blog content doesn't contain relevant information, say so honestly. Always be concise and helpful. Respond in the same language as the question.

Blog content:
${postsContext || "No relevant posts found."}

About the blog owner:
${aboutContent}`;

    const completion = await getGroq().chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
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
