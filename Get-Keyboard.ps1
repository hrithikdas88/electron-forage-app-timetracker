Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class KeyboardListener {
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
}
"@

function Get-IsKeyPress {
    for ($keyCode = 1; $keyCode -le 255; $keyCode++) {
        $keyState = [KeyboardListener]::GetAsyncKeyState($keyCode)
        if ($keyState -eq -32767 -or $keyState -eq -32768) {
            return $true
        }
    }
    return $false
}

while ($true) {
    $isKeyPress = Get-IsKeyPress

    if ($isKeyPress) {
        Write-Output "Key is pressed."
    }

    Start-Sleep -Milliseconds 100
}

