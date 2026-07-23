'use client';

import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={disabled}
        className="chat-input"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="chat-send-button"
        aria-label="Enviar mensagem"
      >
        <ArrowUp size={20} />
      </button>
    </form>
  );
}
