#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, path::PathBuf};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

const PREFERENCES_FILE: &str = "preferences.json";

#[derive(Debug, Serialize, Deserialize)]
struct Preferences {
    model: String,
    prompt: String,
    #[serde(rename = "apiKey")]
    api_key: String,
}

#[tauri::command]
async fn load_preferences(app_handle: AppHandle) -> Result<Option<Preferences>, String> {
    let path = resolve_preferences_path(&app_handle)?;
    if !path.exists() {
        return Ok(None);
    }

    let data = fs::read_to_string(path).map_err(map_io_err)?;
    let prefs: Preferences = serde_json::from_str(&data).map_err(map_json_err)?;
    Ok(Some(prefs))
}

#[tauri::command]
async fn save_preferences(
    preferences: Preferences,
    app_handle: AppHandle,
) -> Result<(), String> {
    let path = resolve_preferences_path(&app_handle)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(map_io_err)?;
    }

    let payload = serde_json::to_string_pretty(&preferences).map_err(map_json_err)?;
    fs::write(path, payload).map_err(map_io_err)?;
    Ok(())
}

fn resolve_preferences_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Unable to resolve app data directory".to_string())?;
    dir.push(PREFERENCES_FILE);
    Ok(dir)
}

fn map_io_err(error: std::io::Error) -> String {
    error.to_string()
}

fn map_json_err(error: serde_json::Error) -> String {
    error.to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_preferences, save_preferences])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
