use std::any::Any;

trait Post: Any {
}

pub struct DraftPost {
    content: String,
}

impl Post for DraftPost {}

impl DraftPost {
    pub fn new() -> DraftPost {
        DraftPost {
            content: String::new(),
        }
    }

    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    pub fn request_review(self) -> PendingReviewPost {
        PendingReviewPost {
            content: self.content,
            approval_count: 0
        }
    }
}

pub struct PendingReviewPost {
    content: String,
    approval_count: u8
}

impl Post for PendingReviewPost {}

impl PendingReviewPost {
    pub fn approve(self) -> Box<dyn Any> {
        if self.approval_count == 1 {
            Box::new(PublishedPost {
                content: self.content
            })
        } else {
            Box::new(PendingReviewPost {
                content: self.content,
                approval_count: self.approval_count + 1
            })
        }
    }

    pub fn reject(self) -> DraftPost {
        DraftPost { content: self.content }
    }
}

pub struct PublishedPost {
    content: String,
}

impl Post for PublishedPost {}

impl PublishedPost {
    pub fn content(&self) -> &str {
        &self.content
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_allow_to_request_review_and_approve_post() {
        let mut draft = DraftPost::new();

        draft.add_text("I ate a salad for lunch today");
        assert_eq!(draft.content, "I ate a salad for lunch today");

        let mut in_review = draft.request_review();
        assert_eq!(in_review.content, "I ate a salad for lunch today");

        in_review = *in_review.approve().downcast::<PendingReviewPost>().unwrap();
        let published = *in_review.approve().downcast::<PublishedPost>().unwrap();
        assert_eq!("I ate a salad for lunch today", published.content());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        let mut draft = DraftPost::new();

        draft.add_text("And fish for dinner");
        assert_eq!(draft.content, "And fish for dinner");

        let in_review = draft.request_review();
        assert_eq!(in_review.content, "And fish for dinner");

        draft = in_review.reject();
        assert_eq!(draft.content, "And fish for dinner");
    }
}