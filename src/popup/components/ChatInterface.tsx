import React, { useEffect, useState } from 'react';
import { CreateExtensionServiceWorkerMLCEngine, type ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import Line from 'progressbar.js/src/line';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [engine, setEngine] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatCompletionMessageParam[]>([]);

  useEffect(() => {
    const initEngine = async () => {
      const progressBar = new Line("#loadingContainer", {
        strokeWidth: 4,
        easing: "easeInOut",
        duration: 1400,
        color: "#ffd166",
        trailColor: "#eee",
        trailWidth: 1,
        svgStyle: { width: "100%", height: "100%" }
      });

      const mlcEngine = await CreateExtensionServiceWorkerMLCEngine(
        "Qwen2-0.5B-Instruct-q4f16_1-MLC",
        { 
          initProgressCallback: (report) => {
            progressBar.animate(report.progress, { duration: 50 });
            if (report.progress === 1.0) {
              setIsLoading(false);
            }
          }
        }
      );
      
      setEngine(mlcEngine);
    };

    initEngine();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || !engine) return;

    const newHistory: ChatCompletionMessageParam[] = [
      ...chatHistory, 
      { role: "user" as const, content: message }
    ];
    setChatHistory(newHistory);
    setAnswer('');
    setIsLoading(true);

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

    setIsLoading(false);
    const finalMessage = await engine.getMessage();
    setChatHistory([
      ...newHistory, 
      { role: "assistant" as const, content: finalMessage }
    ]);
    setMessage('');
  };

  return (
    <div className="chat-interface mb-8">
      <div id="loadingContainer" className={isLoading ? '' : 'hidden'} />
      
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

      {answer && (
        <div className="answer-container p-3 rounded border">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};