# Agent identity — both values are injected by the dashboard server
# agent_id:   stable UUID (Firestore key, never changes, not shown to users)
# agent_name: display label (defaults to machine name, can be renamed by admin)
$agentId   = "{{AGENT_ID}}"          # UUID generated server-side
$agentName = $env:COMPUTERNAME       # Always use the real machine name as display label
$jsonConfig = @"
{
  "AgentId": "$agentId",
  "AgentName": "$agentName",
  "OrganizationApiKey": "{{API_KEY}}",
  "TrustedSystemProcesses": [],
  "TrustedExecutionPaths": [],
  "UntrustedExecutionPaths": [
    "%USERPROFILE%\\Downloads",
    "%USERPROFILE%\\AppData\\Local\\Temp",
    "%USERPROFILE%\\Desktop"
  ],
  "ProcessPathExpectations": {
    "svchost.exe": [
      "C:\\Windows\\System32\\",
      "C:\\Windows\\SysWOW64\\"
    ],
    "lsass.exe": [
      "C:\\Windows\\System32\\"
    ],
    "csrss.exe": [
      "C:\\Windows\\System32\\"
    ],
    "winlogon.exe": [
      "C:\\Windows\\System32\\"
    ],
    "services.exe": [
      "C:\\Windows\\System32\\"
    ],
    "smss.exe": [
      "C:\\Windows\\System32\\"
    ],
    "explorer.exe": [
      "C:\\Windows\\"
    ],
    "taskhostw.exe": [
      "C:\\Windows\\System32\\"
    ],
    "spoolsv.exe": [
      "C:\\Windows\\System32\\"
    ],
    "dllhost.exe": [
      "C:\\Windows\\System32\\"
    ],
    "conhost.exe": [
      "C:\\Windows\\System32\\"
    ],
    "wininit.exe": [
      "C:\\Windows\\System32\\"
    ],
    "wmiprvse.exe": [
      "C:\\Windows\\System32\\wbem\\"
    ],
    "audiodg.exe": [
      "C:\\Windows\\System32\\"
    ],
    "lsm.exe": [
      "C:\\Windows\\System32\\"
    ],
    "fontdrvhost.exe": [
      "C:\\Windows\\System32\\"
    ],
    "sihost.exe": [
      "C:\\Windows\\System32\\"
    ],
    "ctfmon.exe": [
      "C:\\Windows\\System32\\"
    ],
    "rundll32.exe": [
      "C:\\Windows\\System32\\",
      "C:\\Windows\\SysWOW64\\"
    ],
    "wermgr.exe": [
      "C:\\Windows\\System32\\"
    ],
    "taskmgr.exe": [
      "C:\\Windows\\System32\\"
    ],
    "powershell.exe": [
      "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\",
      "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\"
    ],
    "cmd.exe": [
      "C:\\Windows\\System32\\",
      "C:\\Windows\\SysWOW64\\"
    ],
    "mshta.exe": [
      "C:\\Windows\\System32\\",
      "C:\\Windows\\SysWOW64\\"
    ],
    "regsvr32.exe": [
      "C:\\Windows\\System32\\",
      "C:\\Windows\\SysWOW64\\"
    ],
    "bitsadmin.exe": [
      "C:\\Windows\\System32\\"
    ],
    "certutil.exe": [
      "C:\\Windows\\System32\\"
    ],
    "schtasks.exe": [
      "C:\\Windows\\System32\\"
    ],
    "whoami.exe": [
      "C:\\Windows\\System32\\"
    ],
    "net.exe": [
      "C:\\Windows\\System32\\"
    ],
    "netsh.exe": [
      "C:\\Windows\\System32\\"
    ]
  },
  "Rules": {},
  "NetworkScanWindowSeconds": 30,
  "YaraRulesPath": "Rules\\Yara"
}
"@

Set-Content -Path "config.json" -Value $jsonConfig -Encoding utf8
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "TechzazEDR Agent Bootstrapped Successfully!" -ForegroundColor Green
Write-Host "Agent ID:   $agentId"
Write-Host "Agent Name: $agentName"
Write-Host "Config saved to: $(Get-Location)\config.json"
Write-Host "----------------------------------------------------"

# Clean up the bootstrap script itself
if ($PSCommandPath) {
    Start-Sleep -Seconds 1 # Give the console a moment to flush output
    Remove-Item -Path $PSCommandPath -Force -ErrorAction SilentlyContinue
    Write-Host "Bootstrap script has been securely deleted from disk." -ForegroundColor DarkGray
}
