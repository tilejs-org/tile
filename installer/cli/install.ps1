$ErrorActionPreference = "Stop"

$requiredVersion = 24
$package = "@tile.js/cli@latest"

function Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

function ErrorExit($message, $code = 1) {
    Write-Host ""
    Write-Host $message -ForegroundColor Red
    exit $code
}

function Invoke-WithSpinner {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$Message
    )

    $frames = @(
        "⠋","⠙","⠹","⠸","⠼",
        "⠴","⠦","⠧","⠇","⠏"
    )

    $process = Start-Process `
        -FilePath $FilePath `
        -ArgumentList $Arguments `
        -NoNewWindow `
        -PassThru

    $i = 0

    while (-not $process.HasExited) {
        Write-Host -NoNewline "`r$($frames[$i]) $Message"
        Start-Sleep -Milliseconds 80
        $i = ($i + 1) % $frames.Count
    }

    $process.WaitForExit()

    if ($process.ExitCode -ne 0) {
        Write-Host ""
        ErrorExit "Installation failed." $process.ExitCode
    }

    Write-Host -NoNewline "`r"
    Write-Host (" " * 80) -NoNewline
    Write-Host -NoNewline "`r"
}

Clear-Host

Info "Installing Tile CLI"
Write-Host ""

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    ErrorExit @"
Node.js is not installed.

Please install Node.js $requiredVersion or newer:

https://nodejs.org/
"@
}

$nodeVersion = [int]((node -v).TrimStart("v").Split(".")[0])

if ($nodeVersion -lt $requiredVersion) {
    ErrorExit @"
Node.js $requiredVersion or newer is required.

Current version: $(node -v)

Please update Node.js:

https://nodejs.org/
"@
}

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    ErrorExit "npm was not found."
}

Invoke-WithSpinner `
    -FilePath "npm" `
    -Arguments @("install", "-g", $package) `
    -Message "Installing package..."

Success "Tile CLI installed successfully."
Write-Host ""

$tile = Get-Command tile -ErrorAction SilentlyContinue

if ($tile) {
    tile version
}
else {
    Warning "The 'tile' command is not available in the current terminal."
    Write-Host ""
    Write-Host "Open a new terminal and run:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    tile version" -ForegroundColor White
}