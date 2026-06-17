'use client';

import { useEffect, useRef, useState } from 'react';

export type PendingMedia = {
  id: string;
  file: File;
  kind: 'photo' | 'audio';
  previewUrl: string;
};

type CitizenMediaPickerProps = {
  items: PendingMedia[];
  onChange: (items: PendingMedia[]) => void;
  disabled?: boolean;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CitizenMediaPicker({ items, onChange, disabled }: CitizenMediaPickerProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const itemsRef = useRef(items);

  itemsRef.current = items;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  function addFile(file: File, kind: 'photo' | 'audio') {
    const previewUrl = URL.createObjectURL(file);
    onChange([...items, { id: createId(), file, kind, previewUrl }]);
    setMediaError(null);
  }

  function removeItem(id: string) {
    const target = items.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(items.filter((item) => item.id !== id));
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMediaError('Selecione um arquivo de imagem.');
      return;
    }
    addFile(file, 'photo');
  }

  function stopRecordingTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('Seu dispositivo não suporta gravação de áudio.');
      return;
    }

    setMediaError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `audio-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' });
        addFile(file, 'audio');
        stopRecordingTracks();
        recorderRef.current = null;
        setRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => current + 1);
      }, 1000);
    } catch {
      stopRecordingTracks();
      setRecording(false);
      setMediaError('Permita o acesso ao microfone para gravar áudio.');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }

  return (
    <section className="citizen-media-block">
      <div className="citizen-media-block__header">
        <p className="eyebrow">Anexos</p>
        <h3>Foto ou áudio (opcional)</h3>
        <p className="citizen-media-block__hint">Registre o problema com imagem ou mensagem de voz.</p>
      </div>

      <div className="citizen-media-block__actions">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="citizen-media-block__file-input"
          onChange={handlePhotoChange}
          disabled={disabled || recording}
        />
        <button
          type="button"
          className="citizen-media-block__action-btn"
          onClick={() => photoInputRef.current?.click()}
          disabled={disabled || recording}
        >
          Tirar / enviar foto
        </button>
        {!recording ? (
          <button
            type="button"
            className="citizen-media-block__action-btn citizen-media-block__action-btn--secondary"
            onClick={() => void startRecording()}
            disabled={disabled}
          >
            Gravar áudio
          </button>
        ) : (
          <button
            type="button"
            className="citizen-media-block__action-btn citizen-media-block__action-btn--recording"
            onClick={stopRecording}
          >
            Parar gravação ({formatDuration(recordingSeconds)})
          </button>
        )}
      </div>

      {mediaError ? <p className="login-error">{mediaError}</p> : null}

      {items.length > 0 ? (
        <ul className="citizen-media-block__list">
          {items.map((item) => (
            <li key={item.id} className="citizen-media-block__item">
              {item.kind === 'photo' ? (
                <img src={item.previewUrl} alt="Foto anexada" className="citizen-media-block__photo" />
              ) : (
                <audio controls src={item.previewUrl} className="citizen-media-block__audio" />
              )}
              <div className="citizen-media-block__meta">
                <span>{item.kind === 'photo' ? 'Foto' : 'Áudio'}</span>
                <button type="button" onClick={() => removeItem(item.id)} disabled={disabled}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
