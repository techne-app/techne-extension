import React, { useState, useRef } from 'react';
import { CreateExtensionServiceWorkerMLCEngine, type ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import Line from 'progressbar.js/src/line';

const MODEL_OPTIONS = [
  {
    id: "SmolLM",
    name: "SmolLM2-360M (Fast)",
    value: "SmolLM2-360M-Instruct-q4f16_1-MLC"
  },
  {
    id: "qwen",
    name: "Qwen2-0.5B (Balanced)", 
    value: "Qwen2-0.5B-Instruct-q4f16_1-MLC"
  },
  {
    id: "llama",
    name: "Llama-3.2-3B (Powerful)",
    value: "Llama-3.2-3B-Instruct-q4f16_1-MLC"
  }
];

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [engine, setEngine] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatCompletionMessageParam[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const [error, setError] = useState<string | null>(null);
  const progressBarRef = useRef<Line | null>(null);

  const initEngine = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const container = document.getElementById('loadingContainer');
      if (!container) {
        throw new Error('Loading container not found');
      }

      if (!progressBarRef.current) {
        progressBarRef.current = new Line(container, {
          strokeWidth: 4,
          easing: "easeInOut",
          duration: 1400,
          color: "#ffd166",
          trailColor: "#eee",
          trailWidth: 1,
          svgStyle: { width: "100%", height: "100%" }
        });
      }

      const progressBar = progressBarRef.current;
      progressBar.set(0);

      console.log('Starting model initialization:', selectedModel);
      const mlcEngine = await CreateExtensionServiceWorkerMLCEngine(
        selectedModel,
        { 
          initProgressCallback: (report) => {
            console.log('Progress:', report);
            progressBar.animate(report.progress, { duration: 50 });
            if (report.progress === 1.0) {
              setIsLoading(false);
            }
          }
        }
      );
      
      console.log('Model initialized successfully:', mlcEngine);
      setEngine(mlcEngine);
    } catch (err) {
      console.error('Detailed error initializing engine:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined,
        selectedModel,
      });
      setError(err instanceof Error ? err.message : 'Failed to initialize model');
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || !engine) return;

    const newHistory: ChatCompletionMessageParam[] = [
      ...chatHistory, 
      { role: "user" as const, content: message }
    ];
    setChatHistory(newHistory);
    setAnswer('');
    setIsLoading(true);

    try {
      let curMessage = '';
      const completion = await engine.chat.completions.create({
        stream: true,
        messages: newHistory,
      });

      for await (const chunk of completion) {
        const curDelta = chunk.choices[0].delta.content;
        if (curDelta) {
          curMessage += curDelta;
          setAnswer(curMessage);
        }
      }

      const finalMessage = await engine.getMessage();
      setChatHistory([
        ...newHistory, 
        { role: "assistant" as const, content: finalMessage }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      console.error('Error during chat:', err);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="chat-interface mb-8 w-full">
      <div className="flex justify-center items-center mb-4">
        <h1 className="text-xl font-bold">Chat with Techne</h1>
      </div>
      <div id="loadingContainer" className="h-2 mb-4" />
      
      {!engine ? (
        <div className="model-selector flex flex-col gap-4 p-4 border rounded mb-4">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 border rounded"
          >
            {MODEL_OPTIONS.map(model => (
              <option key={model.id} value={model.value}>
                {model.name}
              </option>
            ))}
          </select>
          <button
            onClick={initEngine}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            {isLoading ? 'Loading...' : 'Load Model'}
          </button>
          {error && (
            <div className="error-message text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="input-container flex gap-2 mb-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 p-2 border rounded"
            />
            <button 
              onClick={handleSubmit}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Send
            </button>
          </div>

          {error && (
            <div className="error-message text-red-500 mb-4">
              {error}
            </div>
          )}

          {answer && (
            <div className="answer-container p-3 rounded border">
              <p>{answer}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};