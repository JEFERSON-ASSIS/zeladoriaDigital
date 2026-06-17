'use client';

import { resolveAttachmentUrl } from '../lib/api';

type OccurrenceAttachment = {
  id: string;
  fileUrl: string;
  fileType: string;
};

type OccurrenceAttachmentsProps = {
  attachments?: OccurrenceAttachment[] | null;
};

export function OccurrenceAttachments({ attachments }: OccurrenceAttachmentsProps) {
  if (!attachments?.length) return null;

  return (
    <div className="occurrence-attachments">
      <p className="occurrence-attachments__title">Anexos enviados</p>
      <div className="occurrence-attachments__grid">
        {attachments.map((attachment) => {
          const url = resolveAttachmentUrl(attachment.fileUrl);
          if (attachment.fileType === 'photo') {
            return (
              <a key={attachment.id} href={url} target="_blank" rel="noreferrer" className="occurrence-attachments__photo-link">
                <img src={url} alt="Foto da ocorrência" className="occurrence-attachments__photo" />
              </a>
            );
          }

          return (
            <div key={attachment.id} className="occurrence-attachments__audio-wrap">
              <span>Áudio</span>
              <audio controls src={url} className="occurrence-attachments__audio" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
