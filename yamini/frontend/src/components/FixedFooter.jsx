import React from 'react'
import { theme } from '../admin/styles/designSystem'

export default function FixedFooter() {
  const style = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: theme.spacing.xxl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    zIndex: theme.zIndex.fixed,
    pointerEvents: 'none',
    background: 'transparent'
  }

  return (
    <div style={style}>
      <small>YAMINI INFOTECH © 2025. SOLUTION.</small>
    </div>
  )
}
