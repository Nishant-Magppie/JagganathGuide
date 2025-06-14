import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { question } = await request.json();

        if (!question) {
            return NextResponse.json({ error: "Question is required." }, { status: 400 });
        }

        // Use the Gemini-Pro model for text generation
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are an expert guide on Lord Jagannath, Hinduism, and Puri culture. A user has asked: "${question}".
        Provide a response as a single, clean JSON object with two keys: "narrative" and "video_search_query".
        - "narrative": A detailed, engaging answer.
        - "video_search_query": A concise search term for YouTube to find a relevant video.
        Example for "Tell me about Rath Yatra":
        {
            "narrative": "The Rath Yatra, or Chariot Festival, is a grand annual event in Puri, Odisha. It celebrates Lord Jagannath's journey with his siblings, Lord Balabhadra and Devi Subhadra, from their main temple to the Gundicha Temple. Millions of devotees pull the massive, ornate chariots.",
            "video_search_query": "Puri Jagannath Rath Yatra documentary high quality"
        }`;

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        
        let cleanedJsonString = aiResponseText.match(/\{[\s\S]*\}/)?.[0] || '{}';
        const aiData = JSON.parse(cleanedJsonString);

        const narrative = aiData.narrative || "I couldn't find a detailed narrative for that topic.";
        const videoQuery = aiData.video_search_query || question;

        const videoSearchResponse = await youtube.search.list({
            part: ["snippet"],
            q: videoQuery,
            type: ["video"],
            maxResults: 1,
            videoEmbeddable: "true",
        });

        const videoId = videoSearchResponse.data.items?.[0]?.id?.videoId || null;

        return NextResponse.json({
            answer: narrative,
            videoId: videoId,
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to process the request." }, { status: 500 });
    }
}