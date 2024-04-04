#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

@interface MouseMovementDetector : NSObject

- (void)startDetection;

@end

@implementation MouseMovementDetector {
    NSPoint lastMousePosition;
}

- (void)startDetection {
    NSLog(@"Mouse movement detection started.");
    
    // Get the initial mouse position
    lastMousePosition = [NSEvent mouseLocation];
    
    // Start a timer to periodically check the mouse position
    [NSTimer scheduledTimerWithTimeInterval:1.0
                                     target:self
                                   selector:@selector(checkMouseMovement:)
                                   userInfo:nil
                                    repeats:YES];
    
    // Run the main event loop
    [[NSRunLoop currentRunLoop] run];
}

- (void)checkMouseMovement:(NSTimer *)timer {
    NSPoint currentMousePosition = [NSEvent mouseLocation];
    
    // Check if the mouse position has changed
    if (!NSEqualPoints(lastMousePosition, currentMousePosition)) {
        NSLog(@"Mouse moved at: %@", NSStringFromPoint(currentMousePosition));
        lastMousePosition = currentMousePosition;
    }
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        MouseMovementDetector *detector = [[MouseMovementDetector alloc] init];
        [detector startDetection];
    }
    return 0;
}
