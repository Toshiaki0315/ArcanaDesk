use crate::history::{HistoryEntry, HistoryStore};
use crate::spread::{perform_reading, Reading, SpreadType};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// コマンド間で共有する状態。履歴ファイルの読み書きは Mutex で直列化する。
pub struct AppState {
    pub history: Mutex<HistoryStore>,
}

impl AppState {
    pub fn new(history_path: impl Into<PathBuf>) -> Self {
        Self {
            history: Mutex::new(HistoryStore::new(history_path)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DrawResult {
    pub reading: Reading,
    /// 履歴保存に失敗した場合のメッセージ (占い自体は成功している)
    pub history_error: Option<String>,
}

pub fn now_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("system clock is before 1970")
        .as_millis() as u64
}

fn with_history<T>(
    state: &State<'_, AppState>,
    f: impl FnOnce(&HistoryStore) -> Result<T, crate::history::HistoryError>,
) -> Result<T, String> {
    let store = state.history.lock().unwrap_or_else(|e| e.into_inner());
    f(&store).map_err(|e| e.to_string())
}

/// フロントエンドから `invoke("draw_reading", { spread })` で呼ばれる。
/// 結果は履歴に自動保存する。保存に失敗しても占い結果は返す。
#[tauri::command]
pub fn draw_reading(spread: SpreadType, state: State<'_, AppState>) -> DrawResult {
    let reading = perform_reading(spread);
    let history_error = with_history(&state, |h| h.add(reading.clone(), now_millis())).err();
    DrawResult {
        reading,
        history_error,
    }
}

#[tauri::command]
pub fn list_history(state: State<'_, AppState>) -> Result<Vec<HistoryEntry>, String> {
    with_history(&state, |h| h.list())
}

#[tauri::command]
pub fn delete_history(id: u64, state: State<'_, AppState>) -> Result<bool, String> {
    with_history(&state, |h| h.delete(id))
}

#[tauri::command]
pub fn clear_history(state: State<'_, AppState>) -> Result<(), String> {
    with_history(&state, |h| h.clear())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};
    use tauri::ipc::{CallbackFn, InvokeBody};
    use tauri::test::{
        get_ipc_response, mock_builder, mock_context, noop_assets, MockRuntime, INVOKE_KEY,
    };
    use tauri::webview::InvokeRequest;
    use tauri::{App, Manager, WebviewWindow};
    use tempfile::TempDir;

    struct Harness {
        _app: App<MockRuntime>,
        webview: WebviewWindow<MockRuntime>,
        dir: TempDir,
    }

    impl Harness {
        fn new() -> Self {
            let dir = TempDir::new().unwrap();
            Self::with_history_path(dir, |d| d.path().join("history.json"))
        }

        fn with_history_path(dir: TempDir, path: impl Fn(&TempDir) -> PathBuf) -> Self {
            let app = crate::register_commands(mock_builder())
                .manage(AppState::new(path(&dir)))
                .build(mock_context(noop_assets()))
                .expect("failed to build mock app");
            let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
                .build()
                .expect("failed to build webview");
            Self {
                _app: app,
                webview,
                dir,
            }
        }

        fn invoke(&self, cmd: &str, body: Value) -> Result<Value, Value> {
            get_ipc_response(
                &self.webview,
                InvokeRequest {
                    cmd: cmd.into(),
                    callback: CallbackFn(0),
                    error: CallbackFn(1),
                    // アプリ内 (ローカル) オリジン。リモート扱いだと ACL で拒否される
                    url: if cfg!(any(windows, target_os = "android")) {
                        "http://tauri.localhost"
                    } else {
                        "tauri://localhost"
                    }
                    .parse()
                    .unwrap(),
                    body: InvokeBody::Json(body),
                    headers: Default::default(),
                    invoke_key: INVOKE_KEY.to_string(),
                },
            )
            .map(|res| res.deserialize::<Value>().unwrap())
        }

        fn draw(&self, spread: &str) -> DrawResult {
            serde_json::from_value(
                self.invoke("draw_reading", json!({ "spread": spread }))
                    .unwrap(),
            )
            .unwrap()
        }

        fn history(&self) -> Vec<HistoryEntry> {
            serde_json::from_value(self.invoke("list_history", json!({})).unwrap()).unwrap()
        }

        fn state(&self) -> State<'_, AppState> {
            self.webview.state::<AppState>()
        }
    }

    #[test]
    fn test_now_millis_is_a_plausible_timestamp() {
        // 2024-01-01 以降であること
        assert!(now_millis() > 1_704_067_200_000);
    }

    #[test]
    fn test_draw_reading_returns_cards_for_each_spread() {
        let h = Harness::new();
        for (spread, n) in [
            (SpreadType::OneOracle, 1),
            (SpreadType::ThreeCard, 3),
            (SpreadType::CelticCross, 10),
        ] {
            let r = draw_reading(spread, h.state());
            assert_eq!(r.reading.spread, spread);
            assert_eq!(r.reading.cards.len(), n);
            assert_eq!(r.history_error, None);
        }
    }

    #[test]
    fn test_draw_result_json_contract() {
        // TypeScript 側の型定義 (src/api.ts) と一致させること
        let h = Harness::new();
        let json = serde_json::to_value(draw_reading(SpreadType::OneOracle, h.state())).unwrap();
        assert_eq!(json["history_error"], Value::Null);
        assert_eq!(json["reading"]["spread"], "one_oracle");
        let dc = &json["reading"]["cards"][0];
        assert_eq!(dc["position"], 0);
        assert_eq!(dc["position_name"], "メッセージ");
        for key in ["id", "name", "suit", "is_reversed"] {
            assert!(dc["card"].get(key).is_some(), "card.{key} missing");
        }
    }

    #[test]
    fn test_invoke_draw_reading_via_ipc() {
        let h = Harness::new();
        let r = h.draw("celtic_cross");
        assert_eq!(r.reading.spread, SpreadType::CelticCross);
        assert_eq!(r.reading.cards.len(), 10);
    }

    #[test]
    fn test_invoke_with_unknown_spread_is_an_error() {
        let err = Harness::new()
            .invoke("draw_reading", json!({ "spread": "pentagram" }))
            .unwrap_err();
        assert!(err.to_string().contains("unknown variant"), "{err}");
    }

    #[test]
    fn test_invoke_without_spread_is_an_error() {
        let err = Harness::new()
            .invoke("draw_reading", json!({}))
            .unwrap_err();
        assert!(
            err.to_string().contains("missing required key spread"),
            "{err}"
        );
    }

    #[test]
    fn test_draw_saves_reading_to_history() {
        let h = Harness::new();
        let first = h.draw("one_oracle");
        let second = h.draw("three_card");
        let history = h.history();
        assert_eq!(history.len(), 2);
        // 新しい順
        assert_eq!(history[0].reading, second.reading);
        assert_eq!(history[1].reading, first.reading);
        assert!(history[0].created_at > 1_704_067_200_000);
        assert!(h.dir.path().join("history.json").exists());
    }

    #[test]
    fn test_draw_still_succeeds_when_history_cannot_be_saved() {
        let dir = TempDir::new().unwrap();
        std::fs::write(dir.path().join("history.json"), "broken").unwrap();
        let h = Harness::with_history_path(dir, |d| d.path().join("history.json"));
        let r = h.draw("three_card");
        assert_eq!(r.reading.cards.len(), 3);
        let msg = r.history_error.expect("history error should be reported");
        assert!(msg.contains("履歴ファイルが壊れています"), "{msg}");
    }

    #[test]
    fn test_list_history_reports_errors() {
        let dir = TempDir::new().unwrap();
        std::fs::write(dir.path().join("history.json"), "broken").unwrap();
        let h = Harness::with_history_path(dir, |d| d.path().join("history.json"));
        let err = h.invoke("list_history", json!({})).unwrap_err();
        assert!(
            err.to_string().contains("履歴ファイルが壊れています"),
            "{err}"
        );
    }

    #[test]
    fn test_delete_history_via_ipc() {
        let h = Harness::new();
        h.draw("one_oracle");
        h.draw("one_oracle");
        let target = h.history()[0].id;

        assert_eq!(
            h.invoke("delete_history", json!({ "id": target })).unwrap(),
            json!(true)
        );
        assert_eq!(
            h.invoke("delete_history", json!({ "id": target })).unwrap(),
            json!(false)
        );
        let remaining = h.history();
        assert_eq!(remaining.len(), 1);
        assert_ne!(remaining[0].id, target);
    }

    #[test]
    fn test_clear_history_via_ipc() {
        let h = Harness::new();
        h.draw("one_oracle");
        h.draw("celtic_cross");
        assert_eq!(h.invoke("clear_history", json!({})).unwrap(), Value::Null);
        assert!(h.history().is_empty());
    }

    #[test]
    fn test_write_errors_are_reported_by_delete_and_clear() {
        let dir = TempDir::new().unwrap();
        // 履歴パスがディレクトリ → 読み込みで I/O エラー
        let h = Harness::with_history_path(dir, |d| d.path().to_path_buf());
        assert!(h.invoke("delete_history", json!({ "id": 1 })).is_err());
        assert!(h.invoke("clear_history", json!({})).is_err());
    }
}
