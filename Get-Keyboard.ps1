# Define a function to check if a key is pressed
function IsKeyPressed($key) {
    $keyCode = [Windows.Input.KeyInterop]::VirtualKeyFromKey($key)
    $keyState = [Windows.Input.Keyboard]::GetCurrentState($keyCode)

    return $keyState -eq 'Down'
}

while ($true) {
    # Check if any key is pressed
    if ([Console]::KeyAvailable) {
        Write-Output "A key is pressed."
        [Console]::ReadKey() | Out-Null  # Consume the key to avoid duplicate prints
    }

    Start-Sleep -Milliseconds 100
}



