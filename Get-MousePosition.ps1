function Get-IsMouseMoving {
    Add-Type -AssemblyName System.Windows.Forms
    $currentPosition = [System.Windows.Forms.Cursor]::Position
    Start-Sleep -Milliseconds 100
    $newPosition = [System.Windows.Forms.Cursor]::Position

    return $currentPosition -ne $newPosition
}

while ($true) {
    $isMouseMoving = Get-IsMouseMoving

    if ($isMouseMoving) {
        Write-Output "Mouse is moving."
    }

    Start-Sleep -Milliseconds 100
}
