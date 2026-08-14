param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$contentPath = Join-Path $ProjectRoot 'src\content\packages\english.json'
$content = Get-Content -LiteralPath $contentPath -Raw | ConvertFrom-Json
$voiceVariants = @(
  @{ Locale = 'en-US'; Voice = 'Microsoft Zira Desktop' },
  @{ Locale = 'en-GB'; Voice = 'Microsoft Hazel Desktop' }
)

foreach ($variant in $voiceVariants) {
  $outputDirectory = Join-Path $ProjectRoot ("assets\audio\" + $variant.Locale)
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

  $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $synthesizer.SelectVoice($variant.Voice)
    $synthesizer.Rate = -1
    $synthesizer.Volume = 100

    foreach ($unit in $content.units) {
      $outputPath = Join-Path $outputDirectory ($unit.id + '.wav')
      $cue = if ($unit.speechCue) { $unit.speechCue } else { $unit.displayName }
      $synthesizer.SetOutputToWaveFile($outputPath)
      $synthesizer.Speak($cue)
      $synthesizer.SetOutputToNull()
    }

    foreach ($activity in $content.activities) {
      $outputPath = Join-Path $outputDirectory ($activity.id + '-prompt.wav')
      $synthesizer.SetOutputToWaveFile($outputPath)
      $synthesizer.Speak($activity.prompt)
      $synthesizer.SetOutputToNull()
    }

    $feedbackCues = @{
      'feedback-correct' = 'Correct. Well done!'
      'feedback-try-again' = 'Listen once more, and try again.'
    }
    foreach ($feedbackCue in $feedbackCues.GetEnumerator()) {
      $outputPath = Join-Path $outputDirectory ($feedbackCue.Key + '.wav')
      $synthesizer.SetOutputToWaveFile($outputPath)
      $synthesizer.Speak($feedbackCue.Value)
      $synthesizer.SetOutputToNull()
    }
  }
  finally {
    $synthesizer.Dispose()
  }
}

$fileCount = ($content.units.Count + $content.activities.Count + 2) * $voiceVariants.Count
Write-Output ("Generated " + $fileCount + " offline audio files.")
