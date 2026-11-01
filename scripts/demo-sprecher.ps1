# Erzeugt die Sprecher-Aufnahmen für das Demo-Video mit einer lokalen Windows-Stimme (nichts geht online).
# Aufruf: powershell -File scripts/demo-sprecher.ps1 <ausgabeordner>
param([Parameter(Mandatory)][string]$Ausgabe, [string]$Stimme = 'Katja')

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

# WinRT-Aufrufe synchron abwarten
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } |
  Select-Object -First 1
function Warte($operation, [type]$typ) {
  $task = $asTask.MakeGenericMethod($typ).Invoke($null, @($operation))
  $task.Wait() | Out-Null
  $task.Result
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$synth.Voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like "*$Stimme*" } | Select-Object -First 1
$synth.Options.SpeakingRate = 0.95

New-Item -ItemType Directory -Force $Ausgabe | Out-Null
$texte = Get-Content (Join-Path $PSScriptRoot 'demo-text.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$dauern = [ordered]@{}

foreach ($abschnitt in $texte.PSObject.Properties) {
  $stream = Warte ($synth.SynthesizeTextToStreamAsync($abschnitt.Value.sprechen)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $laenge = [uint32]$stream.Size
  Warte ($reader.LoadAsync($laenge)) ([uint32]) | Out-Null
  $bytes = New-Object byte[] $laenge
  $reader.ReadBytes($bytes)
  $datei = Join-Path $Ausgabe "$($abschnitt.Name).wav"
  [IO.File]::WriteAllBytes($datei, $bytes)
  # WAV: Byte-Rate steht ab Offset 28, Daten nach dem 44-Byte-Kopf
  $byteRate = [BitConverter]::ToUInt32($bytes, 28)
  $dauern[$abschnitt.Name] = [math]::Round(($laenge - 44) / $byteRate * 1000)
}

$dauern | ConvertTo-Json | Set-Content (Join-Path $Ausgabe 'dauern.json') -Encoding ASCII
$dauern
