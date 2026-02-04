//! Cross-platform active window detection for context-aware formatting.
//!
//! This module provides functionality to detect the currently active application
//! when the user triggers a recording. This information is used to automatically
//! select an appropriate formatting profile (e.g., Email, Chat, Code Editor).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActiveWindowInfo {
    pub window_title: String,
    pub app_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundle_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[cfg(target_os = "macos")]
pub fn get_active_window() -> Option<ActiveWindowInfo> {
    use std::process::Command;

    let script = r#"
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set appName to name of frontApp
            set bundleId to bundle identifier of frontApp
        end tell
        
        tell application appName
            try
                set windowTitle to name of front window
            on error
                set windowTitle to ""
            end try
        end tell
        
        return appName & "|||" & bundleId & "|||" & windowTitle
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if !output.status.success() {
        log::warn!("AppleScript execution failed");
        return None;
    }

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.split("|||").collect();

    if parts.len() >= 3 {
        let app_name = parts[0].to_string();
        let bundle_id = parts[1].to_string();
        let window_title = parts[2].to_string();

        let url = get_browser_url_if_applicable(&bundle_id);

        Some(ActiveWindowInfo {
            app_name,
            window_title,
            bundle_id: Some(bundle_id),
            process_name: None,
            url,
        })
    } else {
        None
    }
}

#[cfg(target_os = "macos")]
fn get_browser_url_if_applicable(bundle_id: &str) -> Option<String> {
    use std::process::Command;

    let browser_bundles = [
        "com.google.Chrome",
        "com.apple.Safari",
        "org.mozilla.firefox",
        "com.microsoft.edgemac",
        "com.brave.Browser",
        "com.operasoftware.Opera",
        "company.thebrowser.Browser",
    ];

    if !browser_bundles.iter().any(|b| bundle_id.contains(b)) {
        return None;
    }

    let script = match bundle_id {
        b if b.contains("Chrome") || b.contains("brave") || b.contains("edgemac") => {
            r#"tell application "Google Chrome" to get URL of active tab of front window"#
        }
        b if b.contains("Safari") => {
            r#"tell application "Safari" to get URL of current tab of front window"#
        }
        b if b.contains("firefox") => {
            return None;
        }
        _ => return None,
    };

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if output.status.success() {
        let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !url.is_empty() {
            return Some(url);
        }
    }

    None
}

#[cfg(target_os = "windows")]
pub fn get_active_window() -> Option<ActiveWindowInfo> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
    };

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        let mut title_buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title_buffer);
        let window_title = String::from_utf16_lossy(&title_buffer[..len as usize]);

        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));

        let process_name = get_process_name_windows(process_id);
        let app_name = process_name
            .as_ref()
            .map(|p| {
                std::path::Path::new(p)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(p)
                    .to_string()
            })
            .unwrap_or_default();

        Some(ActiveWindowInfo {
            window_title,
            app_name,
            bundle_id: None,
            process_name,
            url: None,
        })
    }
}

#[cfg(target_os = "windows")]
fn get_process_name_windows(process_id: u32) -> Option<String> {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows::Win32::Foundation::{CloseHandle, MAX_PATH};
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };

    unsafe {
        let process_handle =
            OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id).ok()?;

        let mut buffer = [0u16; MAX_PATH as usize];
        let mut size = buffer.len() as u32;

        let result = QueryFullProcessImageNameW(
            process_handle,
            PROCESS_NAME_WIN32,
            windows::core::PWSTR(buffer.as_mut_ptr()),
            &mut size,
        );

        let _ = CloseHandle(process_handle);

        if result.is_ok() {
            let path = OsString::from_wide(&buffer[..size as usize]);
            Some(path.to_string_lossy().to_string())
        } else {
            None
        }
    }
}

#[cfg(target_os = "linux")]
pub fn get_active_window() -> Option<ActiveWindowInfo> {
    use std::process::Command;

    if std::env::var("WAYLAND_DISPLAY").is_ok() {
        return get_active_window_wayland();
    }

    let window_name_output = Command::new("xdotool")
        .args(["getactivewindow", "getwindowname"])
        .output()
        .ok()?;

    let window_title = String::from_utf8_lossy(&window_name_output.stdout)
        .trim()
        .to_string();

    let pid_output = Command::new("xdotool")
        .args(["getactivewindow", "getwindowpid"])
        .output()
        .ok()?;

    let pid = String::from_utf8_lossy(&pid_output.stdout).trim().to_string();
    let process_name = get_process_name_from_pid_linux(&pid);

    let app_name = process_name
        .as_ref()
        .map(|p| {
            std::path::Path::new(p)
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or(p)
                .to_string()
        })
        .unwrap_or_default();

    Some(ActiveWindowInfo {
        window_title,
        app_name,
        bundle_id: None,
        process_name,
        url: None,
    })
}

#[cfg(target_os = "linux")]
fn get_active_window_wayland() -> Option<ActiveWindowInfo> {
    use std::process::Command;

    let output = Command::new("kdotool").arg("getactivewindow").output();

    if let Ok(output) = output {
        if output.status.success() {
            let window_id = String::from_utf8_lossy(&output.stdout).trim().to_string();

            let name_output = Command::new("kdotool")
                .args(["getwindowname", &window_id])
                .output()
                .ok()?;

            let window_title = String::from_utf8_lossy(&name_output.stdout)
                .trim()
                .to_string();

            return Some(ActiveWindowInfo {
                window_title: window_title.clone(),
                app_name: window_title,
                bundle_id: None,
                process_name: None,
                url: None,
            });
        }
    }

    let hypr_output = Command::new("hyprctl").args(["activewindow", "-j"]).output();

    if let Ok(output) = hypr_output {
        if output.status.success() {
            let json_str = String::from_utf8_lossy(&output.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
                let window_title = json
                    .get("title")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let app_name = json
                    .get("class")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                return Some(ActiveWindowInfo {
                    window_title,
                    app_name,
                    bundle_id: None,
                    process_name: None,
                    url: None,
                });
            }
        }
    }

    None
}

#[cfg(target_os = "linux")]
fn get_process_name_from_pid_linux(pid: &str) -> Option<String> {
    use std::fs;

    let comm_path = format!("/proc/{pid}/comm");
    fs::read_to_string(comm_path)
        .ok()
        .map(|s| s.trim().to_string())
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
pub fn get_active_window() -> Option<ActiveWindowInfo> {
    log::warn!("Active window detection not supported on this platform");
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_active_window_info_serialization() {
        let info = ActiveWindowInfo {
            window_title: "Test Window".to_string(),
            app_name: "TestApp".to_string(),
            bundle_id: Some("com.test.app".to_string()),
            process_name: None,
            url: Some("https://example.com".to_string()),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("window_title"));
        assert!(json.contains("Test Window"));
        assert!(!json.contains("process_name"));
    }
}
