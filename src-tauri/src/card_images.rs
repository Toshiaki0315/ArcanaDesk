//! カードのドット絵を、起動時にフォルダから読み込む。
//!
//! 画像はリポジトリにもアプリにも含めず、使う人がアプリのデータフォルダの
//! `cards/NN.png` (NN はカード id) に置く。入れ替えたらアプリを起動し直すだけで反映される。

use base64::{engine::general_purpose::STANDARD, Engine};
use std::path::Path;

pub const CARD_COUNT: usize = 78;
/// これより大きいファイルは画像として扱わない (誤って置いた巨大なファイルを読まないため)
pub const MAX_IMAGE_BYTES: u64 = 1024 * 1024;

const PNG_SIGNATURE: [u8; 8] = [0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a];

/// カード id に対応するファイル名 (`00.png`〜`77.png`)。
pub fn card_image_file_name(id: usize) -> String {
    format!("{id:02}.png")
}

/// フォルダから 78 枚分の画像を読み、PNG として正しいものを data URL で返す。
/// 無い・読めない・PNG でない・大きすぎるものは None (その札は簡易版の絵になる)。
pub fn load_card_images(dir: &Path) -> Vec<Option<String>> {
    (0..CARD_COUNT)
        .map(|id| load_one(&dir.join(card_image_file_name(id))))
        .collect()
}

fn load_one(path: &Path) -> Option<String> {
    let meta = std::fs::metadata(path).ok()?;
    if !meta.is_file() || meta.len() > MAX_IMAGE_BYTES {
        return None;
    }
    let bytes = std::fs::read(path).ok()?;
    if !bytes.starts_with(&PNG_SIGNATURE) {
        return None;
    }
    Some(format!("data:image/png;base64,{}", STANDARD.encode(bytes)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::{engine::general_purpose::STANDARD, Engine};
    use tempfile::TempDir;

    const PNG: &[u8] = &[0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4];

    fn write(dir: &TempDir, name: &str, bytes: &[u8]) {
        std::fs::write(dir.path().join(name), bytes).unwrap();
    }

    fn decode(url: &str) -> Vec<u8> {
        let b64 = url
            .strip_prefix("data:image/png;base64,")
            .expect("data URL prefix");
        STANDARD.decode(b64).unwrap()
    }

    #[test]
    fn test_file_names_are_zero_padded_ids() {
        assert_eq!(card_image_file_name(0), "00.png");
        assert_eq!(card_image_file_name(7), "07.png");
        assert_eq!(card_image_file_name(77), "77.png");
    }

    #[test]
    fn test_missing_folder_gives_no_images() {
        let dir = TempDir::new().unwrap();
        let images = load_card_images(&dir.path().join("does-not-exist"));
        assert_eq!(images.len(), CARD_COUNT);
        assert!(images.iter().all(Option::is_none));
    }

    #[test]
    fn test_loads_only_the_cards_that_have_images() {
        let dir = TempDir::new().unwrap();
        write(&dir, "00.png", PNG);
        write(&dir, "36.png", PNG);
        let images = load_card_images(dir.path());
        assert_eq!(images.len(), CARD_COUNT);
        let present: Vec<usize> = (0..CARD_COUNT).filter(|&i| images[i].is_some()).collect();
        assert_eq!(present, vec![0, 36]);
    }

    #[test]
    fn test_returns_the_file_contents_as_a_png_data_url() {
        let dir = TempDir::new().unwrap();
        write(&dir, "21.png", PNG);
        let url = load_card_images(dir.path())[21].clone().unwrap();
        assert_eq!(decode(&url), PNG);
    }

    #[test]
    fn test_ignores_files_that_are_not_png() {
        let dir = TempDir::new().unwrap();
        write(&dir, "01.png", b"not really a png");
        write(&dir, "02.png", b"");
        let images = load_card_images(dir.path());
        assert!(images[1].is_none());
        assert!(images[2].is_none());
    }

    #[test]
    fn test_ignores_files_that_are_too_large() {
        let dir = TempDir::new().unwrap();
        let mut big = PNG.to_vec();
        big.resize(MAX_IMAGE_BYTES as usize + 1, 0);
        write(&dir, "03.png", &big);
        assert!(load_card_images(dir.path())[3].is_none());
    }

    #[test]
    fn test_ignores_a_directory_with_an_image_name() {
        let dir = TempDir::new().unwrap();
        std::fs::create_dir(dir.path().join("04.png")).unwrap();
        assert!(load_card_images(dir.path())[4].is_none());
    }

    #[test]
    fn test_ignores_unrelated_files() {
        let dir = TempDir::new().unwrap();
        write(&dir, "78.png", PNG);
        write(&dir, "fool.png", PNG);
        assert!(load_card_images(dir.path()).iter().all(Option::is_none));
    }

    #[cfg(unix)]
    #[test]
    fn test_ignores_unreadable_files() {
        use std::os::unix::fs::PermissionsExt;
        let dir = TempDir::new().unwrap();
        write(&dir, "05.png", PNG);
        let path = dir.path().join("05.png");
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o000)).unwrap();
        let images = load_card_images(dir.path());
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o644)).unwrap();
        assert!(images[5].is_none());
    }
}
