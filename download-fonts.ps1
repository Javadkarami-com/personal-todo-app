$fontsDir = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\fonts'
if (!(Test-Path $fontsDir)) { New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0')

$downloads = @(
    @{ Name = 'Vazirmatn-Regular.woff2'; Url = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/web/Vazirmatn-Regular.woff2' },
    @{ Name = 'Vazirmatn-Medium.woff2';  Url = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/web/Vazirmatn-Medium.woff2' },
    @{ Name = 'Vazirmatn-SemiBold.woff2';Url = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/web/Vazirmatn-SemiBold.woff2' },
    @{ Name = 'Vazirmatn-Bold.woff2';    Url = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/web/Vazirmatn-Bold.woff2' },
    @{ Name = 'Nunito-Regular.woff2';    Url = 'https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-400-normal.woff2' },
    @{ Name = 'Nunito-SemiBold.woff2';   Url = 'https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-600-normal.woff2' },
    @{ Name = 'Nunito-Bold.woff2';       Url = 'https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-700-normal.woff2' }
)

foreach ($item in $downloads) {
    $outPath = Join-Path $fontsDir $item.Name
    Write-Host "Downloading $($item.Name)..."
    try {
        $wc.DownloadFile($item.Url, $outPath)
        $len = (Get-Item $outPath).Length
        Write-Host "Saved: $($item.Name) ($len bytes)"
    } catch {
        Write-Warning "Failed: $($item.Name) - $($_.Exception.Message)"
    }
}
