$fontsDir = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\fonts'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0')

# Also download latin subset for Vazirmatn so if any character is rendered by Vazirmatn in Latin or Persian, it covers everything smoothly
$vazirLatin = @(
    @{ Name = 'Vazirmatn-Latin-Regular.woff2'; Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/latin-400-normal.woff2' },
    @{ Name = 'Vazirmatn-Latin-Medium.woff2';  Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/latin-500-normal.woff2' },
    @{ Name = 'Vazirmatn-Latin-SemiBold.woff2';Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/latin-600-normal.woff2' },
    @{ Name = 'Vazirmatn-Latin-Bold.woff2';    Url = 'https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/latin-700-normal.woff2' }
)

foreach ($i in $vazirLatin) {
    $out = Join-Path $fontsDir $i.Name
    try {
        $wc.DownloadFile($i.Url, $out)
        $len = (Get-Item $out).Length
        Write-Host "Downloaded $($i.Name): $len bytes"
    } catch {
        Write-Warning "Failed $($i.Name): $($_.Exception.Message)"
    }
}
