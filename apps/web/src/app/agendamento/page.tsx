'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { CitizenAppShell } from '../../components/citizen-app-shell';
import { useResolvedPsfUnit } from '../../hooks/use-resolved-psf-unit';
import { buildPwaLoginUrl, pwaPath } from '../../lib/pwa';
import { parsePsfIdFromPath } from '../../lib/psf-unit';
import { getAvailableServices, getMedicoBookingFlow, type PsfConfig, type ServiceKind } from '../../lib/scheduling/psf-config';
import {
  formatCpf,
  formatPhone,
  getPatientProfile,
  getSavedPsfConfig,
  onlyDigits,
  type PatientProfile
} from '../../lib/scheduling/psf-storage';
import {
  createBooking,
  fetchAvailableDays,
  fetchAvailableTimes,
  fetchAvailableTurnos,
  SchedulingApiError,
  type AvailableDay,
  type AvailableTurno,
  type MedicoTurno
} from '../../lib/scheduling/scheduling-api';
import { recordBookingHistory } from '../../lib/scheduling/scheduling-history';

type Step = 'psf' | 'booking' | 'success';

export default function SchedulingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const unit = useResolvedPsfUnit();
  const hasKnownUnit = Boolean(unit || parsePsfIdFromPath(pathname) || getSavedPsfConfig());
  const [step, setStep] = useState<Step>(() => (hasKnownUnit ? 'booking' : 'psf'));
  const [psf, setPsf] = useState<PsfConfig | null>(null);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [turnos, setTurnos] = useState<AvailableTurno[]>([]);
  const [selectedDay, setSelectedDay] = useState<AvailableDay | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTurno, setSelectedTurno] = useState<MedicoTurno | ''>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<PatientProfile & { serviceKind: ServiceKind | '' }>({
    nome: '',
    telefone: '',
    cpf: '',
    serviceKind: ''
  });

  const services = useMemo(() => (psf ? getAvailableServices(psf) : []), [psf]);
  const selectedService = services.find((item) => item.kind === form.serviceKind);
  const medicoFlow = form.serviceKind === 'medico' && psf ? getMedicoBookingFlow(psf) : null;
  const needsTime =
    form.serviceKind === 'dentista' || medicoFlow === 'hora' || medicoFlow === 'hora_servico';
  const needsTurno = medicoFlow === 'turno';
  const selectedTurnoLabel = turnos.find((item) => item.id === selectedTurno)?.label ?? '';

  useEffect(() => {
    const loginUrl = buildPwaLoginUrl(unit?.path('/agendamento'));
    if (!getSession()) {
      router.replace(loginUrl);
      return;
    }

    if (unit) {
      setPsf(unit.psf);
      setStep('booking');
    } else {
      const savedPsf = getSavedPsfConfig();
      if (savedPsf) {
        setPsf(savedPsf);
        setStep('booking');
      } else {
        setStep('psf');
      }
    }

    const profile = getPatientProfile();
    if (profile) {
      setForm((current) => ({
        ...current,
        nome: profile.nome,
        telefone: profile.telefone,
        cpf: profile.cpf,
        serviceKind: current.serviceKind
      }));
    }
  }, [router, unit]);

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
    setTurnos([]);
    setSelectedDay(null);
    setSelectedTime('');
    setSelectedTurno('');

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
    setSelectedTurno('');
    setTimes([]);
    setTurnos([]);

    if (!needsTime && !needsTurno) return;

    setLoadingTimes(true);
    setError(null);

    try {
      if (needsTurno) {
        const { turnos: availableTurnos, suggested } = await fetchAvailableTurnos(
          psf,
          selectedService.servicoId,
          day.date
        );
        if (!availableTurnos.length) {
          setError('Não há turnos disponíveis nesta data.');
          return;
        }
        setTurnos(availableTurnos);
        if (availableTurnos.length === 1) {
          setSelectedTurno(availableTurnos[0].id);
        } else if (suggested && availableTurnos.some((item) => item.id === suggested)) {
          setSelectedTurno(suggested);
        }
        return;
      }

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

    if (needsTurno && !selectedTurno) {
      setError('Selecione o turno (manhã ou tarde).');
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
        hora: needsTime ? selectedTime : undefined,
        turno: needsTurno ? selectedTurno : undefined
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

      const scheduleDetail = selectedTime
        ? ` às ${selectedTime}`
        : selectedTurnoLabel
          ? ` (${selectedTurnoLabel.toLowerCase()})`
          : '';

      setSuccessMessage(
        result.id
          ? `Agendamento confirmado! Protocolo interno #${result.id} em ${selectedDay.date}${scheduleDetail}.`
          : `Agendamento confirmado para ${selectedDay.date}${scheduleDetail}.`
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
      <CitizenAppShell title="Agendamento" subtitle="Use o link da sua unidade de saúde para agendar.">
        <section className="panel scheduling-panel">
          <p className="scheduling-copy">
            Seu cadastro ainda não está vinculado a uma unidade ou você entrou pelo app geral.
            Acesse o link oficial do PSF (PSF 1, PSF 2 ou UBS Rural) para se cadastrar e agendar.
          </p>
        </section>
      </CitizenAppShell>
    );
  }

  if (step === 'success') {
    const appointmentsPath = unit ? unit.path('/meus-agendamentos') : pwaPath('/meus-agendamentos');
    return (
      <CitizenAppShell title="Agendamento confirmado" subtitle={successMessage ?? 'Sua consulta foi registrada.'}>
        <section className="panel scheduling-panel">
          <p className="success-message">{successMessage}</p>
          <div className="form-actions">
            <button type="button" onClick={() => router.push(appointmentsPath)}>
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
      </CitizenAppShell>
    );
  }

  return (
    <CitizenAppShell
      title="Agendar consulta"
      subtitle={psf ? `${psf.label} — ${psf.subtitle}` : 'Carregando unidade...'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'block' }}>
        <h3 className="form-section-title">Seus Dados</h3>
        <div className="form-group-card">
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
                setTurnos([]);
                setSelectedDay(null);
                setSelectedTime('');
                setSelectedTurno('');
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
        </div>

        <div style={{ margin: '8px 0 16px' }}>
          <button
            type="button"
            className="scheduling-load-btn"
            onClick={() => void loadDays()}
            disabled={loadingDays || !form.serviceKind}
          >
            {loadingDays ? 'Buscando datas...' : 'Buscar datas disponíveis'}
          </button>
        </div>

        {days.length > 0 ? (
          <section className="panel scheduling-panel scheduling-panel--flat" style={{ margin: '16px 0' }}>
            <div style={{ padding: '14px 16px 8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--i7-text-secondary)' }}>Escolha o dia</h3>
            </div>
            <div className="scheduling-slot-grid" style={{ padding: '0 16px 16px' }}>
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

        {needsTurno && selectedDay ? (
          <section className="panel scheduling-panel scheduling-panel--flat" style={{ margin: '16px 0' }}>
            <div style={{ padding: '14px 16px 8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--i7-text-secondary)' }}>Escolha o turno — {selectedDay.date}</h3>
            </div>
            {loadingTimes ? <p className="scheduling-copy" style={{ padding: '0 16px 12px' }}>Carregando turnos...</p> : null}
            {!loadingTimes && turnos.length === 0 ? (
              <p className="scheduling-copy" style={{ padding: '0 16px 12px' }}>Nenhum turno disponível nesta data.</p>
            ) : null}
            <div className="scheduling-slot-grid scheduling-slot-grid--times" style={{ padding: '0 16px 16px' }}>
              {turnos.map((turno) => (
                <button
                  key={turno.id}
                  type="button"
                  className={`scheduling-slot ${selectedTurno === turno.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedTurno(turno.id)}
                >
                  <span>{turno.label}</span>
                  <small>{turno.vagas} vaga(s)</small>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {needsTime && selectedDay ? (
          <section className="panel scheduling-panel scheduling-panel--flat" style={{ margin: '16px 0' }}>
            <div style={{ padding: '14px 16px 8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--i7-text-secondary)' }}>Escolha o horário — {selectedDay.date}</h3>
            </div>
            {loadingTimes ? <p className="scheduling-copy" style={{ padding: '0 16px 12px' }}>Carregando horários...</p> : null}
            {!loadingTimes && times.length === 0 ? (
              <p className="scheduling-copy" style={{ padding: '0 16px 12px' }}>Nenhum horário disponível nesta data.</p>
            ) : null}
            <div className="scheduling-slot-grid scheduling-slot-grid--times" style={{ padding: '0 16px 16px' }}>
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

        {selectedDay && ((!needsTime && !needsTurno) || selectedTime || selectedTurno) ? (
          <section className="panel scheduling-panel scheduling-panel--flat scheduling-summary" style={{ padding: 16, margin: '16px 0' }}>
            <p className="eyebrow" style={{ margin: '0 0 6px', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--i7-text-secondary)', fontWeight: 600 }}>Resumo do agendamento</p>
            <p style={{ margin: '4px 0', fontSize: '1.05rem', color: 'var(--i7-text)' }}>
              <strong>{selectedService?.label}</strong> em {selectedDay.date}
              {selectedTime ? ` às ${selectedTime}` : ''}
              {!selectedTime && selectedTurnoLabel ? ` — ${selectedTurnoLabel}` : ''}
            </p>
            <p style={{ margin: '4px 0', color: 'var(--i7-text-secondary)' }}>{form.nome}</p>
            <p style={{ margin: '4px 0', color: 'var(--i7-text-secondary)', fontSize: '0.9rem' }}>{form.telefone} · CPF {form.cpf}</p>
          </section>
        ) : null}

        {error ? <p className="login-error" style={{ margin: '12px 0' }}>{error}</p> : null}

        <div className="form-actions" style={{ padding: '16px 0' }}>
          <button
            type="submit"
            disabled={submitting || !selectedDay || (needsTime && !selectedTime) || (needsTurno && !selectedTurno)}
          >
            {submitting ? 'Agendando...' : 'Confirmar agendamento'}
          </button>
        </div>
      </form>
    </CitizenAppShell>
  );
}
