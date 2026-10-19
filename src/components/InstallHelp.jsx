import { Smartphone } from 'lucide-react';
import Card from './Card.jsx';

export default function InstallHelp() {
  return (
    <Card title="Install on your phone" icon={<Smartphone size={18} aria-hidden="true" />}>
      <p className="muted">
        Installing puts Eleven on your home screen so it opens like an app, even offline. You need an internet connection the first time you open it.
      </p>

      <details className="help">
        <summary>iPhone (Safari)</summary>
        <ol>
          <li>Open the app link in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> button.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
        </ol>
      </details>

      <details className="help">
        <summary>Android (Chrome)</summary>
        <ol>
          <li>Open the app link in <strong>Chrome</strong>.</li>
          <li>Tap the menu.</li>
          <li>Choose <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
        </ol>
      </details>
    </Card>
  );
}