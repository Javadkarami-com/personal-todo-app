$fontsDir = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\fonts'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0')

# Fontsource Vazirmatn provides latin and arabic subsets or full woff2
$vazirMap = @(
    @{ Name = 'Vazirmatn-Regular.woff2'; Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/arabic-400-normal.woff2' },
    @{ Name = 'Vazirmatn-Medium.woff2';  Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/arabic-500-normal.woff2' },
    @{ Name = 'Vazirmatn-SemiBold.woff2';Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/arabic-600-normal.woff2' },
    @{ Name = 'Vazirmatn-Bold.woff2';    Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/arabic-700-normal.woff2' }
)

foreach ($i in $vazirMap) {
    $out = Join-Path $fontsDir $i.Name
    try {
        $wc.DownloadFile($i.Url, $out)
        $len = (Get-Item $out).Length
        Write-Host "Downloaded $($i.Name): $len bytes"
    } catch {
        Write-Warning "Failed $($i.Name): $($_.Exception.Message)"
    }
}
