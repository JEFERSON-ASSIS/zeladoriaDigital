'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CitizenProductLogo } from '../../../components/brand-logo';
import { PwaInlineInstallHint } from '../../../components/pwa-inline-install-hint';
import { fetchCurrentUser } from '../../../lib/auth-api';
import { clearSession, getSession } from '../../../lib/auth';
import {
  citizenAccess,
  formatCpf,
  formatPhone,
  lookupCitizenPhone,
  onlyDigits
} from '../../../lib/citizen-access-api';
import { refreshCitizenSession, resolveCitizenDestination } from '../../../lib/citizen-pwa-access';
import { buildPwaLoginUrl } from '../../../lib/pwa';
import { getPsfUnitConfig, getPsfUnitDisplayName, parsePsfIdFromPath } from '../../../lib/psf-unit';

function LoginUnitBadge({ label }: { label: string }) {
  return (
    <p className="pwa-login-unit" role="status">
      <span className="pwa-login-unit__label">Unidade de saúde</span>
      <strong>{label}</strong>
    </p>
  );
}

type Step = 'phone' | 'cpf';

export default function PwaLoginPage() {
  return (
    <Suspense
      fallback={
        <main
          className="login-shell login-shell--pwa"
          style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', margin: 0 }}
        >
          <section className="login-form-panel" style={{ flex: 1, width: '100%', minWidth: 0 }}>
            <div className="login-card" style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
              <p className="eyebrow">Prefeitura na Mão</p>
              <h1>Carregando...</h1>
            </div>
          </section>
        </main>
      }
    >
      <PwaLoginForm />
    </Suspense>
  );
}

function PwaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('return');
  const registrationUnitId = returnPath ? parsePsfIdFromPath(returnPath) : null;
  const registrationUnit = registrationUnitId ? getPsfUnitConfig(registrationUnitId) : null;
  const registrationUnitLabel = registrationUnitId ? getPsfUnitDisplayName(registrationUnitId) : null;
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [registeredNeedsName, setRegisteredNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (registrationUnitId) return;

    const session = getSession();
    if (!session) return;
    if (session.user.role !== 'CIDADAO') {
      router.replace('/');
      return;
    }

    let cancelled = false;

    fetchCurrentUser(session.accessToken)
      .then((user) => {
        if (cancelled) return;
        const destination = resolveCitizenDestination(user, returnPath);
        router.replace(destination);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [router, returnPath, registrationUnitId]);

  useEffect(() => {
    const session = getSession();
    if (session?.user.phone && registrationUnitId) {
      setPhone(formatPhone(session.user.phone));
    }
  }, [registrationUnitId]);

  async function completeAccess(accessPhone: string, accessCpf?: string, accessLgpd = false, accessName?: string) {
    const result = await citizenAccess(
      accessPhone,
      accessCpf,
      accessLgpd,
      registrationUnitId ?? undefined,
      accessName
    );
    let user;
    try {
      user = await fetchCurrentUser(result.access_token);
    } catch {
      user = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email ?? '',
        role: result.user.role
      };
    }

    const session = await refreshCitizenSession(result.access_token, user);
    const destination = resolveCitizenDestination(session.user, returnPath);
    router.push(destination);
    router.refresh();
  }

  async function onPhoneSubmit() {
    setError(null);
    if (onlyDigits(phone).length < 10) {
      setError('Informe um celular válido com DDD.');
      return;
    }

    setLoading(true);
    try {
      const { registered, needsName } = await lookupCitizenPhone(phone);
      if (registered && !needsName) {
        await completeAccess(phone);
        return;
      }
      setRegisteredNeedsName(Boolean(registered && needsName));
      setStep('cpf');
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterSubmit() {
    setError(null);
    const normalizedName = fullName.trim().replace(/\s+/g, ' ');
    if (normalizedName.length < 3) {
      setError('Informe seu nome completo.');
      return;
    }

    if (registeredNeedsName) {
      setLoading(true);
      try {
        await completeAccess(phone, undefined, false, normalizedName);
      } catch (accessError) {
        setError(accessError instanceof Error ? accessError.message : 'Não foi possível entrar.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (onlyDigits(cpf).length !== 11) {
      setError('Informe um CPF válido.');
      return;
    }
    if (!lgpdAccepted) {
      setError('Confirme que está ciente dos termos de privacidade.');
      return;
    }

    setLoading(true);
    try {
      await completeAccess(phone, cpf, lgpdAccepted, normalizedName);
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="login-shell login-shell--pwa"
      style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', margin: 0 }}
    >
      <section className="login-form-panel" style={{ flex: 1, width: '100%', minWidth: 0 }}>
        <div className="login-card" style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
          <div className="login-mobile-brand">
            <CitizenProductLogo size="md" />
          </div>

          <PwaInlineInstallHint />

          {step === 'cpf' ? (
            <div className="pwa-access-steps" aria-hidden>
              <span className="is-done" />
              <span className="is-active" />
            </div>
          ) : null}

          {step === 'phone' ? (
            <>
              <h1>Seu celular</h1>
              <p className="login-copy">Informe o número com DDD para acessar o aplicativo.</p>
              {registrationUnitLabel ? <LoginUnitBadge label={registrationUnitLabel} /> : null}
              <div className="login-form">
                <label>
                  Celular
                  <input
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatPhone(event.target.value));
                      setRegisteredNeedsName(false);
                    }}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(66) 99999-9999"
                    autoFocus
                  />
                </label>
                {error ? <p className="login-error">{error}</p> : null}
                <button type="button" className="btn-primary" disabled={loading} onClick={() => void onPhoneSubmit()}>
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="pwa-access-back"
                onClick={() => {
                  setRegisteredNeedsName(false);
                  setStep('phone');
                }}
              >
                ← Voltar
              </button>
              <h1>{registeredNeedsName ? 'Complete seu cadastro' : 'Primeiro acesso'}</h1>
              <p className="login-copy">
                {registeredNeedsName
                  ? 'Informe seu nome completo para atualizar seu cadastro.'
                  : 'Informe seu nome completo, CPF e aceite os termos. Nas próximas vezes, só o celular.'}
              </p>
              <div className="login-form">
                <label>
                  Nome completo
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    autoFocus
                  />
                </label>
                {!registeredNeedsName ? (
                  <label>
                    CPF
                    <input
                      value={cpf}
                      onChange={(event) => setCpf(formatCpf(event.target.value))}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                    />
                  </label>
                ) : null}
                {registrationUnit && !registeredNeedsName ? (
                  <p className="pwa-login-unit pwa-login-unit--field">
                    <span className="pwa-login-unit__label">Cadastro vinculado a</span>
                    <strong>
                      {registrationUnit.label} {registrationUnit.subtitle}
                    </strong>
                  </p>
                ) : null}
                {!registeredNeedsName ? (
                  <div className="pwa-lgpd-box">
                    <p className="pwa-lgpd-box__title">Privacidade e proteção de dados (LGPD)</p>
                    <p className="pwa-lgpd-box__text">
                      Ao continuar, você confirma que leu e concorda com a{' '}
                      <Link href="/app/politica-privacidade" target="_blank">
                        Política de Privacidade
                      </Link>{' '}
                      e autoriza o tratamento dos seus dados para identificação, acesso ao aplicativo, agendamentos,
                      solicitações e comunicações relacionadas aos serviços públicos.
                    </p>
                    <label className="pwa-lgpd-box__check">
                      <input
                        type="checkbox"
                        checked={lgpdAccepted}
                        onChange={(event) => setLgpdAccepted(event.target.checked)}
                      />
                      <span>Confirmo estar ciente e autorizo o tratamento dos meus dados conforme descrito acima.</span>
                    </label>
                  </div>
                ) : null}
                {error ? <p className="login-error">{error}</p> : null}
                <button type="button" className="btn-primary" disabled={loading} onClick={() => void onRegisterSubmit()}>
                  {loading ? 'Entrando...' : registeredNeedsName ? 'Atualizar e entrar' : 'Concluir cadastro'}
                </button>
              </div>
            </>
          )}

          <p className="login-credit">
            Desenvolvido por <strong>i7AI Sistemas inteligentes</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
