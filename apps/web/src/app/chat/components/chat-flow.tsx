'use client';

import { useEffect, useRef, useState } from 'react';
import { getAvailableServices, type PsfConfig, type PsfId } from '@/lib/scheduling/psf-config';
import type { AvailableDay, AvailableTurno } from '@/lib/scheduling/scheduling-api';
import ChatInput from './chat-input';
import ChatMessage from './chat-message';
import {
  serviceNeedsTime,
  serviceNeedsTurno,
  useAgendamentoFlow,
  type ChatServiceOption
} from '../hooks/use-agendamento-flow';
import { formatCPF, formatPhone, validateCPF, validatePhone } from '../lib/validation';

type Step = 'nome' | 'telefone' | 'cpf' | 'servico' | 'data' | 'hora' | 'turno' | 'confirmacao' | 'sucesso';

type Message = {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: number;
};

type ChatFormData = {
  nome: string;
  telefone: string;
  cpf: string;
  service: ChatServiceOption | null;
  day: AvailableDay | null;
  hora: string;
  turno: AvailableTurno | null;
};

const initialFormData: ChatFormData = {
  nome: '',
  telefone: '',
  cpf: '',
  service: null,
  day: null,
  hora: '',
  turno: null
};

function normalizeOption(input: string) {
  return Number.parseInt(input.trim(), 10) - 1;
}

function isYes(input: string) {
  const normalized = input.trim().toLowerCase();
  return normalized === 'sim' || normalized === 's';
}

function isNo(input: string) {
  const normalized = input.trim().toLowerCase();
  return normalized === 'não' || normalized === 'nao' || normalized === 'n';
}

export default function ChatFlow({ psfId, psf }: { psfId: PsfId; psf: PsfConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>('nome');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChatFormData>(initialFormData);
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [turnos, setTurnos] = useState<AvailableTurno[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { diasDisponiveis, horariosDisponiveis, turnosDisponiveis, criarAgendamento } = useAgendamentoFlow(psfId);
  const availableServices = getAvailableServices(psf);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: `Olá! Bem-vindo ao agendamento de ${psf.label}. Qual é o seu nome completo?`,
        timestamp: Date.now()
      }
    ]);
    setStep('nome');
    setFormData(initialFormData);
    setDays([]);
    setTimes([]);
    setTurnos([]);
  }, [psf]);

  const addMessage = (content: string, type: 'bot' | 'user' = 'bot') => {
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        type,
        content,
        timestamp: Date.now()
      }
    ]);
  };

  const showDays = (availableDays: AvailableDay[]) => {
    const diasFormatados = availableDays
      .slice(0, 6)
      .map((day, index) => `${index + 1}. ${day.label}${day.vagas ? ` (${day.vagas} vagas)` : ''}`)
      .join('\n');
    addMessage(`Datas disponíveis:\n${diasFormatados}\n\nResponda com o número da data desejada.`);
  };

  const showTimes = (availableTimes: string[], day: AvailableDay) => {
    const horariosFormatados = availableTimes
      .slice(0, 8)
      .map((time, index) => `${index + 1}. ${time}`)
      .join('\n');
    addMessage(`Horários disponíveis em ${day.date}:\n${horariosFormatados}\n\nResponda com o número do horário.`);
  };

  const showTurnos = (availableTurnos: AvailableTurno[], day: AvailableDay) => {
    const turnosFormatados = availableTurnos
      .map((turno, index) => `${index + 1}. ${turno.label}${turno.vagas ? ` (${turno.vagas} vagas)` : ''}`)
      .join('\n');
    addMessage(`Turnos disponíveis em ${day.date}:\n${turnosFormatados}\n\nResponda com o número do turno.`);
  };

  const askConfirmation = (nextData: ChatFormData) => {
    const service = nextData.service;
    const day = nextData.day;
    if (!service || !day) return;

    const horario = nextData.hora ? `\nHora: ${nextData.hora}` : '';
    const turno = nextData.turno ? `\nTurno: ${nextData.turno.label}` : '';

    addMessage(
      `Resumo do agendamento:\n` +
        `Nome: ${nextData.nome}\n` +
        `Telefone: ${nextData.telefone}\n` +
        `CPF: ${nextData.cpf}\n` +
        `Serviço: ${service.label}\n` +
        `Data: ${day.date}${horario}${turno}\n\n` +
        `Confirma o agendamento? (sim/não)`
    );
    setStep('confirmacao');
  };

  const loadDaysForService = async (service: ChatServiceOption) => {
    addMessage(`Você escolheu ${service.label}. Buscando datas disponíveis...`);
    const availableDays = await diasDisponiveis(service);
    setDays(availableDays);

    if (!availableDays.length) {
      addMessage('Não há datas disponíveis para este serviço no momento.');
      return false;
    }

    showDays(availableDays);
    setStep('data');
    return true;
  };

  const handleInput = async (input: string) => {
    addMessage(input, 'user');
    setLoading(true);

    try {
      if (step === 'nome') {
        if (input.trim().length < 3) {
          addMessage('Por favor, digite um nome válido com pelo menos 3 caracteres.');
          return;
        }
        setFormData((current) => ({ ...current, nome: input.trim() }));
        addMessage(`Obrigado, ${input.trim()}! Qual é o seu telefone? Exemplo: (66) 99999-9999`);
        setStep('telefone');
        return;
      }

      if (step === 'telefone') {
        if (!validatePhone(input)) {
          addMessage('Telefone inválido. Digite com DDD, por exemplo: (66) 99999-9999.');
          return;
        }
        setFormData((current) => ({ ...current, telefone: formatPhone(input) }));
        addMessage('Perfeito. Agora preciso do seu CPF. Exemplo: 000.000.000-00');
        setStep('cpf');
        return;
      }

      if (step === 'cpf') {
        if (!validateCPF(input)) {
          addMessage('CPF inválido. Verifique e tente novamente.');
          return;
        }

        const cpf = formatCPF(input);
        setFormData((current) => ({ ...current, cpf }));

        if (availableServices.length === 1) {
          const service = availableServices[0];
          setFormData((current) => ({ ...current, cpf, service }));
          await loadDaysForService(service);
          return;
        }

        const servicoOptions = availableServices.map((service, index) => `${index + 1}. ${service.label}`).join('\n');
        addMessage(`Qual serviço você deseja agendar?\n${servicoOptions}\n\nResponda com o número do serviço.`);
        setStep('servico');
        return;
      }

      if (step === 'servico') {
        const serviceIndex = normalizeOption(input);
        const service = availableServices[serviceIndex];

        if (!service) {
          addMessage('Opção inválida. Responda com o número de um serviço da lista.');
          return;
        }

        setFormData((current) => ({ ...current, service, day: null, hora: '', turno: null }));
        await loadDaysForService(service);
        return;
      }

      if (step === 'data') {
        const dayIndex = normalizeOption(input);
        const day = days[dayIndex];
        const service = formData.service;

        if (!day || !service) {
          addMessage('Data inválida. Responda com o número de uma data da lista.');
          return;
        }

        const nextData = { ...formData, day, hora: '', turno: null };
        setFormData(nextData);

        if (serviceNeedsTurno(psf, service.kind)) {
          addMessage('Buscando turnos disponíveis...');
          const result = await turnosDisponiveis(service, day);
          setTurnos(result.turnos);

          if (!result.turnos.length) {
            addMessage('Não há turnos disponíveis nesta data. Escolha outra data.');
            return;
          }

          if (result.turnos.length === 1) {
            const dataWithTurno = { ...nextData, turno: result.turnos[0] };
            setFormData(dataWithTurno);
            askConfirmation(dataWithTurno);
            return;
          }

          showTurnos(result.turnos, day);
          setStep('turno');
          return;
        }

        if (serviceNeedsTime(psf, service.kind)) {
          addMessage('Buscando horários disponíveis...');
          const availableTimes = await horariosDisponiveis(service, day);
          setTimes(availableTimes);

          if (!availableTimes.length) {
            addMessage('Não há horários disponíveis nesta data. Escolha outra data.');
            return;
          }

          showTimes(availableTimes, day);
          setStep('hora');
          return;
        }

        askConfirmation(nextData);
        return;
      }

      if (step === 'hora') {
        const timeIndex = normalizeOption(input);
        const hora = times[timeIndex];

        if (!hora) {
          addMessage('Horário inválido. Responda com o número de um horário da lista.');
          return;
        }

        const nextData = { ...formData, hora };
        setFormData(nextData);
        askConfirmation(nextData);
        return;
      }

      if (step === 'turno') {
        const turnoIndex = normalizeOption(input);
        const turno = turnos[turnoIndex];

        if (!turno) {
          addMessage('Turno inválido. Responda com o número de um turno da lista.');
          return;
        }

        const nextData = { ...formData, turno };
        setFormData(nextData);
        askConfirmation(nextData);
        return;
      }

      if (step === 'confirmacao') {
        if (!isYes(input)) {
          if (!isNo(input)) {
            addMessage('Responda com sim para confirmar ou não para cancelar.');
            return;
          }
          addMessage('Agendamento cancelado. Obrigado por usar nosso serviço.');
          setStep('sucesso');
          return;
        }

        if (!formData.service || !formData.day) {
          addMessage('Não foi possível confirmar este agendamento. Recarregue a página e tente novamente.');
          setStep('sucesso');
          return;
        }

        addMessage('Confirmando seu agendamento...');
        const result = await criarAgendamento({
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf,
          service: formData.service,
          day: formData.day,
          hora: formData.hora || undefined,
          turno: formData.turno?.id
        });

        if (result.success) {
          addMessage(
            result.protocolo
              ? `Agendamento confirmado!\n\nProtocolo interno: #${result.protocolo}`
              : 'Agendamento confirmado!'
          );
          setStep('sucesso');
        } else {
          addMessage(`Erro ao confirmar agendamento: ${result.error || 'Tente novamente.'}`);
        }
      }
    } catch (error) {
      addMessage(error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-container">
          <span className="chat-kicker">Agendamento online</span>
          <h1>{psf.label}</h1>
          <p>{psf.subtitle}</p>
        </div>
      </header>

      <main className="chat-messages" aria-live="polite">
        <div className="chat-container chat-message-list">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {loading ? <div className="chat-typing">Aguarde...</div> : null}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-composer">
        <div className="chat-container">
          <ChatInput onSend={handleInput} disabled={loading || step === 'sucesso'} />
        </div>
      </footer>
    </div>
  );
}
