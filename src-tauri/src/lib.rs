pub mod card_images;
pub mod commands;
pub mod history;
pub mod spread;
pub mod tarot;

/// フロントエンドへ公開するコマンドを登録する (本番・テスト共通)。
pub fn register_commands<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        commands::draw_reading,
        commands::card_images,
        commands::list_history,
        commands::delete_history,
        commands::clear_history,
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    register_commands(tauri::Builder::default())
        .setup(|app| {
            use tauri::Manager;
            // macOS: ~/Library/Application Support/com.toshiaki.arcanadesk/
            //   history.json … 占い履歴
            //   cards/NN.png … カードのドット絵 (各自で用意)
            let data_dir = app.path().app_data_dir()?;
            app.manage(commands::AppState::new(
                data_dir.join("history.json"),
                data_dir.join("cards"),
            ));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
