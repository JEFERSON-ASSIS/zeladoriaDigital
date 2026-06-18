'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenProductLogo } from '../../../components/brand-logo';
import { fetchCurrentUser } from '../../../lib/auth-api';
import { getSession } from '../../../lib/auth';
import {
  citizenAccess,
  formatCpf,
  formatPhone,
  getLastCitizenPhone,
  lookupCitizenPhone,
  onlyDigits
} from '../../../lib/citizen-access-api';
import { refreshCitizenSession, resolveCitizenPwaHome } from '../../../lib/citizen-pwa-access';
import { PWA_LOGIN } from '../../../lib/pwa';

const LGPD_TEXT = `A Prefeitura na Mão trata seus dados pessoais (CPF e celular) para identificar você no aplicativo, registrar solicitações urbanas, agendamentos de saúde e comunicações relacionadas aos serviços públicos.

Seus dados são utilizados apenas para finalidades ligadas aos serviços do app, armazenados de forma segura e não compartilhados com terceiros sem base legal.

Você pode solicitar informações ou atualização dos seus dados pelos canais oficiais da prefeitura.`;

type Step = 'phone' | 'cpf';

export default function PwaLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    if (session.user.role === 'CIDADAO') {
      router.replace(resolveCitizenPwaHome(session.user.menuKeys));
      return;
    }
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const lastPhone = getLastCitizenPhone();
    if (lastPhone) setPhone(lastPhone);
  }, []);

  async function completeAccess(accessPhone: string, accessCpf?: string, accessLgpd = false) {
    const result = await citizenAccess(accessPhone, accessCpf, accessLgpd);
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
    const home = resolveCitizenPwaHome(session.user.menuKeys);
    router.push(home !== PWA_LOGIN ? home : '/app');
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
      const { registered } = await lookupCitizenPhone(phone);
      if (registered) {
        await completeAccess(phone);
        return;
      }
      setStep('cpf');
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterSubmit() {
    setError(null);
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
      await completeAccess(phone, cpf, lgpdAccepted);
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell login-shell--pwa">
      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <CitizenProductLogo size="md" />
          </div>

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
              <div className="login-form">
                <label>
                  Celular
                  <input
                    value={phone}
                    onChange={(event) => setPhone(formatPhone(event.target.value))}
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
              <button type="button" className="pwa-access-back" onClick={() => setStep('phone')}>
                ← Voltar
              </button>
              <h1>Primeiro acesso</h1>
              <p className="login-copy">Informe seu CPF e aceite os termos. Nas próximas vezes, só o celular.</p>
              <div className="login-form">
                <label>
                  CPF
                  <input
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    autoFocus
                  />
                </label>
                <div className="pwa-lgpd-box">
                  <p className="pwa-lgpd-box__title">Privacidade e proteção de dados (LGPD)</p>
                  <p className="pwa-lgpd-box__text">{LGPD_TEXT}</p>
                  <label className="pwa-lgpd-box__check">
                    <input
                      type="checkbox"
                      checked={lgpdAccepted}
                      onChange={(event) => setLgpdAccepted(event.target.checked)}
                    />
                    <span>Confirmo estar ciente e autorizo o tratamento dos meus dados conforme descrito acima.</span>
                  </label>
                </div>
                {error ? <p className="login-error">{error}</p> : null}
                <button type="button" className="btn-primary" disabled={loading} onClick={() => void onRegisterSubmit()}>
                  {loading ? 'Entrando...' : 'Concluir cadastro'}
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
