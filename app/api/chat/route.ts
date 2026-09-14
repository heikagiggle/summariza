import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const localAI = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_AI_BASE_URL || "http://localhost:11434/v1",
  apiKey: process.env.OPENAI_API_KEY || "ollama-local-infrastructure",
  defaultHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
});

function chunkText(text: string, maxCharacters = 1000): string[] {
  const paragraphs = text.split(/\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (let paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxCharacters) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += " \n " + paragraph;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

let globalVectorStore: { text: string; embedding: number[] }[] = [];

export async function POST(req: NextRequest) {
  try {
    const { query, documentText } = await req.json();

    //Index the document chunks when it's first uploaded
    if (documentText) {
      globalVectorStore = []; //clear previous document data cache
      const textChunks = chunkText(documentText);
      console.log(
        `\n📦 RAG Pipeline: Slicing document into ${textChunks.length} text chunks...`,
      );

      for (const chunk of textChunks) {
        const response = await fetch("http://localhost:11434/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "nomic-embed-text", input: chunk }),
        });

        const data = await response.json();

        if (data.embeddings && data.embeddings[0]) {
          globalVectorStore.push({
            text: chunk,
            embedding: data.embeddings[0],
          });
        }
      }
      console.log(
        `✅ RAG Pipeline: Successfully indexed ${globalVectorStore.length} vector embeddings!`,
      );
      return NextResponse.json({
        success: true,
        message: "Vector cache initialized.",
      });
    }

    if (!query) {
      return NextResponse.json(
        { error: "Missing user query string" },
        { status: 400 },
      );
    }

    if (globalVectorStore.length === 0) {
      return NextResponse.json(
        { error: "No document vector cache found. Please re-upload the file." },
        { status: 400 },
      );
    }

    //Embed the user's specific question
    const queryEmbeddingRes = await fetch("http://localhost:11434/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", input: query }),
    });
    const queryData = await queryEmbeddingRes.json();
    const queryEmbedding: number[] = queryData.embeddings?.[0];

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Failed to resolve query vector layers." },
        { status: 500 },
      );
    }

    //Find matching text blocks
    const scoredChunks = globalVectorStore.map((item) => {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * item.embedding[i];
        normA += queryEmbedding[i] ** 2;
        normB += item.embedding[i] ** 2;
      }
      const score =
        normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
      return { text: item.text, score };
    });

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    console.log(`\n🔍 TARGETED VECTORS FETCHED FOR QUERY: "${query}"`);
    topChunks.forEach((c, idx) =>
      console.log(
        `[Chunk #${idx + 1}] (Score: ${c.score.toFixed(4)}): ${c.text.substring(0, 120)}...`,
      ),
    );

    const contextPayload = topChunks.map((c) => c.text).join("\n\n");

    //Query Llama 3.2 using ONLY the targeted text blocks
    const response = await localAI.chat.completions.create({
      model: "llama3.2:1b",
      messages: [
        {
          role: "system",
          content: `You are an expert document assistant. Answer the user's question accurately using ONLY the context facts provided below. 
          If the context does not contain information to answer the question, state politely that you lack sufficient data.
          
          Grounded Context Source Blocks:\n${contextPayload}`,
        },
        {
          role: "user",
          content: `Question: ${query}`,
        },
      ],
    });

    const answer = response.choices[0].message.content;
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("RAG Pipeline Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
