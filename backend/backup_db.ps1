$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_$timestamp.sql"

pg_dump $env:DATABASE_URL -f $backupFile

Write-Host "Backup saved to $backupFile"