import React from 'react';
import ReceptionSettingsModal from './ReceptionSettings.jsx';

export default function ReceptionSettingsPage() {
  return <ReceptionSettingsModal onClose={() => window.history.back()} />;
}
