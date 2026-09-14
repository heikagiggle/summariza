import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";

const localAI = new OpenAI({
  baseURL: process.env.AI_BASE_URL || "http://localhost:11434/v1",
  apiKey: process.env.OPENAI_API_KEY || "ollama-local-infrastructure",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Loading the PDF and extracting text
    const pdf = await getDocumentProxy(uint8Array);
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract legible text from PDF" },
        { status: 400 },
      );
    }
    const startTime = Date.now();

    const response = await localAI.chat.completions.create({
      model: "llama3.2:1b",
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical assistant. Analyze the text provided from the PDF document and give a highly structured, concise executive summary with bold bullet points of key takeaways.",
        },
        {
          role: "user",
          content: `Document Content:\n\n${text}`,
        },
      ],
    });

    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;

    console.log(`\n AI PERFORMANCE METRICS`);
    console.log(
      `Local LLM Generation Time: ${durationInSeconds.toFixed(2)} seconds`,
    );
    console.log(`End\n`);

    const summary = response.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("API Pipeline Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
