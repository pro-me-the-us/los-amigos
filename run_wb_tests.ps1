param(
  [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Stop"
$results = @()

function Add-Result($id, $ok, $note) {
  $script:results += [pscustomobject]@{
    ID     = $id
    Result = $(if ($ok) { "PASS" } else { "FAIL" })
    Note   = $note
  }
}

function As-Array($value) {
  @($value)
}

function Call-Api {
  param(
    [string]$Method,
    [string]$Path,
    $Body = $null
  )

  $uri = "$BaseUrl$Path"
  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 20 -Compress
    $r = Invoke-WebRequest -SkipHttpErrorCheck -Uri $uri -Method $Method -ContentType "application/json" -Body $json
  } else {
    $r = Invoke-WebRequest -SkipHttpErrorCheck -Uri $uri -Method $Method
  }

  $parsed = $null
  try { $parsed = $r.Content | ConvertFrom-Json -Depth 50 } catch { $parsed = $r.Content }

  [pscustomobject]@{
    Status = [int]$r.StatusCode
    Body   = $parsed
    Raw    = $r.Content
  }
}

function New-DepId($prefix) {
  "$prefix-$([int](Get-Date -UFormat %s))-$((Get-Random -Minimum 1000 -Maximum 9999))"
}

Write-Host "Checking server at $BaseUrl ..."
try {
  $root = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 5
  if ($root.StatusCode -ne 200) { throw "Server not healthy" }
} catch {
  Write-Host "Server not reachable at $BaseUrl. Start backend first." -ForegroundColor Red
  exit 1
}

# WB-01
$r = Call-Api POST "/health-check" @{ url = "http://localhost:5000" }
Add-Result "WB-01" ($r.Status -eq 400 -and $r.Body.error -eq "deploymentId is required") $r.Raw

# WB-02
$r = Call-Api POST "/deploy" @{ deploymentId = "WB02" }
Add-Result "WB-02" ($r.Status -eq 400 -and $r.Body.error -eq "image is required") $r.Raw

# WB-03
$r = Call-Api POST "/detect-failure" @{ healthReport = @{ deploymentId = "D1"; status = "Healthy" } }
Add-Result "WB-03" ($r.Status -eq 200 -and $r.Body.failure -eq $false) $r.Raw

# WB-04
$r = Call-Api POST "/detect-failure" @{ healthReport = @{ deploymentId = "D2"; status = "Unhealthy"; error = "Timeout" } }
Add-Result "WB-04" ($r.Status -eq 200 -and $r.Body.failure -eq $true -and -not [string]::IsNullOrWhiteSpace($r.Body.reason)) $r.Raw

# WB-05
$r = Call-Api POST "/health-check" @{ deploymentId = "D5"; url = "https://jsonplaceholder.typicode.com/posts/1" }
Add-Result "WB-05" ($r.Status -eq 200 -and $r.Body.status -eq "Healthy" -and $r.Body.type -eq "HTTP") $r.Raw

# WB-06
$job = Start-Job -ScriptBlock {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 9099)
  $listener.Start()
  $end = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $end) {
    if ($listener.Pending()) {
      $c = $listener.AcceptTcpClient()
      Start-Sleep -Milliseconds 200
      $c.Close()
    } else {
      Start-Sleep -Milliseconds 100
    }
  }
  $listener.Stop()
}
Start-Sleep -Seconds 1
$r = Call-Api POST "/health-check" @{ deploymentId = "D6"; url = "http://127.0.0.1:9099/non-http" }
Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
Remove-Job $job -ErrorAction SilentlyContinue | Out-Null
Add-Result "WB-06" ($r.Status -eq 200 -and $r.Body.status -eq "Healthy" -and $r.Body.type -eq "TCP") $r.Raw

# WB-07
$r = Call-Api POST "/health-check" @{ deploymentId = "D7"; url = "http://127.0.0.1:65530" }
Add-Result "WB-07" ($r.Status -eq 200 -and $r.Body.status -eq "Unhealthy") $r.Raw

# WB-08
$r = Call-Api POST "/analyze" @{ deploymentId = "D8"; url = "http://127.0.0.1:65530" }
Add-Result "WB-08" ($r.Status -eq 200 -and $null -eq $r.Body.rollbackResult) $r.Raw

# WB-09
$r = Call-Api POST "/analyze" @{ deploymentId = "D9"; url = "http://127.0.0.1:65530"; previousVersion = "v1"; imageName = "myapp" }
Add-Result "WB-09" ($r.Status -eq 200 -and $null -ne $r.Body.rollbackResult) $r.Raw

# WB-10
$out = node -e "const {DeploymentManagementService}=require('./argus-src/src/services/deploymentManagementService'); console.log(JSON.stringify(DeploymentManagementService.parseImage('nginx:latest')));"
$p = $out | ConvertFrom-Json
Add-Result "WB-10" ($p.imageName -eq "nginx" -and $p.version -eq "latest") ($out -join "`n")

# WB-11
$out = node -e "const {DeploymentManagementService}=require('./argus-src/src/services/deploymentManagementService'); try{DeploymentManagementService.parseImage(':latest'); console.log('NO_ERROR')}catch(e){console.log(e.message)}"
Add-Result "WB-11" (($out -join "") -match "Invalid image format") ($out -join "`n")

# WB-12
docker image inspect myapp:v1 *> $null
if ($LASTEXITCODE -ne 0) {
  Add-Result "WB-12" $false "Precondition missing: local image myapp:v1 not found"
} else {
  $id12 = New-DepId "WB12"
  $r = Call-Api POST "/deploy" @{ deploymentId = $id12; image = "myapp:v1"; url = "https://jsonplaceholder.typicode.com/posts/1" }
  Add-Result "WB-12" ($r.Status -eq 200) $r.Raw
}

# WB-13
docker image rm -f nginx:latest *> $null
$id13 = New-DepId "WB13"
$r = Call-Api POST "/deploy" @{ deploymentId = $id13; image = "nginx:latest"; url = "https://jsonplaceholder.typicode.com/posts/1" }
Add-Result "WB-13" ($r.Status -eq 200) $r.Raw

# WB-14
$id14 = New-DepId "WB14"
$r1 = Call-Api POST "/deploy" @{ deploymentId = $id14; image = "myapp:v1"; url = "https://jsonplaceholder.typicode.com/posts/1" }
$r2 = Call-Api GET "/versions?imageName=myapp"
$items = As-Array $r2.Body
$stableFound = @( $items | Where-Object { $_.stable -eq $true } ).Count -gt 0
Add-Result "WB-14" ($r1.Status -eq 200 -and $r2.Status -eq 200 -and $stableFound) ("deploy=$($r1.Status), versions_count=$($items.Count), stableFound=$stableFound")

# WB-15
Call-Api POST "/detect-failure" @{ healthReport = @{ deploymentId = "WB15DEP"; status = "Healthy" } } | Out-Null
$r = Call-Api GET "/logs?deploymentId=WB15DEP&limit=5"
$ok = $r.Status -eq 200 -and @(As-Array $r.Body.logs).Count -gt 0
Add-Result "WB-15" $ok ("count=" + @(As-Array $r.Body.logs).Count)

# WB-16
Call-Api POST "/detect-failure" @{ healthReport = @{ deploymentId = "WB16DEP"; status = "Healthy" } } | Out-Null
$r = Call-Api GET "/logs?level=info&limit=5"
$logs = As-Array $r.Body.logs
$levelsOk = @($logs | Where-Object { $_.level -ne "info" }).Count -eq 0
Add-Result "WB-16" ($r.Status -eq 200 -and $logs.Count -gt 0 -and $levelsOk) ("count=" + $logs.Count)

# WB-17
$r = Call-Api GET "/logs"
Add-Result "WB-17" ($r.Status -eq 200 -and $r.Body.success -eq $true -and $null -ne $r.Body.count) ("count=" + $r.Body.count)

# WB-20
$rA = Call-Api GET "/versions"
$rB = Call-Api GET "/versions?imageName=nginx"
$listA = As-Array $rA.Body
$listB = As-Array $rB.Body
$okA = $rA.Status -eq 200 -and $listA.Count -ge 1
$okB = $rB.Status -eq 200 -and $listB.Count -ge 1
Add-Result "WB-20" ($okA -and $okB) ("all=$($listA.Count), nginx=$($listB.Count)")

$results | Sort-Object ID | Format-Table -AutoSize
$fail = @($results | Where-Object { $_.Result -eq "FAIL" }).Count
Write-Host "`nFailed: $fail / $($results.Count)"

if ($fail -gt 0) { exit 1 } else { exit 0 }
