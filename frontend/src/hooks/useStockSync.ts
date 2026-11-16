import { useEffect } from 'react';

const stockSyncEvent = 'pos:stock-sync';
const stockSyncChannel = 'pos-stock-sync';

export function notifyStockSync() {
  window.dispatchEvent(new Event(stockSyncEvent));
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(stockSyncChannel);
    channel.postMessage('revalidate');
    channel.close();
  }
}

export function useStockSync(revalidate: () => void) {
  useEffect(() => {
    const channel =
      'BroadcastChannel' in window
        ? new BroadcastChannel(stockSyncChannel)
        : null;
    if (channel) channel.onmessage = revalidate;
    window.addEventListener(stockSyncEvent, revalidate);
    return () => {
      window.removeEventListener(stockSyncEvent, revalidate);
      channel?.close();
    };
  }, [revalidate]);
}
