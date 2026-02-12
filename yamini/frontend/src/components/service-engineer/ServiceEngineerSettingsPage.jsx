import React from 'react';
import ServiceEngineerSettingsModal from './ServiceEngineerSettings.jsx';

export default function ServiceEngineerSettingsPage() {
  return <ServiceEngineerSettingsModal onClose={() => window.history.back()} />;
}
