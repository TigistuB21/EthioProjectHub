'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ProjectChatDrawer.module.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface ProjectChatDrawerProps {
  projectId: string;
  projectTitle: string;
}

export default function ProjectChatDrawer({ projectId, projectTitle }: ProjectChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm your Gemini AI research assistant. Ask me anything about "${projectTitle.slice(0, 45)}${projectTitle.length > 45 ? '...' : ''}".`
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend.trim() })
      });

      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: data.answer
          }
        ]);
      } else {
        throw new Error(data.error || 'Failed to answer');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Sorry, I encountered an issue retrieving an answer. Please try asking again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'What is the main objective?',
    'What technical stack was used?',
    'Who are the authors?'
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={styles.chatTrigger}
        onClick={() => setIsOpen(!isOpen)}
        title="Ask AI Assistant about this project"
      >
        <span>🤖</span>
        <span>{isOpen ? 'Close Assistant' : 'Ask AI about Paper'}</span>
      </button>

      {/* Floating Drawer Window */}
      {isOpen && (
        <div className={styles.chatDrawer}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span>✨</span> AI Research Assistant
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              ✕
            </button>
          </div>

          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${
                  msg.sender === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid', borderTopColor: 'transparent' }} /> Analyzing project...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Chips on first interaction */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 1rem 0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.3rem' }}>
                Suggested questions:
              </div>
              <div className={styles.suggestedChips}>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.chip}
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={styles.inputArea}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
            <button type="submit" className={`btn btn-primary ${styles.sendBtn}`} disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
