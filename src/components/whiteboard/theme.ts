export const bloxBuddyTheme = {
  // TLDraw theme overrides
  colorScheme: 'dark',
  colors: {
    background: '#001D39',
    foreground: '#DDDDDD',
    primary: '#36B0D9',
    selection: '#4AC4E8',
    panel: '#002246',
    overlay: 'rgba(54, 176, 217, 0.1)',
  },
  fonts: {
    draw: 'system-ui, sans-serif',
    sans: 'system-ui, sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
}

export const customStyles = `
  .tl-container {
    background: linear-gradient(135deg, #001D39 0%, #002246 100%);
  }
  
  .tl-button {
    background: rgba(54, 176, 217, 0.1) !important;
    border: 1px solid rgba(54, 176, 217, 0.2) !important;
    color: #DDDDDD !important;
  }
  
  .tl-button:hover {
    background: rgba(54, 176, 217, 0.2) !important;
  }
  
  .tl-button[data-state="selected"] {
    background: #36B0D9 !important;
    color: #FFFFFF !important;
  }
  
  .tl-panel {
    background: rgba(0, 29, 57, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(54, 176, 217, 0.2) !important;
  }
`