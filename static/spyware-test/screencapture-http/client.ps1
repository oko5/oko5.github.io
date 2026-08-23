Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms


$SERVER = "127.0.0.1"
$PORT = 9999


function Get-LocalIP {

    try {

        return (
            Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object {
                $_.IPAddress -notlike "169.*" -and
                $_.IPAddress -ne "127.0.0.1"
            } |
            Select-Object -First 1
        ).IPAddress

    }
    catch {

        return "Unknown"

    }
}



Write-Host "Connecting..."


$request =
[System.Net.HttpWebRequest]::Create(
    "http://$SERVER`:$PORT/upload"
)


$request.Method = "POST"
$request.SendChunked = $true
$request.KeepAlive = $true

$request.ContentType =
"multipart/x-mixed-replace; boundary=frame"



$stream =
$request.GetRequestStream()



$screen =
[Windows.Forms.Screen]::PrimaryScreen.Bounds


$width =
$screen.Width

$height =
$screen.Height



$info = @{
    desktop = $env:COMPUTERNAME
    username = $env:USERNAME
    ip = Get-LocalIP
    resolution = "$width`x$height"
} | ConvertTo-Json -Compress



$infoBytes =
[Text.Encoding]::UTF8.GetBytes(
    "INFO:$info`n"
)


$stream.Write(
    $infoBytes,
    0,
    $infoBytes.Length
)



$encoder =
[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
Where-Object {
    $_.MimeType -eq "image/jpeg"
}



$params =
New-Object System.Drawing.Imaging.EncoderParameters(1)



$params.Param[0] =
New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    50
)



$frameDelay = 16



while($true)
{

    try
    {

        $bitmap =
        New-Object System.Drawing.Bitmap(
            $width,
            $height
        )


        $graphics =
        [System.Drawing.Graphics]::FromImage(
            $bitmap
        )


        $graphics.CopyFromScreen(
            $screen.Location,
            [System.Drawing.Point]::Empty,
            $screen.Size
        )



        $memory =
        New-Object System.IO.MemoryStream



        $bitmap.Save(
            $memory,
            $encoder,
            $params
        )


        $jpeg =
        $memory.ToArray()



        $header =
@"
--frame
Content-Type: image/jpeg
Content-Length: $($jpeg.Length)

"@



        $headerBytes =
        [Text.Encoding]::ASCII.GetBytes(
            $header
        )



        $stream.Write(
            $headerBytes,
            0,
            $headerBytes.Length
        )


        $stream.Write(
            $jpeg,
            0,
            $jpeg.Length
        )



        $end =
        [Text.Encoding]::ASCII.GetBytes(
            "`r`n"
        )


        $stream.Write(
            $end,
            0,
            $end.Length
        )



        $graphics.Dispose()
        $bitmap.Dispose()
        $memory.Dispose()



        Start-Sleep -Milliseconds $frameDelay

    }

    catch
    {

        Write-Host "Disconnected"
        break

    }

}
