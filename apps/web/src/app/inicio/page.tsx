'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenShell } from '../../components/citizen-shell';
import { CitizenAnnouncementPrompt } from '../../components/citizen-announcement-prompt';
import { getSession } from '../../lib/auth';
import { fetchCurrentUser } from '../../lib/auth-api';
import { fetchAnnouncementFeed, resolveAnnouncementAssetUrl, type CitizenAnnouncement } from '../../lib/announcements-api';
import { PWA_LOGIN } from '../../lib/pwa';

export default function CitizenHomePage() {
  const router = useRouter();
  const [items, setItems] = useState<CitizenAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace(PWA_LOGIN);
      return;
    }

    fetchCurrentUser(session.accessToken)
      .catch(() => undefined)
      .finally(() => {
        fetchAnnouncementFeed(session.accessToken)
          .then(setItems)
          .catch(() => setError('Não foi possível carregar os avisos.'))
          .finally(() => setLoading(false));
      });
  }, [router]);

  return (
    <CitizenShell title="Início" subtitle="Avisos e comunicados da prefeitura.">
      <CitizenAnnouncementPrompt />

      {loading ? <p className="scheduling-copy">Carregando avisos...</p> : null}
      {error ? <p className="login-error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <section className="panel scheduling-panel">
          <h3>Nenhum aviso publicado</h3>
          <p className="scheduling-copy">Novos comunicados aparecerão aqui quando a prefeitura publicar.</p>
        </section>
      ) : null}

      <div className="citizen-feed">
        {items.map((item) => {
          const imageUrl = resolveAnnouncementAssetUrl(item.imageUrl);
          return (
            <article key={item.id} className="order-card citizen-feed-card">
              {imageUrl ? (
                <img src={imageUrl} alt={item.title} className="citizen-feed-card__image" loading="lazy" />
              ) : null}
              <p className="eyebrow">
                {item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString('pt-BR')
                  : new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              {item.body ? <p className="citizen-feed-card__body">{item.body}</p> : null}
              {item.linkUrl ? (
                <a href={item.linkUrl} target="_blank" rel="noreferrer" className="citizen-feed-card__link">
                  Saiba mais
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </CitizenShell>
  );
}
