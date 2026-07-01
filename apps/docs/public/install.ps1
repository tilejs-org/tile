$ErrorActionPreference = "Stop"

$ApiUrl = "https://api-tilejs.vercel.app/versions/root"

# pega versão da API
try {
    $response = Invoke-RestMethod -Uri $ApiUrl
    $version = $response.version
} catch {
    Write-Host "Failed to fetch version from API"
    exit 1
}

if (-not $version) {
    Write-Host "Invalid version from API"
    exit 1
}

# monta URL do release
$downloadUrl = "https://github.com/tilejs-org/tile/releases/download/v$version/install.ps1"

Write-Host "Downloading installer from: $downloadUrl"

try {
    Invoke-Expression (Invoke-RestMethod -Uri $downloadUrl)
} catch {
    Write-Host "Failed to download or execute installer"
    exit 1
}