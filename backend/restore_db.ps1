param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

if (-Not (Test-Path $BackupFile)) {
    Write-Host "Backup file not found: $BackupFile"
    exit 1
}

$line = Get-Content .env | Select-String "^DATABASE_URL="
$env:DATABASE_URL = $line -replace "^DATABASE_URL=", ""

Write-Host "Restoring from $BackupFile ..."
psql $env:DATABASE_URL -f $BackupFile

Write-Host "Restore complete."
