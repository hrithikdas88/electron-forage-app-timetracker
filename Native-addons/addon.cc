#include <napi.h>
#include <iostream>
#include <ApplicationServices/ApplicationServices.h>

// Global reference to the JavaScript callback function
Napi::FunctionReference jsCallback;

// The actual event tap callback function
CGEventRef MyEventTapCallback(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void *userInfo) {
    if (type == kCGEventMouseMoved) {
        // Notify JavaScript that the mouse moved
        // This should ideally be done in a thread-safe way
        Napi::HandleScope scope(jsCallback.Env());
        jsCallback.Call({ Napi::String::New(jsCallback.Env(), "Mouse moved") });
    }
    return event; // Pass the event to the next event tap
}

// StartTracking will be called from JavaScript to start the event tap
Napi::Value StartTracking(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Save the callback reference for later use
    jsCallback = Napi::Persistent(info[0].As<Napi::Function>());

    // Set up the event tap
    CGEventMask eventMask = CGEventMaskBit(kCGEventMouseMoved);
    CFMachPortRef eventTap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        0,
        eventMask,
        MyEventTapCallback,
        NULL
    );

    if (!eventTap) {
        // Error handling here
        std::cerr << "Failed to create event tap!" << std::endl;
        return env.Null();
    }

    // Create a run loop source and add it to the current run loop
    CFRunLoopSourceRef runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, kCFRunLoopCommonModes);
    CFRelease(runLoopSource);

    // Start the event tap
    CGEventTapEnable(eventTap, true);

    return Napi::String::New(env, "Started mouse tracking");
}

// Addon initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startTracking", Napi::Function::New(env, StartTracking));
    return exports;
}

NODE_API_MODULE(addon, Init)
