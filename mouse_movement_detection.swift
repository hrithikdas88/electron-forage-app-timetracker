import Cocoa

func startMouseMovementDetection() {
    print("Mouse movement detection started.")
    
    // Create an NSEvent mask for mouse movement events
    let mask: NSEvent.EventTypeMask = .mouseMoved
    
    // Start a global event monitor
    NSEvent.addGlobalMonitorForEvents(matching: mask) { event in
        // Print a message indicating that the mouse has moved
        print("Mouse moved.")
        
        // Optionally, you can perform any other actions here based on mouse movement
    }
    
    // Run the main event loop
    RunLoop.current.run()
}

startMouseMovementDetection()
