'use client';

import { ImagePlus, Mic, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  connectSupportSocket,
  sendSupportMedia,
  sendSupportText,
  supportMediaUrl,
  type SupportConversation,
  type SupportMessage
} from '../lib/support-chat-api';

export function SupportChatThread({ conversation, token, ownType }: {
  conversation: SupportConversation;
  token: string;
  ownType: SupportMessage['senderType'];
}) {
  const [messages, setMessages] = useState(conversation.messages ?? []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(conversation.messages ?? []);
  }, [conversation]);
  useEffect(() => {
    const socket = connectSupportSocket(token);
    socket.emit('conversation:join', conversation.id);
    socket.on('message:new', (message: SupportMessage) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    return () => { socket.disconnect(); };
  }, [conversation.id, token]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function submitText(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const message = await sendSupportText(conversation.id, text, token);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setText('');
    } finally { setSending(false); }
  }

  async function upload(file?: File) {
    if (!file || sending) return;
    setSending(true);
    try {
      const message = await sendSupportMedia(conversation.id, file, token);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    } finally { setSending(false); }
  }

  return (
    <section className="support-chat">
      <div className="support-chat__messages">
        {messages.length === 0 ? <p className="scheduling-copy">Envie uma mensagem para iniciar o atendimento.</p> : null}
        {messages.map((message) => (
          <article key={message.id} className={`support-chat__bubble${message.senderType === ownType ? ' is-own' : ''}`}>
            <small>{message.senderType === 'ATENDENTE' ? message.user?.name ?? 'Atendimento' : message.citizen?.name ?? 'Cidadão'}</small>
            {message.type === 'TEXTO' ? <p>{message.text}</p> : null}
            {message.type === 'IMAGEM' ? <a href={supportMediaUrl(message.mediaUrl)} target="_blank" rel="noreferrer"><img src={supportMediaUrl(message.mediaUrl)} alt="Imagem enviada na conversa" /></a> : null}
            {message.type === 'AUDIO' ? <audio controls src={supportMediaUrl(message.mediaUrl)} /> : null}
            <time>{new Date(message.createdAt).toLocaleString('pt-BR')}</time>
          </article>
        ))}
        <div ref={endRef} />
      </div>
      <form className="support-chat__composer" onSubmit={submitText}>
        <label className="support-chat__attach" title="Enviar imagem"><ImagePlus size={20} /><input type="file" accept="image/*" onChange={(event) => void upload(event.target.files?.[0])} /></label>
        <label className="support-chat__attach" title="Enviar áudio"><Mic size={20} /><input type="file" accept="audio/*" capture onChange={(event) => void upload(event.target.files?.[0])} /></label>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite sua mensagem..." maxLength={4000} />
        <button type="submit" disabled={sending || !text.trim()} aria-label="Enviar mensagem"><Send size={18} /><span>Enviar</span></button>
      </form>
    </section>
  );
}
