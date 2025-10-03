use tauri_plugin_dialog::{DialogExt, FilePath};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ファイル保存コマンド（システム制限を回避）
#[tauri::command]
async fn save_markdown_file(
    app_handle: tauri::AppHandle,
    content: String,
    filename: String,
) -> Result<String, String> {
    use std::sync::mpsc;
    let (tx, rx) = mpsc::channel();

    // 保存ダイアログを表示
    app_handle
        .dialog()
        .file()
        .set_title("付箋レポートを保存")
        .set_file_name(&filename)
        .add_filter("Markdown", &["md"])
        .add_filter("すべてのファイル", &["*"])
        .save_file(move |file_path| {
            tx.send(file_path).ok();
        });

    let file_path = rx
        .recv()
        .map_err(|_| "ファイルパスの受信に失敗しました".to_string())?;

    match file_path {
        Some(FilePath::Url(url)) => {
            let path = url
                .to_file_path()
                .map_err(|_| "無効なファイルパスです".to_string())?;
            std::fs::write(&path, content)
                .map_err(|e| format!("ファイルの保存に失敗しました: {}", e))?;
            Ok(path.to_string_lossy().to_string())
        }
        Some(FilePath::Path(path)) => {
            std::fs::write(&path, content)
                .map_err(|e| format!("ファイルの保存に失敗しました: {}", e))?;
            Ok(path.to_string_lossy().to_string())
        }
        None => Err("保存がキャンセルされました".to_string()),
    }
}

// ディレクトリ選択コマンド
#[tauri::command]
async fn select_directory(app_handle: tauri::AppHandle) -> Result<String, String> {
    use std::sync::mpsc;
    let (tx, rx) = mpsc::channel();

    app_handle
        .dialog()
        .file()
        .set_title("保存先フォルダを選択")
        .pick_folder(move |dir_path| {
            tx.send(dir_path).ok();
        });

    let dir_path = rx
        .recv()
        .map_err(|_| "ディレクトリパスの受信に失敗しました".to_string())?;

    match dir_path {
        Some(FilePath::Url(url)) => {
            let path = url
                .to_file_path()
                .map_err(|_| "無効なディレクトリパスです".to_string())?;
            Ok(path.to_string_lossy().to_string())
        }
        Some(FilePath::Path(path)) => Ok(path.to_string_lossy().to_string()),
        None => Err("フォルダ選択がキャンセルされました".to_string()),
    }
}

// ファイルを指定パスに保存
#[tauri::command]
async fn write_file_to_path(file_path: String, content: String) -> Result<String, String> {
    match std::fs::write(&file_path, content) {
        Ok(_) => Ok(format!("ファイルを保存しました: {}", file_path)),
        Err(e) => Err(format!("ファイルの保存に失敗しました: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_markdown_file,
            select_directory,
            write_file_to_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
