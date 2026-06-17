'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { CitizenShell } from '../../components/citizen-shell';
import { PsfSelectionFlow } from '../../components/psf-selection-flow';
import { getAvailableServices, type PsfConfig, type ServiceKind } from '../../lib/scheduling/psf-config';
import {
  formatCpf,
  formatPhone,
  getPatientProfile,
  getSavedPsfConfig,
  getSavedPsfId,
  onlyDigits,
  savePatientProfile,
  savePsfChoice,
  type PatientProfile
} from '../../lib/scheduling/psf-storage';
import {
  createBooking,
  fetchAvailableDays,
  fetchAvailableTimes,
  SchedulingApiError,
  type AvailableDay
} from '../../lib/scheduling/scheduling-api';
import type { PsfId } from '../../lib/scheduling/psf-config';
import { recordBookingHistory } from '../../lib/scheduling/scheduling-history';

type Step = 'psf' | 'booking' | 'success';

export default function SchedulingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('psf');
  const [psf, setPsf] = useState<PsfConfig | null>(null);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<AvailableDay | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<PatientProfile & { serviceKind: ServiceKind | '' }>({
    nome: '',
    telefone: '',
    cpf: '',
    serviceKind: ''
  });

  const services = useMemo(() => (psf ? getAvailableServices(psf) : []), [psf]);
  const selectedService = services.find((item) => item.kind === form.serviceKind);
  const needsTime = form.serviceKind === 'medico' || form.serviceKind === 'dentista';

  useEffect(() => {
    if (!getSession()) {
      router.replace('/login');
      return;
    }

    const savedId = getSavedPsfId();
    const savedPsf = getSavedPsfConfig();
    const profile = getPatientProfile();

    if (savedPsf) {
      setPsf(savedPsf);
      setStep('booking');
    }

    if (profile) {
      setForm((current) => ({
        ...current,
        nome: profile.nome,
        telefone: profile.telefone,
        cpf: profile.cpf,
        serviceKind: current.serviceKind
      }));
    }

    if (!savedId) {
      setStep('psf');
    }
  }, [router]);

  function handlePsfConfirmed(psfId: PsfId) {
    savePsfChoice(psfId);
    const config = getSavedPsfConfig();
    if (!config) return;
    setPsf(config);
    setStep('booking');
    setError(null);
  }

  async function loadDays() {
    if (!psf || !selectedService) return;

    if (!form.nome.trim() || onlyDigits(form.cpf).length !== 11 || onlyDigits(form.telefone).length < 10) {
      setError('Preencha nome, CPF e telefone antes de buscar horários.');
      return;
    }

    setLoadingDays(true);
    setError(null);
    setDays([]);
    setTimes([]);
    setSelectedDay(null);
    setSelectedTime('');

    try {
      const availableDays = await fetchAvailableDays(psf, selectedService.kind, selectedService.servicoId);
      if (!availableDays.length) {
        setError('Não há datas disponíveis para este serviço no momento.');
        return;
      }
      setDays(availableDays);
    } catch (loadError) {
      setError(loadError instanceof SchedulingApiError ? loadError.message : 'Não foi possível carregar as datas.');
    } finally {
      setLoadingDays(false);
    }
  }

  async function handleSelectDay(day: AvailableDay) {
    if (!psf || !selectedService) return;

    setSelectedDay(day);
    setSelectedTime('');
    setTimes([]);

    if (!needsTime) return;

    setLoadingTimes(true);
    setError(null);

    try {
      const availableTimes = await fetchAvailableTimes(
        psf,
        selectedService.kind,
        selectedService.servicoId,
        day.date
      );
      if (!availableTimes.length) {
        setError('Não há horários disponíveis nesta data.');
        return;
      }
      setTimes(availableTimes);
    } catch (loadError) {
      setError(loadError instanceof SchedulingApiError ? loadError.message : 'Não foi possível carregar os horários.');
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!psf || !selectedService || !selectedDay) return;

    if (needsTime && !selectedTime) {
      setError('Selecione um horário.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile: PatientProfile = {
        nome: form.nome.trim(),
        telefone: onlyDigits(form.telefone),
        cpf: onlyDigits(form.cpf)
      };

      const result = await createBooking(psf, {
        ...profile,
        servicoId: selectedService.servicoId,
        serviceKind: selectedService.kind,
        data: selectedDay.date,
        hora: needsTime ? selectedTime : undefined
      });

      savePatientProfile({
        ...profile,
        telefone: form.telefone,
        cpf: form.cpf
      });

      if (result.id && psf) {
        recordBookingHistory({
          appointmentId: result.id,
          psfId: psf.id,
          psfLabel: psf.label,
          nome: profile.nome,
          cpf: profile.cpf,
          telefone: form.telefone,
          servico: selectedService.label,
          data: selectedDay.date,
          hora: needsTime ? selectedTime : undefined
        });
      }

      setSuccessMessage(
        result.id
          ? `Agendamento confirmado! Protocolo interno #${result.id} em ${selectedDay.date}${selectedTime ? ` às ${selectedTime}` : ''}.`
          : `Agendamento confirmado para ${selectedDay.date}${selectedTime ? ` às ${selectedTime}` : ''}.`
      );
      setStep('success');
    } catch (submitError) {
      setError(submitError instanceof SchedulingApiError ? submitError.message : 'Não foi possível agendar.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'psf') {
    return (
      <CitizenShell title="Agendamento" subtitle="Escolha sua unidade de saúde para continuar.">
        <PsfSelectionFlow onConfirmed={handlePsfConfirmed} />
      </CitizenShell>
    );
  }

  if (step === 'success') {
    return (
      <CitizenShell title="Agendamento confirmado" subtitle={successMessage ?? 'Sua consulta foi registrada.'}>
        <section className="panel scheduling-panel">
          <p className="success-message">{successMessage}</p>
          <div className="form-actions">
            <button type="button" onClick={() => router.push('/meus-agendamentos')}>
              Ver meus agendamentos
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStep('booking');
                setSuccessMessage(null);
                setDays([]);
                setTimes([]);
                setSelectedDay(null);
                setSelectedTime('');
              }}
            >
              Novo agendamento
            </button>
          </div>
        </section>
      </CitizenShell>
    );
  }

  return (
    <CitizenShell
      title="Agendar consulta"
      subtitle={psf ? `${psf.label} — ${psf.subtitle}` : 'Carregando unidade...'}
    >
      <form className="occurrence-form scheduling-form" onSubmit={handleSubmit}>
        <section className="panel scheduling-panel scheduling-panel--flat">
          <p className="eyebrow">Seus dados</p>
          <label>
            Nome completo *
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
              placeholder="Nome do paciente"
            />
          </label>
          <label>
            Telefone *
            <input
              required
              inputMode="tel"
              value={form.telefone}
              onChange={(e) => setForm((current) => ({ ...current, telefone: formatPhone(e.target.value) }))}
              placeholder="(66) 99999-9999"
            />
          </label>
          <label>
            CPF *
            <input
              required
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => setForm((current) => ({ ...current, cpf: formatCpf(e.target.value) }))}
              placeholder="000.000.000-00"
            />
          </label>
          <label>
            Serviço *
            <select
              required
              value={form.serviceKind}
              onChange={(e) => {
                setForm((current) => ({ ...current, serviceKind: e.target.value as ServiceKind | '' }));
                setDays([]);
                setTimes([]);
                setSelectedDay(null);
                setSelectedTime('');
              }}
            >
              <option value="">Selecione o serviço</option>
              {services.map((service) => (
                <option key={service.kind} value={service.kind}>
                  {service.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="scheduling-load-btn"
            onClick={() => void loadDays()}
            disabled={loadingDays || !form.serviceKind}
          >
            {loadingDays ? 'Buscando datas...' : 'Buscar datas disponíveis'}
          </button>
        </section>

        {days.length > 0 ? (
          <section className="panel scheduling-panel scheduling-panel--flat">
            <p className="eyebrow">Data</p>
            <h3>Escolha o dia</h3>
            <div className="scheduling-slot-grid">
              {days.map((day) => (
                <button
                  key={day.label}
                  type="button"
                  className={`scheduling-slot ${selectedDay?.label === day.label ? 'is-selected' : ''}`}
                  onClick={() => void handleSelectDay(day)}
                >
                  <span>{day.date}</span>
                  <small>{day.label.replace(day.date, '').trim() || `${day.vagas ?? 0} vaga(s)`}</small>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {needsTime && selectedDay ? (
          <section className="panel scheduling-panel scheduling-panel--flat">
            <p className="eyebrow">Horário</p>
            <h3>Escolha o horário — {selectedDay.date}</h3>
            {loadingTimes ? <p className="scheduling-copy">Carregando horários...</p> : null}
            {!loadingTimes && times.length === 0 ? (
              <p className="scheduling-copy">Nenhum horário disponível nesta data.</p>
            ) : null}
            <div className="scheduling-slot-grid scheduling-slot-grid--times">
              {times.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`scheduling-slot ${selectedTime === time ? 'is-selected' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {selectedDay && (!needsTime || selectedTime) ? (
          <section className="panel scheduling-panel scheduling-panel--flat scheduling-summary">
            <p className="eyebrow">Resumo</p>
            <p>
              <strong>{selectedService?.label}</strong> em {selectedDay.date}
              {selectedTime ? ` às ${selectedTime}` : ''}
            </p>
            <p>{form.nome}</p>
            <p>{form.telefone} · CPF {form.cpf}</p>
          </section>
        ) : null}

        {error ? <p className="login-error">{error}</p> : null}

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting || !selectedDay || (needsTime && !selectedTime)}
          >
            {submitting ? 'Agendando...' : 'Confirmar agendamento'}
          </button>
        </div>
      </form>
    </CitizenShell>
  );
}
