use rand::seq::SliceRandom;
use rand::Rng;
use serde::{Deserialize, Serialize};

/// 大アルカナ 22 枚の名称 (id 0〜21)
pub const MAJOR_ARCANA_NAMES: [&str; 22] = [
    "The Fool",
    "The Magician",
    "The High Priestess",
    "The Empress",
    "The Emperor",
    "The Hierophant",
    "The Lovers",
    "The Chariot",
    "Strength",
    "The Hermit",
    "Wheel of Fortune",
    "Justice",
    "The Hanged Man",
    "Death",
    "Temperance",
    "The Devil",
    "The Tower",
    "The Star",
    "The Moon",
    "The Sun",
    "Judgement",
    "The World",
];

/// 小アルカナ各スートのランク名 (Ace〜King の 14 枚)
pub const MINOR_RANKS: [&str; 14] = [
    "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page",
    "Knight", "Queen", "King",
];

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Suit {
    Wands,
    Cups,
    Swords,
    Pentacles,
    MajorArcana,
}

impl Suit {
    /// 小アルカナのスート (デッキ内の並び順)
    pub const MINOR: [Suit; 4] = [Suit::Wands, Suit::Cups, Suit::Swords, Suit::Pentacles];
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Card {
    pub id: u8,
    pub name: String,
    pub suit: Suit,
    pub is_reversed: bool,
}

/// 78 枚のタロットデッキ。`cards[0]` が山札の一番上。
pub struct Deck {
    pub cards: Vec<Card>,
}

impl Default for Deck {
    fn default() -> Self {
        Self::new()
    }
}

impl Deck {
    /// 大アルカナ (id 0〜21) → Wands → Cups → Swords → Pentacles の順で、
    /// 全て正位置の 78 枚を生成する。
    pub fn new() -> Self {
        let majors = MAJOR_ARCANA_NAMES
            .iter()
            .map(|name| (name.to_string(), Suit::MajorArcana));
        let minors = Suit::MINOR.iter().flat_map(|&suit| {
            MINOR_RANKS
                .iter()
                .map(move |rank| (format!("{rank} of {suit:?}"), suit))
        });
        let cards = majors
            .chain(minors)
            .enumerate()
            .map(|(i, (name, suit))| Card {
                id: i as u8,
                name,
                suit,
                is_reversed: false,
            })
            .collect();
        Self { cards }
    }

    pub fn shuffle(&mut self) {
        self.shuffle_with_rng(&mut rand::thread_rng());
    }

    pub fn shuffle_with_rng<R: Rng + ?Sized>(&mut self, rng: &mut R) {
        self.cards.shuffle(rng);
    }

    /// 山札の一番上から 1 枚引き、50% の確率で逆位置にする。
    pub fn draw(&mut self) -> Option<Card> {
        self.draw_with_rng(&mut rand::thread_rng())
    }

    pub fn draw_with_rng<R: Rng + ?Sized>(&mut self, rng: &mut R) -> Option<Card> {
        if self.cards.is_empty() {
            return None;
        }
        let mut card = self.cards.remove(0);
        card.is_reversed = rng.gen_bool(0.5);
        Some(card)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::StdRng;
    use rand::SeedableRng;
    use std::collections::HashSet;

    #[test]
    fn test_deck_initialization() {
        let deck = Deck::new();
        // 78枚のカードが生成されること
        assert_eq!(deck.cards.len(), 78, "Deck should have 78 cards");
    }

    #[test]
    fn test_draw_card() {
        let mut deck = Deck::new();
        let initial_len = deck.cards.len();
        let card = deck.draw();
        assert!(card.is_some());
        assert_eq!(deck.cards.len(), initial_len - 1);
    }

    #[test]
    fn test_deck_has_22_major_and_14_per_minor_suit() {
        let deck = Deck::new();
        let count = |s: Suit| deck.cards.iter().filter(|c| c.suit == s).count();
        assert_eq!(count(Suit::MajorArcana), 22);
        for s in [Suit::Wands, Suit::Cups, Suit::Swords, Suit::Pentacles] {
            assert_eq!(count(s), 14, "{s:?} should have 14 cards");
        }
    }

    #[test]
    fn test_card_ids_are_unique_and_sequential() {
        let deck = Deck::new();
        let ids: Vec<u8> = deck.cards.iter().map(|c| c.id).collect();
        assert_eq!(ids, (0..78).collect::<Vec<u8>>());
    }

    #[test]
    fn test_card_names_are_unique_and_non_empty() {
        let deck = Deck::new();
        let names: HashSet<&str> = deck.cards.iter().map(|c| c.name.as_str()).collect();
        assert_eq!(names.len(), 78);
        assert!(deck.cards.iter().all(|c| !c.name.is_empty()));
    }

    #[test]
    fn test_known_card_names() {
        let deck = Deck::new();
        assert_eq!(deck.cards[0].name, "The Fool");
        assert_eq!(deck.cards[21].name, "The World");
        assert_eq!(deck.cards[22].name, "Ace of Wands");
        assert_eq!(deck.cards[35].name, "King of Wands");
        assert_eq!(deck.cards[36].name, "Ace of Cups");
        assert_eq!(deck.cards[50].name, "Ace of Swords");
        assert_eq!(deck.cards[77].name, "King of Pentacles");
    }

    #[test]
    fn test_new_deck_cards_are_upright() {
        let deck = Deck::new();
        assert!(deck.cards.iter().all(|c| !c.is_reversed));
    }

    #[test]
    fn test_default_equals_new() {
        assert_eq!(Deck::default().cards, Deck::new().cards);
    }

    #[test]
    fn test_shuffle_keeps_all_cards() {
        let mut deck = Deck::new();
        let mut rng = StdRng::seed_from_u64(42);
        deck.shuffle_with_rng(&mut rng);
        let mut ids: Vec<u8> = deck.cards.iter().map(|c| c.id).collect();
        assert_eq!(ids.len(), 78);
        ids.sort();
        assert_eq!(ids, (0..78).collect::<Vec<u8>>());
    }

    #[test]
    fn test_shuffle_changes_order() {
        let mut deck = Deck::new();
        let original: Vec<u8> = deck.cards.iter().map(|c| c.id).collect();
        let mut rng = StdRng::seed_from_u64(42);
        deck.shuffle_with_rng(&mut rng);
        let shuffled: Vec<u8> = deck.cards.iter().map(|c| c.id).collect();
        assert_ne!(original, shuffled);
    }

    #[test]
    fn test_shuffle_is_deterministic_with_same_seed() {
        let mut a = Deck::new();
        let mut b = Deck::new();
        a.shuffle_with_rng(&mut StdRng::seed_from_u64(7));
        b.shuffle_with_rng(&mut StdRng::seed_from_u64(7));
        assert_eq!(a.cards, b.cards);
    }

    #[test]
    fn test_shuffle_with_thread_rng_keeps_all_cards() {
        let mut deck = Deck::new();
        deck.shuffle();
        assert_eq!(deck.cards.len(), 78);
    }

    #[test]
    fn test_draw_takes_from_top() {
        let mut deck = Deck::new();
        let top_id = deck.cards[0].id;
        let card = deck.draw_with_rng(&mut StdRng::seed_from_u64(1)).unwrap();
        assert_eq!(card.id, top_id);
        assert!(deck.cards.iter().all(|c| c.id != top_id));
    }

    #[test]
    fn test_draw_from_empty_deck_returns_none() {
        let mut deck = Deck::new();
        let mut rng = StdRng::seed_from_u64(3);
        for _ in 0..78 {
            assert!(deck.draw_with_rng(&mut rng).is_some());
        }
        assert!(deck.draw_with_rng(&mut rng).is_none());
        assert!(deck.draw().is_none());
    }

    #[test]
    fn test_reversal_rate_is_about_half() {
        let mut rng = StdRng::seed_from_u64(2026);
        let trials = 10_000;
        let mut reversed = 0;
        for _ in 0..trials {
            let mut deck = Deck::new();
            if deck.draw_with_rng(&mut rng).unwrap().is_reversed {
                reversed += 1;
            }
        }
        let ratio = reversed as f64 / trials as f64;
        assert!((0.47..=0.53).contains(&ratio), "reversal ratio was {ratio}");
    }

    #[test]
    fn test_both_orientations_occur() {
        let mut deck = Deck::new();
        let mut rng = StdRng::seed_from_u64(99);
        let drawn: Vec<Card> = std::iter::from_fn(|| deck.draw_with_rng(&mut rng)).collect();
        assert!(drawn.iter().any(|c| c.is_reversed));
        assert!(drawn.iter().any(|c| !c.is_reversed));
    }

    #[test]
    fn test_card_serializes_to_json() {
        let card = Card {
            id: 0,
            name: "The Fool".into(),
            suit: Suit::MajorArcana,
            is_reversed: true,
        };
        let json = serde_json::to_string(&card).unwrap();
        assert_eq!(
            json,
            r#"{"id":0,"name":"The Fool","suit":"MajorArcana","is_reversed":true}"#
        );
        let back: Card = serde_json::from_str(&json).unwrap();
        assert_eq!(back, card);
    }
}
