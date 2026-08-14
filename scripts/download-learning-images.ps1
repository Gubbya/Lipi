param([string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)

$ErrorActionPreference = 'Stop'
$outputDirectory = Join-Path $ProjectRoot 'assets\images\vocabulary'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$assets = @{
  'hello.png' = '1f44b'
  'water.png' = '1f4a7'
  'book.png' = '1f4d6'
  'sun.png' = '2600'
  'cat.png' = '1f408'
  'house.png' = '1f3e0'
}

foreach ($asset in $assets.GetEnumerator()) {
  $url = "https://raw.githubusercontent.com/jdecked/twemoji/main/assets/72x72/$($asset.Value).png"
  Invoke-WebRequest -Uri $url -OutFile (Join-Path $outputDirectory $asset.Key)
}

Write-Output "Downloaded $($assets.Count) Twemoji vocabulary images."
