import { NextRequest } from 'next/server';
import { POST } from '../app/api/ask/route';

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => '{ "narrative": "Great festival", "video_search_query": "Rath Yatra" }' }
        })
      })
    }))
  };
});

jest.mock('googleapis', () => {
  return {
    google: {
      youtube: jest.fn().mockReturnValue({
        search: {
          list: jest.fn().mockResolvedValue({ data: { items: [{ id: { videoId: 'abc123' } }] } })
        }
      })
    }
  };
});

describe('POST /api/ask', () => {
  it('returns answer and videoId', async () => {
    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question: 'Tell me about Rath Yatra' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await POST(req as any);
    const data = await res.json();
    expect(data).toEqual({ answer: 'Great festival', videoId: 'abc123' });
  });
});
