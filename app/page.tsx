'use client'; 

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<{ answer: string; videoId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setQuery(transcript);
  }, [transcript]);

  useEffect(() => {
    if (response && response.answer && !response.answer.startsWith("Sorry,")) {
      const utterance = new SpeechSynthesisUtterance(response.answer);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [response]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse(null);
    resetTranscript();
    window.speechSynthesis.cancel();

    try {
      const result = await axios.post('/api/ask', { question: query });
      setResponse(result.data);
    } catch (error) {
      console.error('Error fetching response:', error);
      setResponse({ answer: 'Sorry, the divine connection seems to be busy. Please try again.', videoId: null });
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
    }
  };
  
  const videoOptions = {
    height: '270',
    width: '480',
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 1,
    },
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="p-4 text-red-600">This browser does not support speech recognition.</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#d97706]">Jagannath AI Guide</h1>
        <p className="text-lg text-amber-800 mt-2">Your personal AI guide to the Lord of the Universe</p>
      </header>

      <main className="w-full max-w-3xl">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow-lg p-6 min-h-[350px]">
          {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-600"></div>
                  <p className="mt-4 text-amber-700">Seeking divine wisdom...</p>
              </div>
          )}
          {response && (
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {response.videoId && (
                <div className="w-full md:w-1/2 flex-shrink-0">
                    <YouTube videoId={response.videoId} opts={videoOptions} className="rounded-lg overflow-hidden shadow-md" />
                </div>
              )}
              <div className="prose max-w-none text-amber-900 overflow-y-auto max-h-[400px]">
                <p className="whitespace-pre-wrap">{response.answer}</p>
              </div>
            </div>
          )}
          {!isLoading && !response && (
              <div className="text-center text-amber-700/80 pt-16">
                  <p>Ask about Rath Yatra, Mahaprasad, Nabakalebara, or the temple's history.</p>
              </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type or click the mic to ask..."
            className="flex-grow p-3 border-2 border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button type="button" onClick={startListening} className={`p-3 rounded-lg transition-colors ${listening ? 'bg-red-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
            🎤
          </button>
          <button type="submit" disabled={isLoading} className="p-3 bg-orange-800 text-white rounded-lg hover:bg-orange-900 disabled:bg-gray-400">
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}