import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Paperclip, Mic } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ChatInterface.css';

const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);  // New state for typing indicator
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  // Initialize Google Generative AI with the hardcoded API key
  const genAI = new GoogleGenerativeAI('AIzaSyBEdDPAiT_DwnM5iO4BnMoROnyyOQVnIKc');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to format text with **bold** to HTML <strong> tags
  const formatText = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
  
    try {
      setLoading(true);
      setIsTyping(true);
  
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChat((prev) => [...prev, { role: 'user', content: message, time: currentTime }]);
  
      const model = genAI.getGenerativeModel({
        model: "models/gemini-pro", // NOTE: Fully qualified model name
      });
  
      const result = await model.generateContent({
        contents: [{ parts: [{ text: message }] }],
      });
  
      const text = result.response.text();
  
      const formattedText = formatText(text);
  
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: formattedText, time: currentTime },
      ]);
      setMessage("");
    } catch (error) {
      console.error("Error:", error);
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };
  

  return (
    <div className="ai-chat-widget">
      <div className="ai-chat-toggle-button" onClick={toggleChat}>
        <MessageCircle size={28} />
      </div>
      {isOpen && (
        <div className="ai-chat-box">
          <div className="ai-chat-header">
            <h3>Chat with Us</h3>
            <X size={20} className="ai-close-icon" onClick={toggleChat} />
          </div>
          <div className="ai-chat-content">
            {chat.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div
                  className="ai-message-text"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
                <div className="ai-message-time">{msg.time}</div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-typing-indicator">
                <div></div>
                <div></div>
                <div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-chat-input-container">
            <form onSubmit={handleSubmit} className="ai-chat-form">
              {/* <Paperclip size={20} className="icon-attachment" /> */}
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="ai-chat-input"
              />
              <button type="submit" className="ai-send-button">
                <Send size={20} />
              </button>
              {/* <Mic size={20} className="icon-mic" /> */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
