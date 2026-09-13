'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setSummary('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary(`Error: ${data.error}`);
      }
    } catch (err) {
      setSummary('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-8 my-10 bg-white rounded-xl shadow-md border border-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI PDF Summarizer 📄</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="file" 
          accept=".pdf" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          type="submit" 
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing Document...' : 'Generate Summary'}
        </button>
      </form>

      {summary && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Document Summary:</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{summary}</p>
        </div>
      )}
    </main>
  );
}