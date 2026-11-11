use crate::tarot::{Card, Deck};
use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SpreadType {
    OneOracle,
    ThreeCard,
    CelticCross,
}

const ONE_ORACLE_POSITIONS: [&str; 1] = ["メッセージ"];
const THREE_CARD_POSITIONS: [&str; 3] = ["過去", "現在", "未来"];
const CELTIC_CROSS_POSITIONS: [&str; 10] = [
    "現状",
    "障害",
    "顕在意識",
    "潜在意識",
    "過去",
    "近未来",
    "本人の立場",
    "周囲の環境",
    "願望と恐れ",
    "最終結果",
];

impl SpreadType {
    /// 配置順に並んだ各ポジションの意味
    pub fn position_names(&self) -> &'static [&'static str] {
        match self {
            SpreadType::OneOracle => &ONE_ORACLE_POSITIONS,
            SpreadType::ThreeCard => &THREE_CARD_POSITIONS,
            SpreadType::CelticCross => &CELTIC_CROSS_POSITIONS,
        }
    }

    pub fn card_count(&self) -> usize {
        self.position_names().len()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DrawnCard {
    /// 0 始まりの配置番号
    pub position: usize,
    pub position_name: String,
    pub card: Card,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Reading {
    pub spread: SpreadType,
    pub cards: Vec<DrawnCard>,
}

pub fn perform_reading(spread: SpreadType) -> Reading {
    perform_reading_with_rng(spread, &mut rand::thread_rng())
}

/// 新しいデッキをシャッフルし、スプレッドの枚数だけ引いて配置する。
pub fn perform_reading_with_rng<R: Rng + ?Sized>(spread: SpreadType, rng: &mut R) -> Reading {
    let mut deck = Deck::new();
    deck.shuffle_with_rng(rng);
    let cards = spread
        .position_names()
        .iter()
        .enumerate()
        .map(|(position, name)| DrawnCard {
            position,
            position_name: name.to_string(),
            card: deck
                .draw_with_rng(rng)
                .expect("a 78-card deck always covers a spread"),
        })
        .collect();
    Reading { spread, cards }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::StdRng;
    use rand::SeedableRng;
    use std::collections::HashSet;

    const ALL: [SpreadType; 3] = [
        SpreadType::OneOracle,
        SpreadType::ThreeCard,
        SpreadType::CelticCross,
    ];

    #[test]
    fn test_card_counts() {
        assert_eq!(SpreadType::OneOracle.card_count(), 1);
        assert_eq!(SpreadType::ThreeCard.card_count(), 3);
        assert_eq!(SpreadType::CelticCross.card_count(), 10);
    }

    #[test]
    fn test_position_names_match_card_count() {
        for s in ALL {
            assert_eq!(s.position_names().len(), s.card_count(), "{s:?}");
        }
    }

    #[test]
    fn test_three_card_positions() {
        assert_eq!(
            SpreadType::ThreeCard.position_names(),
            &["過去", "現在", "未来"]
        );
    }

    #[test]
    fn test_celtic_cross_positions() {
        let p = SpreadType::CelticCross.position_names();
        assert_eq!(p[0], "現状");
        assert_eq!(p[1], "障害");
        assert_eq!(p[9], "最終結果");
    }

    #[test]
    fn test_reading_draws_correct_number_of_cards() {
        let mut rng = StdRng::seed_from_u64(1);
        for s in ALL {
            let r = perform_reading_with_rng(s, &mut rng);
            assert_eq!(r.spread, s);
            assert_eq!(r.cards.len(), s.card_count(), "{s:?}");
        }
    }

    #[test]
    fn test_reading_positions_are_ordered_and_named() {
        let r = perform_reading_with_rng(SpreadType::CelticCross, &mut StdRng::seed_from_u64(2));
        for (i, dc) in r.cards.iter().enumerate() {
            assert_eq!(dc.position, i);
            assert_eq!(dc.position_name, SpreadType::CelticCross.position_names()[i]);
        }
    }

    #[test]
    fn test_reading_has_no_duplicate_cards() {
        let mut rng = StdRng::seed_from_u64(3);
        for _ in 0..200 {
            let r = perform_reading_with_rng(SpreadType::CelticCross, &mut rng);
            let ids: HashSet<u8> = r.cards.iter().map(|dc| dc.card.id).collect();
            assert_eq!(ids.len(), 10);
        }
    }

    #[test]
    fn test_reading_is_shuffled() {
        // シャッフルしなければ常に The Fool (id 0) から始まってしまう
        let mut rng = StdRng::seed_from_u64(4);
        let firsts: HashSet<u8> = (0..50)
            .map(|_| perform_reading_with_rng(SpreadType::OneOracle, &mut rng).cards[0].card.id)
            .collect();
        assert!(firsts.len() > 10, "only {} distinct first cards", firsts.len());
    }

    #[test]
    fn test_reading_is_deterministic_with_same_seed() {
        let a = perform_reading_with_rng(SpreadType::CelticCross, &mut StdRng::seed_from_u64(5));
        let b = perform_reading_with_rng(SpreadType::CelticCross, &mut StdRng::seed_from_u64(5));
        assert_eq!(a, b);
    }

    #[test]
    fn test_perform_reading_with_thread_rng() {
        assert_eq!(perform_reading(SpreadType::ThreeCard).cards.len(), 3);
    }

    #[test]
    fn test_spread_type_serde_is_snake_case() {
        assert_eq!(
            serde_json::to_string(&SpreadType::CelticCross).unwrap(),
            r#""celtic_cross""#
        );
        let s: SpreadType = serde_json::from_str(r#""one_oracle""#).unwrap();
        assert_eq!(s, SpreadType::OneOracle);
    }
}
