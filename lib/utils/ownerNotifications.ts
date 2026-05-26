import { formatDateYYYYMMDDInTimeZone, SHOP_BUSINESS_TIMEZONE } from '@/lib/utils/shopHours';

export interface OwnerNotificationItem {
  id: string;
  appointmentId: string;
  customerName: string;
  barberName?: string;
  startTime: string;
  read: boolean;
  createdAt: string;
}

function storageKey(shopId: string, dateStr: string) {
  return `owner-notifications-${shopId}-${dateStr}`;
}

export function getTodayDateStr(): string {
  return formatDateYYYYMMDDInTimeZone(new Date(), SHOP_BUSINESS_TIMEZONE);
}

export function loadOwnerNotifications(shopId: string, dateStr: string): OwnerNotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(shopId, dateStr));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OwnerNotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOwnerNotifications(
  shopId: string,
  dateStr: string,
  items: OwnerNotificationItem[]
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(shopId, dateStr), JSON.stringify(items));
}

let audioContext: AudioContext | null = null;

/** Resume audio on first user interaction (browser autoplay policy). */
export function initOwnerAlertAudio() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        void audioContext.resume();
      }
    } catch {
      // ignore
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

/** Play a short beep three times (Web Audio API). */
export function playBookingAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    const ctx = audioContext;
    const playBeep = (delayMs: number) => {
      setTimeout(() => {
        void ctx.resume().then(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        });
      }, delayMs);
    };
    playBeep(0);
    playBeep(450);
    playBeep(900);
  } catch {
    // ignore autoplay / audio errors
  }
}
