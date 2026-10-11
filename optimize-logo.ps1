Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\assets\favicon.png'
$img = [System.Drawing.Image]::FromFile($src)
$newW = 256
$newH = [int]($img.Height * ($newW / $img.Width))
$bmp = New-Object System.Drawing.Bitmap($newW, $newH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, $newW, $newH)
$img.Dispose()
$g.Dispose()

$optPath = 'C:\Users\javad\.gemini\antigravity\scratch\todo-pwa\assets\favicon-opt.png'
$bmp.Save($optPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Move-Item $optPath $src -Force
Write-Host "Optimized favicon.png size: $((Get-Item $src).Length) bytes"
