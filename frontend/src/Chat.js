import React, { useState } from "react";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState([]);

  const askQuestion = async () => {
    if (!question) return;
    const res = await fetch((process.env.REACT_APP_BACKEND || "http://localhost:8000") + "/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    setResponses(prev => [...prev, { q: question, a: data.explanation || JSON.stringify(data) }]);
    setQuestion("");
  };

  return (
    <div className="chat-container">
      <h2>Chat with FloatChat</h2>
      <div className="chat-box">
        {responses.map((r, i) => (
          <div key={i} className="chat-entry">
            <b>You:</b> {r.q} <br />
            <b>Bot:</b> {r.a}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={question}
        placeholder="Ask about floats, salinity, etc."
        onChange={e => setQuestion(e.target.value)}
        onKeyDown={e => e.key === "Enter" && askQuestion()}
      />
      <button onClick={askQuestion}>Ask</button>
    </div>
  );
}
