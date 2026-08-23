Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms


$SERVER_IP = "127.0.0.1"
$PORT = 9999



# Connect

$tcp = New-Object System.Net.Sockets.TcpClient

Write-Host "Connecting..."

$tcp.Connect(
    $SERVER_IP,
    $PORT
)

Write-Host "Connected"


$stream = $tcp.GetStream()



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



# Send computer information

$info = @{
    desktop = $env:COMPUTERNAME
    username = $env:USERNAME
    ip = Get-LocalIP
} | ConvertTo-Json -Compress



$infoBytes =
[Text.Encoding]::UTF8.GetBytes(
    "INFO:" + $info + "`n"
)



$stream.Write(
    $infoBytes,
    0,
    $infoBytes.Length
)



# Full desktop size

$screen =
[Windows.Forms.Screen]::PrimaryScreen.Bounds


$width =
$screen.Width


$height =
$screen.Height



Write-Host "Capturing:"
Write-Host "$width x $height"



# JPEG encoder

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



while($true)
{

    try
    {


        # Full screen bitmap

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



        # Compress

        $memory =
        New-Object System.IO.MemoryStream



        $bitmap.Save(
            $memory,
            $encoder,
            $params
        )



        $frame =
        $memory.ToArray()



        # Send frame length first

        $length =
        [BitConverter]::GetBytes(
            $frame.Length
        )



        $stream.Write(
            $length,
            0,
            4
        )



        # Send frame

        $stream.Write(
            $frame,
            0,
            $frame.Length
        )



        # Cleanup

        $graphics.Dispose()
        $bitmap.Dispose()
        $memory.Dispose()



        Start-Sleep -Milliseconds 16

    }

    catch
    {

        Write-Host "Disconnected"

        break

    }

}
