'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAdminAnnouncements,
  fetchAnnouncementPushStatus,
  formatAnnouncementPushMessage,
  publishAnnouncement,
  resolveAnnouncementAssetUrl,
  updateAnnouncement,
  uploadAnnouncementImage,
  type CitizenAnnouncement
} from '../../../lib/announcements-api';
import { getStoredAccessToken } from '../../../lib/api';

const EMPTY_FORM = {
  title: '',
  summary: '',
  body: '',
  linkUrl: '',
  imageUrl: '',
  publishNow: true,
  sendPush: true
};

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(EMPTY_FORM.title);
  const [summary, setSummary] = useState(EMPTY_FORM.summary);
  const [body, setBody] = useState(EMPTY_FORM.body);
  const [linkUrl, setLinkUrl] = useState(EMPTY_FORM.linkUrl);
  const [imageUrl, setImageUrl] = useState(EMPTY_FORM.imageUrl);
  const [publishNow, setPublishNow] = useState(EMPTY_FORM.publishNow);
  const [sendPush, setSendPush] = useState(EMPTY_FORM.sendPush);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = editingId != null;

  const announcements = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => fetchAdminAnnouncements(getStoredAccessToken()),
    staleTime: 15_000
  });

  const pushStatus = useQuery({
    queryKey: ['announcement-push-status'],
    queryFn: () => fetchAnnouncementPushStatus(getStoredAccessToken()),
    staleTime: 60_000
  });

  const pushConfigured = pushStatus.data?.configured ?? true;

  const previewImage = useMemo(() => resolveAnnouncementAssetUrl(imageUrl), [imageUrl]);

  function resetForm() {
    setEditingId(null);
    setTitle(EMPTY_FORM.title);
    setSummary(EMPTY_FORM.summary);
    setBody(EMPTY_FORM.body);
    setLinkUrl(EMPTY_FORM.linkUrl);
    setImageUrl(EMPTY_FORM.imageUrl);
    setPublishNow(EMPTY_FORM.publishNow);
    setSendPush(EMPTY_FORM.sendPush);
  }

  function startEdit(item: CitizenAnnouncement) {
    setEditingId(item.id);
    setTitle(item.title);
    setSummary(item.summary);
    setBody(item.body ?? '');
    setLinkUrl(item.linkUrl ?? '');
    setImageUrl(item.imageUrl ?? '');
    setPublishNow(item.published);
    setSendPush(false);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAnnouncement(
        {
          title: title.trim(),
          summary: summary.trim(),
          body: body.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          published: publishNow,
          sendPush: publishNow && sendPush
        },
        getStoredAccessToken()
      ),
    onSuccess: (data) => {
      const wantedPush = publishNow && sendPush;
      const pushNote = formatAnnouncementPushMessage(wantedPush, data.push);
      resetForm();
      setSuccess(pushNote ? `Aviso salvo. ${pushNote}` : 'Aviso salvo com sucesso.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o aviso.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAnnouncement(
        editingId!,
        {
          title: title.trim(),
          summary: summary.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim(),
          linkUrl: linkUrl.trim(),
          published: publishNow
        },
        getStoredAccessToken()
      ),
    onSuccess: () => {
      resetForm();
      setSuccess('Aviso atualizado com sucesso.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o aviso.');
    }
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, push }: { id: string; push: boolean }) =>
      publishAnnouncement(id, push, getStoredAccessToken()),
    onSuccess: (data, variables) => {
      const pushNote = formatAnnouncementPushMessage(variables.push, data.push);
      setSuccess(pushNote ? `Aviso publicado. ${pushNote}` : 'Aviso publicado.');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : 'Não foi possível publicar o aviso.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id, getStoredAccessToken()),
    onSuccess: () => {
      setSuccess('Aviso removido.');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: () => setError('Não foi possível remover o aviso.')
  });

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadAnnouncementImage(file, getStoredAccessToken());
      setImageUrl(result.imageUrl);
      setSuccess(isEditing ? 'Nova imagem pronta. Salve o aviso para aplicar.' : 'Imagem enviada.');
    } catch {
      setError('Não foi possível enviar a imagem.');
    } finally {
      event.target.value = '';
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    if (!title.trim() || !summary.trim()) {
      setError('Informe título e resumo.');
      return;
    }
    if (isEditing) {
      updateMutation.mutate();
      return;
    }
    createMutation.mutate();
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="admin-shell admin-announcements">
      <header className="hero">
        <p className="eyebrow">App do cidadão</p>
        <h2>Avisos e comunicados</h2>
        <p>Publique avisos na Home do PWA e envie notificação push para quem ativou os alertas.</p>
      </header>

      {pushStatus.data && !pushStatus.data.configured ? (
        <section className="panel">
          <p className="login-error">
            Push desativado no servidor: defina <strong>VAPID_PUBLIC_KEY</strong> e <strong>VAPID_PRIVATE_KEY</strong>{' '}
            na API e reinicie o serviço. No Portainer/homolog, use as mesmas chaves do <code>.env</code> local.
          </p>
        </section>
      ) : null}

      <section className={`panel admin-announcement-form-panel${isEditing ? ' admin-announcement-form-panel--editing' : ''}`}>
        <div className="admin-announcement-form-panel__head">
          <h3>{isEditing ? 'Editar aviso' : 'Novo aviso'}</h3>
          {isEditing ? <span className="badge badge-purple">Editando</span> : null}
        </div>
        <form className="occurrence-form admin-announcement-form" onSubmit={handleSubmit}>
          <div className="admin-announcement-form__grid">
            <label>
              Título
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Campanha de vacinação" />
            </label>
            <label>
              Link externo (opcional)
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </label>
          </div>
          <label>
            Resumo (aparece no card e no push)
            <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Texto curto do aviso" />
          </label>
          <label>
            Texto completo (opcional)
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Detalhes do comunicado" />
          </label>
          <label className="admin-announcement-upload">
            Imagem do aviso
            <span className="admin-announcement-upload__hint">PNG ou JPG recomendado</span>
            <input type="file" accept="image/*" onChange={(e) => void handleImageUpload(e)} />
          </label>
          {previewImage ? (
            <div className="admin-announcement-preview-wrap">
              <img src={previewImage} alt="Prévia" className="admin-announcement-preview" />
              <button type="button" className="btn-secondary" onClick={() => setImageUrl('')}>
                Remover imagem
              </button>
            </div>
          ) : null}
          <div className="admin-announcement-options">
            <label className="checkbox-inline">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              {isEditing ? 'Publicado no app' : 'Publicar agora no app'}
            </label>
            {!isEditing ? (
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={sendPush}
                  disabled={!publishNow || !pushConfigured}
                  onChange={(e) => setSendPush(e.target.checked)}
                />
                Enviar notificação push
              </label>
            ) : null}
          </div>
          <div className="form-actions">
            {isEditing ? (
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={isSaving}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar aviso'}
            </button>
          </div>
        </form>
        {success ? <p className="success-message">{success}</p> : null}
        {error ? <p className="login-error">{error}</p> : null}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Avisos cadastrados</h3>
          <span>{announcements.data?.length ?? 0} registros</span>
        </div>
        {announcements.isLoading ? <p className="muted-copy">Carregando...</p> : null}
        {!announcements.isLoading && !(announcements.data?.length ?? 0) ? (
          <p className="admin-announcement-empty">Nenhum aviso cadastrado ainda. Use o formulário acima para publicar o primeiro.</p>
        ) : null}
        <div className="rank-list admin-announcement-list">
          {(announcements.data ?? []).map((item) => {
            const image = resolveAnnouncementAssetUrl(item.imageUrl);
            const isActiveEdit = editingId === item.id;
            return (
              <article
                className={`list-item admin-list-item admin-announcement-item${isActiveEdit ? ' admin-announcement-item--active' : ''}`}
                key={item.id}
              >
                <div className="admin-announcement-item__main">
                  {image ? (
                    <div className="admin-announcement-item__thumb">
                      <img src={image} alt="" className="admin-announcement-preview admin-announcement-preview--sm" />
                    </div>
                  ) : (
                    <div className="admin-announcement-item__thumb admin-announcement-item__thumb--empty" aria-hidden>
                      <span>Sem imagem</span>
                    </div>
                  )}
                  <div className="admin-announcement-item__content">
                    <strong>{item.title}</strong>
                    <p className="muted-copy">{item.summary}</p>
                    <div className="admin-announcement-item__meta">
                      <span className={`badge ${item.published ? 'badge-success' : 'badge-neutral'}`}>
                        {item.published ? 'Publicado' : 'Rascunho'}
                      </span>
                      {item.pushSentAt ? (
                        <span className="admin-announcement-item__push">
                          Push · {new Date(item.pushSentAt).toLocaleString('pt-BR')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="admin-list-item__actions admin-announcement-item__actions">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>
                    Editar
                  </button>
                  {!item.published ? (
                    <button
                      type="button"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate({ id: item.id, push: true })}
                    >
                      Publicar + push
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate({ id: item.id, push: true })}
                    >
                      Reenviar push
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-error"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remover "${item.title}"?`)) {
                        if (editingId === item.id) resetForm();
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
