'use client';

import { useCallback, useEffect, useState } from 'react';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let pendingPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

function publishPrompt(prompt: BeforeInstallPromptEvent | null) {
  pendingPrompt = prompt;
  promptListeners.forEach((listener) => listener(prompt));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    publishPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener('appinstalled', () => {
    publishPrompt(null);
  });
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(pendingPrompt);

  useEffect(() => {
    promptListeners.add(setDeferredPrompt);
    setDeferredPrompt(pendingPrompt);

    return () => {
      promptListeners.delete(setDeferredPrompt);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    if (!pendingPrompt) return null;

    const prompt = pendingPrompt;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    publishPrompt(null);
    return choice;
  }, []);

  return {
    canInstall: deferredPrompt !== null,
    requestInstall
  };
}
