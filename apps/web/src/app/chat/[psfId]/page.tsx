'use client';

import { isPsfId } from '@/lib/psf-unit';
import { getPsfById, type PsfId } from '@/lib/scheduling/psf-config';
import ChatFlow from '../components/chat-flow';

export default function ChatPage({ params }: { params: { psfId: string } }) {
  const psfId = params.psfId;

  if (!isPsfId(psfId)) {
    return (
      <main className="chat-empty-state">
        <h1>Unidade não encontrada</h1>
        <p>Verifique o link e tente novamente.</p>
      </main>
    );
  }

  const psf = getPsfById(psfId as PsfId);
  if (!psf) {
    return (
      <main className="chat-empty-state">
        <h1>Unidade não encontrada</h1>
        <p>Verifique o link e tente novamente.</p>
      </main>
    );
  }

  return <ChatFlow psfId={psfId as PsfId} psf={psf} />;
}
