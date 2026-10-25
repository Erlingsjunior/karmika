/* ponte segura entre o jogo e o app: o jogo só enxerga estas funções */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('karmikaDesktop', {
  isDesktop: true,
  host: (opts) => ipcRenderer.invoke('host:start', opts),
  hostInfo: () => ipcRenderer.invoke('host:info'),
  /** salas de Karmika abertas neste PC e na rede local */
  servers: () => ipcRenderer.invoke('net:servers'),
  stopHost: () => ipcRenderer.invoke('host:stop'),
  gpu: () => ipcRenderer.invoke('app:gpu'),
  /** confere a versão do jogo com o servidor e baixa o que mudou */
  update: (invite) => ipcRenderer.invoke('game:update', invite),
  onUpdate: (cb) => { const f = (_e, p) => cb(p); ipcRenderer.on('game:progress', f); return () => ipcRenderer.off('game:progress', f); },
  copy: (text) => ipcRenderer.invoke('app:copy', text),
  open: (url) => ipcRenderer.invoke('app:open', url),
  onHostLog: (cb) => { const f = (_e, line) => cb(line); ipcRenderer.on('host:log', f); return () => ipcRenderer.off('host:log', f); },
});
