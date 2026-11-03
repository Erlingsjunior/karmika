; 03/11 (Erling: "a NVIDIA não entende o Karmika como um jogo"): o instalador marca o Karmika.exe como
; "Alto desempenho" nas Configurações gráficas do Windows (a mesma chave que o Windows grava quando você
; escolhe pela tela). Em notebook com duas placas, garante a RTX; em desktop com uma placa só, não muda nada.
!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\DirectX\UserGpuPreferences" "$INSTDIR\Karmika.exe" "GpuPreference=2;"
!macroend
!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\DirectX\UserGpuPreferences" "$INSTDIR\Karmika.exe"
!macroend
