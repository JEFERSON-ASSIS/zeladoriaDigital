'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenMediaPicker, type PendingMedia } from '../../components/citizen-media-picker';
import { CitizenAppShell } from '../../components/citizen-app-shell';
import { CitizenStepper } from '../../components/citizen-stepper';
import { CitizenSuccessCard } from '../../components/citizen-success-card';
import { clearSession, getSession, type AuthSession } from '../../lib/auth';
import { fetchCurrentUser } from '../../lib/auth-api';
import {
  createOccurrence,
  fetchCategories,
  fetchDepartments,
  fetchNeighborhoods,
  uploadOccurrenceAttachment
} from '../../lib/api';
import { PWA_LOGIN, pwaPath } from '../../lib/pwa';

type Neighborhood = { id: string; name: string };
type FormStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS = ['Problema', 'Local', 'Fotos', 'Revisar'];

const EMPTY_FORM = {
  title: '',
  description: '',
  street: '',
  categoryId: '',
  neighborhoodId: '',
  suggestedDepartmentId: ''
};

function hasGpsCoords(coords: { latitude?: number; longitude?: number }) {
  return coords.latitude != null && coords.longitude != null;
}

function buildOccurrenceAddress(
  street: string,
  neighborhoodId: string,
  neighborhoods: Neighborhood[],
  coords: { latitude?: number; longitude?: number }
) {
  if (hasGpsCoords(coords) && !street.trim()) {
    return 'Localização enviada pelo celular';
  }

  const parts: string[] = [];
  if (street.trim()) parts.push(street.trim());

  const neighborhoodName = neighborhoods.find((item) => item.id === neighborhoodId)?.name;
  if (neighborhoodName) parts.push(neighborhoodName);

  return parts.join(', ');
}

export default function NewOccurrencePage() {
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);
  const [successDepartment, setSuccessDepartment] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaItems, setMediaItems] = useState<PendingMedia[]>([]);

  const usingGps = hasGpsCoords(coords);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace(PWA_LOGIN);
      return;
    }

    fetchCurrentUser(currentSession.accessToken)
      .then((user) => setSession({ ...currentSession, user }))
      .catch(() => {
        clearSession();
        router.replace(PWA_LOGIN);
      })
      .finally(() => {
        Promise.all([
          fetchCategories(currentSession.accessToken),
          fetchNeighborhoods(currentSession.accessToken),
          fetchDepartments(currentSession.accessToken)
        ])
          .then(([loadedCategories, loadedNeighborhoods, loadedDepartments]) => {
            setCategories(loadedCategories);
            setNeighborhoods(loadedNeighborhoods);
            setDepartments(loadedDepartments);
          })
          .finally(() => setLoading(false));
      });
  }, [router]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [error]);

  function showError(message: string) {
    setError(message);
  }

  function validateStep(step: FormStep) {
    if (step === 1) {
      if (!form.suggestedDepartmentId) {
        showError('Selecione a secretaria que deve receber sua solicitação.');
        return false;
      }
      if (!form.description.trim()) {
        showError('Descreva o problema para continuar.');
        return false;
      }
    }

    if (step === 2) {
      if (!usingGps) {
        if (!form.neighborhoodId) {
          showError('Selecione o bairro ou use sua localização.');
          return false;
        }
        if (!form.street.trim()) {
          showError('Informe a rua ou use sua localização.');
          return false;
        }
      }
    }

    setError(null);
    return true;
  }

  function goNext() {
    if (!validateStep(formStep)) return;
    if (formStep >= 4) return;
    setFormStep((formStep + 1) as FormStep);
  }

  function goBack() {
    if (formStep === 1) return;
    setError(null);
    setFormStep((formStep - 1) as FormStep);
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) {
      setFormStep(!form.suggestedDepartmentId || !form.description.trim() ? 1 : 2);
      return;
    }

    const address = buildOccurrenceAddress(form.street, form.neighborhoodId, neighborhoods, coords);
    if (!address && !usingGps) {
      showError('Informe bairro e rua, ou compartilhe sua localização.');
      setFormStep(2);
      return;
    }

    const accessToken = session?.accessToken ?? getSession()?.accessToken;
    if (!accessToken) {
      showError('Sessão expirada. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createOccurrence(
        {
          title: form.title.trim() || undefined,
          description: form.description.trim(),
          address: address || undefined,
          latitude: coords.latitude,
          longitude: coords.longitude,
          citizenId: session?.user.role === 'CIDADAO' ? session.user.id : undefined,
          categoryId: form.categoryId || undefined,
          neighborhoodId: usingGps ? undefined : form.neighborhoodId || undefined,
          suggestedDepartmentId: form.suggestedDepartmentId
        },
        accessToken
      );

      for (const media of mediaItems) {
        await uploadOccurrenceAttachment(result.id, media.file, accessToken);
      }

      const departmentName =
        departments.find((item) => item.id === form.suggestedDepartmentId)?.name ?? 'secretaria selecionada';

      setSuccessProtocol(result.protocol);
      setSuccessDepartment(departmentName);
      setForm(EMPTY_FORM);
      setCoords({});
      mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setMediaItems([]);
    } catch (submitError) {
      showError(submitError instanceof Error ? submitError.message : 'Não foi possível registrar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      showError('Seu navegador não suporta geolocalização.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocating(false);
      },
      () => {
        showError('Não foi possível capturar a localização. Informe bairro e rua.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function clearLocation() {
    setCoords({});
    setError(null);
  }

  function resetWizard() {
    setFormStep(1);
    setSuccessProtocol(null);
    setSuccessDepartment(null);
    setError(null);
  }

  const departmentName = departments.find((item) => item.id === form.suggestedDepartmentId)?.name;
  const categoryName = categories.find((item) => item.id === form.categoryId)?.name;
  const neighborhoodName = neighborhoods.find((item) => item.id === form.neighborhoodId)?.name;

  if (successProtocol) {
    return (
      <CitizenAppShell title="Solicitação enviada" subtitle="Seu pedido foi registrado com sucesso.">
        <CitizenSuccessCard
          title="Tudo certo!"
          message={`Sua solicitação foi enviada para ${successDepartment ?? 'a secretaria responsável'}. Guarde o protocolo para acompanhar.`}
          protocol={successProtocol}
          primaryLabel="Ver meus chamados"
          onPrimary={() => router.push(pwaPath('/minhas-solicitacoes'))}
          secondaryLabel="Nova solicitação"
          onSecondary={resetWizard}
        />
      </CitizenAppShell>
    );
  }

  return (
    <CitizenAppShell
      title="Nova solicitação"
      subtitle="Siga os passos para registrar o problema na sua cidade."
      loading={loading}
      loadingVariant="form"
    >
      {!loading ? (
        <>
          <CitizenStepper steps={WIZARD_STEPS} currentStep={formStep} />

          {formStep === 1 ? (
            <section className="citizen-wizard-panel">
              <h3 className="form-section-title">O que aconteceu?</h3>
              <div className="form-group-card">
                <label>
                  Secretaria responsável *
                  <select
                    value={form.suggestedDepartmentId}
                    onChange={(e) => setForm((current) => ({ ...current, suggestedDepartmentId: e.target.value }))}
                  >
                    <option value="">Selecione para onde enviar</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Título
                  <input
                    value={form.title}
                    onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                    placeholder="Ex.: Buraco na rua, falta de iluminação..."
                  />
                </label>

                <label>
                  Descrição *
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    rows={5}
                    placeholder="Explique o que está acontecendo com o máximo de detalhes possível."
                  />
                </label>

                <label>
                  Categoria
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
                  >
                    <option value="">Selecione (opcional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {formStep === 2 ? (
            <section className="citizen-wizard-panel">
              <h3 className="form-section-title">Onde está o problema?</h3>
              <section className="citizen-location-block">
                <button
                  type="button"
                  className="citizen-location-block__gps-btn"
                  onClick={captureLocation}
                  disabled={locating}
                >
                  {locating
                    ? 'Capturando localização...'
                    : usingGps
                      ? 'Atualizar minha localização'
                      : 'Usar minha localização'}
                </button>

                {usingGps ? (
                  <div className="citizen-location-block__status citizen-location-block__status--ok">
                    <p>Localização capturada. Bairro e rua não são necessários.</p>
                    <p className="citizen-location-block__coords citizen-copyable">
                      {coords.latitude?.toFixed(5)}, {coords.longitude?.toFixed(5)}
                    </p>
                    <button type="button" className="citizen-location-block__link" onClick={clearLocation}>
                      Informar endereço manualmente
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="citizen-location-block__hint">
                      Sem GPS, informe bairro e rua para localizar a solicitação.
                    </p>
                    <div className="form-group-card" style={{ margin: '12px 0 0' }}>
                      <label>
                        Bairro *
                        <select
                          value={form.neighborhoodId}
                          onChange={(e) => setForm((current) => ({ ...current, neighborhoodId: e.target.value }))}
                        >
                          <option value="">Selecione o bairro</option>
                          {neighborhoods.map((neighborhood) => (
                            <option key={neighborhood.id} value={neighborhood.id}>
                              {neighborhood.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Rua *
                        <input
                          value={form.street}
                          onChange={(e) => setForm((current) => ({ ...current, street: e.target.value }))}
                          placeholder="Nome da rua, número ou ponto de referência"
                        />
                      </label>
                    </div>
                  </>
                )}
              </section>
            </section>
          ) : null}

          {formStep === 3 ? (
            <section className="citizen-wizard-panel">
              <h3 className="form-section-title">Fotos e áudios</h3>
              <p className="scheduling-copy">Opcional — ajuda a secretaria a entender melhor o problema.</p>
              <CitizenMediaPicker items={mediaItems} onChange={setMediaItems} disabled={submitting} />
            </section>
          ) : null}

          {formStep === 4 ? (
            <section className="citizen-wizard-panel">
              <h3 className="form-section-title">Revisar e enviar</h3>
              <dl className="citizen-review-list">
                <div>
                  <dt>Secretaria</dt>
                  <dd>{departmentName ?? '—'}</dd>
                </div>
                <div>
                  <dt>Descrição</dt>
                  <dd>{form.description.trim() || '—'}</dd>
                </div>
                {form.title.trim() ? (
                  <div>
                    <dt>Título</dt>
                    <dd>{form.title.trim()}</dd>
                  </div>
                ) : null}
                {categoryName ? (
                  <div>
                    <dt>Categoria</dt>
                    <dd>{categoryName}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Local</dt>
                  <dd>
                    {usingGps
                      ? `GPS: ${coords.latitude?.toFixed(5)}, ${coords.longitude?.toFixed(5)}`
                      : [form.street.trim(), neighborhoodName].filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Anexos</dt>
                  <dd>{mediaItems.length ? `${mediaItems.length} arquivo(s)` : 'Nenhum'}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {error ? (
            <p ref={errorRef} className="login-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="citizen-wizard-actions">
            {formStep > 1 ? (
              <button type="button" className="btn-secondary" onClick={goBack} disabled={submitting}>
                Voltar
              </button>
            ) : (
              <span />
            )}
            {formStep < 4 ? (
              <button type="button" className="btn-primary" onClick={goNext}>
                Continuar
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            )}
          </div>
        </>
      ) : null}
    </CitizenAppShell>
  );
}
