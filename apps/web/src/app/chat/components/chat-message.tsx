'use client';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user';
    content: string;
    timestamp: number;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot';

  return (
    <div className={`chat-message-row ${isBot ? 'is-bot' : 'is-user'}`}>
      <div className={`chat-message-bubble ${isBot ? 'is-bot' : 'is-user'}`}>
        {message.content}
      </div>
    </div>
  );
}
