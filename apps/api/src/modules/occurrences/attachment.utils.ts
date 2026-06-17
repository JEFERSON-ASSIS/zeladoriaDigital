const PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/aac'
]);

export function resolveAttachmentType(mimeType: string) {
  if (PHOTO_MIME_TYPES.has(mimeType)) return 'photo';
  if (AUDIO_MIME_TYPES.has(mimeType)) return 'audio';
  return null;
}

export function isAllowedAttachment(mimeType: string) {
  return resolveAttachmentType(mimeType) != null;
}

export function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/heic':
    case 'image/heif':
      return '.heic';
    case 'audio/webm':
      return '.webm';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/mpeg':
    case 'audio/mp3':
      return '.mp3';
    case 'audio/mp4':
      return '.m4a';
    case 'audio/wav':
    case 'audio/x-wav':
      return '.wav';
    case 'audio/aac':
      return '.aac';
    default:
      return '';
  }
}
