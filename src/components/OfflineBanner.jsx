import { WifiOff } from 'lucide-react';
import useOnlineStatus from '../hooks/useOnlineStatus.js';

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} aria-hidden="true" /> You&apos;re offline. Eleven still works, and your data stays on this device.
    </div>
  );
}