//! 占い履歴のローカル保存 (JSON ファイル)。

use crate::spread::Reading;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HistoryEntry {
    pub id: u64,
    /// UNIX エポックからのミリ秒
    pub created_at: u64,
    pub reading: Reading,
}

#[derive(Debug)]
pub enum HistoryError {
    Io(std::io::Error),
    Corrupted(serde_json::Error),
}

impl fmt::Display for HistoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            HistoryError::Io(e) => write!(f, "履歴ファイルの読み書きに失敗しました: {e}"),
            HistoryError::Corrupted(e) => write!(f, "履歴ファイルが壊れています: {e}"),
        }
    }
}

impl std::error::Error for HistoryError {}

/// ファイル全体の形式。`next_id` を持つことで削除後も id を再利用しない。
#[derive(Debug, Default, Serialize, Deserialize)]
struct HistoryFile {
    next_id: u64,
    entries: Vec<HistoryEntry>,
}

/// 履歴を 1 つの JSON ファイルに保存するストア。
pub struct HistoryStore {
    path: PathBuf,
}

impl HistoryStore {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// 新しい順に全件返す。
    pub fn list(&self) -> Result<Vec<HistoryEntry>, HistoryError> {
        let mut entries = self.load()?.entries;
        entries.sort_by(|a, b| b.created_at.cmp(&a.created_at).then(b.id.cmp(&a.id)));
        Ok(entries)
    }

    pub fn add(&self, reading: Reading, created_at: u64) -> Result<HistoryEntry, HistoryError> {
        let mut file = self.load()?;
        let entry = HistoryEntry {
            id: file.next_id,
            created_at,
            reading,
        };
        file.next_id += 1;
        file.entries.push(entry.clone());
        self.save(&file)?;
        Ok(entry)
    }

    /// 削除できたら true、該当 id が無ければ false。
    pub fn delete(&self, id: u64) -> Result<bool, HistoryError> {
        let mut file = self.load()?;
        let before = file.entries.len();
        file.entries.retain(|e| e.id != id);
        if file.entries.len() == before {
            return Ok(false);
        }
        self.save(&file)?;
        Ok(true)
    }

    pub fn clear(&self) -> Result<(), HistoryError> {
        let mut file = self.load()?;
        file.entries.clear();
        self.save(&file)
    }

    fn load(&self) -> Result<HistoryFile, HistoryError> {
        match std::fs::read_to_string(&self.path) {
            Ok(text) => serde_json::from_str(&text).map_err(HistoryError::Corrupted),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(HistoryFile::default()),
            Err(e) => Err(HistoryError::Io(e)),
        }
    }

    /// 一時ファイルに書いてから rename し、書き込み途中で壊れないようにする。
    fn save(&self, file: &HistoryFile) -> Result<(), HistoryError> {
        if let Some(dir) = self.path.parent() {
            std::fs::create_dir_all(dir).map_err(HistoryError::Io)?;
        }
        let json = serde_json::to_string_pretty(file).expect("history is always serializable");
        let tmp = self.path.with_extension("json.tmp");
        std::fs::write(&tmp, json).map_err(HistoryError::Io)?;
        std::fs::rename(&tmp, &self.path).map_err(HistoryError::Io)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::spread::{perform_reading_with_rng, SpreadType};
    use rand::rngs::StdRng;
    use rand::SeedableRng;
    use tempfile::TempDir;

    fn reading(seed: u64) -> Reading {
        perform_reading_with_rng(SpreadType::ThreeCard, &mut StdRng::seed_from_u64(seed))
    }

    fn store() -> (TempDir, HistoryStore) {
        let dir = TempDir::new().unwrap();
        let store = HistoryStore::new(dir.path().join("history.json"));
        (dir, store)
    }

    #[test]
    fn test_list_is_empty_when_file_does_not_exist() {
        let (_dir, store) = store();
        assert!(store.list().unwrap().is_empty());
        assert!(!store.path().exists());
    }

    #[test]
    fn test_add_persists_entry_to_file() {
        let (_dir, store) = store();
        let entry = store.add(reading(1), 1_700_000_000_000).unwrap();
        assert_eq!(entry.created_at, 1_700_000_000_000);
        assert_eq!(entry.reading, reading(1));
        assert!(store.path().exists());

        // 別インスタンスから読んでも同じ内容 (= ディスクに保存されている)
        let reopened = HistoryStore::new(store.path());
        assert_eq!(reopened.list().unwrap(), vec![entry]);
    }

    #[test]
    fn test_add_creates_missing_parent_directories() {
        let dir = TempDir::new().unwrap();
        let store = HistoryStore::new(dir.path().join("nested/deeper/history.json"));
        store.add(reading(1), 1).unwrap();
        assert_eq!(store.list().unwrap().len(), 1);
    }

    #[test]
    fn test_ids_are_unique_and_increasing() {
        let (_dir, store) = store();
        let a = store.add(reading(1), 10).unwrap();
        let b = store.add(reading(2), 20).unwrap();
        let c = store.add(reading(3), 30).unwrap();
        assert!(a.id < b.id && b.id < c.id);
    }

    #[test]
    fn test_ids_are_not_reused_after_deleting_the_newest() {
        let (_dir, store) = store();
        store.add(reading(1), 10).unwrap();
        let b = store.add(reading(2), 20).unwrap();
        store.delete(b.id).unwrap();
        let c = store.add(reading(3), 30).unwrap();
        assert!(c.id > b.id, "id {} was reused", c.id);
    }

    #[test]
    fn test_list_returns_newest_first() {
        let (_dir, store) = store();
        store.add(reading(1), 10).unwrap();
        store.add(reading(2), 30).unwrap();
        store.add(reading(3), 20).unwrap();
        let times: Vec<u64> = store.list().unwrap().iter().map(|e| e.created_at).collect();
        assert_eq!(times, vec![30, 20, 10]);
    }

    #[test]
    fn test_delete_removes_only_the_matching_entry() {
        let (_dir, store) = store();
        let a = store.add(reading(1), 10).unwrap();
        let b = store.add(reading(2), 20).unwrap();
        assert!(store.delete(a.id).unwrap());
        assert_eq!(store.list().unwrap(), vec![b]);
    }

    #[test]
    fn test_delete_unknown_id_returns_false() {
        let (_dir, store) = store();
        store.add(reading(1), 10).unwrap();
        assert!(!store.delete(999).unwrap());
        assert_eq!(store.list().unwrap().len(), 1);
    }

    #[test]
    fn test_clear_removes_everything() {
        let (_dir, store) = store();
        store.add(reading(1), 10).unwrap();
        store.add(reading(2), 20).unwrap();
        store.clear().unwrap();
        assert!(store.list().unwrap().is_empty());
    }

    #[test]
    fn test_clear_on_missing_file_is_ok() {
        let (_dir, store) = store();
        store.clear().unwrap();
        assert!(store.list().unwrap().is_empty());
    }

    #[test]
    fn test_corrupted_file_is_reported_and_left_untouched() {
        let (_dir, store) = store();
        std::fs::write(store.path(), "{ not json").unwrap();
        assert!(matches!(store.list(), Err(HistoryError::Corrupted(_))));
        // 壊れたファイルを黙って上書きしない
        assert!(matches!(
            store.add(reading(1), 1),
            Err(HistoryError::Corrupted(_))
        ));
        assert_eq!(std::fs::read_to_string(store.path()).unwrap(), "{ not json");
    }

    #[test]
    fn test_io_error_is_reported() {
        let (dir, _) = store();
        // ディレクトリをファイルとして読もうとすると I/O エラー
        let store = HistoryStore::new(dir.path());
        assert!(matches!(store.list(), Err(HistoryError::Io(_))));
    }

    #[test]
    fn test_no_temp_file_left_behind_after_write() {
        let (dir, store) = store();
        store.add(reading(1), 1).unwrap();
        let files: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .map(|e| e.unwrap().file_name())
            .collect();
        assert_eq!(files, vec![std::ffi::OsString::from("history.json")]);
    }

    #[test]
    fn test_error_messages_are_japanese() {
        let io = HistoryError::Io(std::io::Error::other("boom"));
        assert!(io.to_string().starts_with("履歴ファイルの読み書きに失敗しました"));
        let bad = HistoryError::Corrupted(serde_json::from_str::<u8>("x").unwrap_err());
        assert!(bad.to_string().starts_with("履歴ファイルが壊れています"));
    }

    #[test]
    fn test_entry_json_shape() {
        let entry = HistoryEntry {
            id: 7,
            created_at: 42,
            reading: reading(1),
        };
        let json = serde_json::to_value(&entry).unwrap();
        assert_eq!(json["id"], 7);
        assert_eq!(json["created_at"], 42);
        assert_eq!(json["reading"]["spread"], "three_card");
    }
}
