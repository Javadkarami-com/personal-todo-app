Add-Type -AssemblyName System.Drawing

$iconDir = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\icons'
if (!(Test-Path $iconDir)) { New-Item -ItemType Directory -Path $iconDir -Force | Out-Null }

function New-PremiumIcon {
    param(
        [int]$Size,
        [string]$Path,
        [bool]$Maskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Deep crimson/burgundy (#A4161A)
    $crimson = [System.Drawing.Color]::FromArgb(164, 22, 26)
    $crimsonDark = [System.Drawing.Color]::FromArgb(128, 14, 18)
    $gold = [System.Drawing.Color]::FromArgb(201, 162, 39) # #C9A227

    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $crimson, $crimsonDark, 45.0)

    if ($Maskable) {
        $g.FillRectangle($gradBrush, 0, 0, $Size, $Size)
        # Subtle gold inner ring / detail
        $goldPen = New-Object System.Drawing.Pen($gold, [Math]::Max(2, [int]($Size * 0.02)))
        $inset = [int]($Size * 0.08)
        $g.DrawRectangle($goldPen, $inset, $inset, $Size - 2*$inset, $Size - 2*$inset)
        $goldPen.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $radius = [int]($Size * 0.24)
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $gp.AddArc(0, 0, $d, $d, 180, 90)
        $gp.AddArc($Size - $d, 0, $d, $d, 270, 90)
        $gp.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
        $gp.AddArc(0, $Size - $d, $d, $d, 90, 90)
        $gp.CloseFigure()
        $g.FillPath($gradBrush, $gp)

        # Thin gold border detail
        $goldPen = New-Object System.Drawing.Pen($gold, [Math]::Max(2, [int]($Size * 0.025)))
        $g.DrawPath($goldPen, $gp)
        $goldPen.Dispose()
        $gp.Dispose()
    }
    $gradBrush.Dispose()

    # White checkmark with elegant proportion
    $penW = [Math]::Max(3, [int]($Size * 0.075))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penW)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $cx = $Size / 2
    $cy = $Size / 2
    $s = $Size * 0.27

    $p1 = New-Object System.Drawing.PointF(($cx - $s * 0.85), ($cy + $s * 0.05))
    $p2 = New-Object System.Drawing.PointF(($cx - $s * 0.15), ($cy + $s * 0.65))
    $p3 = New-Object System.Drawing.PointF(($cx + $s * 0.95), ($cy - $s * 0.65))

    $g.DrawLine($pen, $p1, $p2)
    $g.DrawLine($pen, $p2, $p3)
    $pen.Dispose()

    # Small gold dot accent
    $goldBrush = New-Object System.Drawing.SolidBrush($gold)
    $dotR = [Math]::Max(3, [int]($Size * 0.035))
    $g.FillEllipse($goldBrush, ($cx + $s * 0.95 - $dotR), ($cy - $s * 0.65 - $dotR * 2.8), $dotR * 2, $dotR * 2)
    $goldBrush.Dispose()

    $g.Dispose()

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $Path"
}

New-PremiumIcon -Size 192 -Path (Join-Path $iconDir 'icon-192x192.png')
New-PremiumIcon -Size 512 -Path (Join-Path $iconDir 'icon-512x512.png')
New-PremiumIcon -Size 512 -Path (Join-Path $iconDir 'icon-maskable-512.png') -Maskable $true

Write-Host "All premium icons generated."
