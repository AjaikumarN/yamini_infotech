import React from 'react';
import SalesmanSettingsModal from './Settings.jsx';

export default function SalesmanSettingsPage() {
  return <SalesmanSettingsModal onClose={() => window.history.back()} />;
}
