use anyhow::{ Error, anyhow };

pub struct Post {
    state: State,
    content: String,
}

impl Post {
    pub fn new() -> Post {
        Post {
            state: State::Draft,
            content: String::new(),
        }
    }

    pub fn add_text(&mut self, text: &str) -> Result<(), Error> {
        if self.state.can_add_text() {
            self.content.push_str(text);
            Ok(())
        } else {
            Err(anyhow!("Cannot add text in current state"))
        }
    }

    pub fn request_review(&mut self) -> Result<(), Error> {
        self.state = self.state.request_review()?;
        Ok(())
    }

    pub fn approve(&mut self) -> Result<(), Error> {
        self.state = self.state.approve()?;
        Ok(())
    }

    pub fn reject(&mut self) -> Result<(), Error> {
        self.state = self.state.reject()?;
        Ok(())
    }

    pub fn content(&self) -> &str {
        self.state.content(self)
    }
}

#[derive(Debug, PartialEq)]
enum State {
    Draft,
    PendingReview {
        approval_count: u8
    },
    Published
}

impl State {
    fn request_review(&self) -> Result<State, Error> {
        match self {
            &State::Draft => {
                Ok(State::PendingReview { approval_count: 0})
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'pending_review'", self))
        }
    }
    fn approve(&self) -> Result<State, Error> {
        match self {
            &State::PendingReview { approval_count } => {
                let updated_approval_count = approval_count + 1;
                if updated_approval_count >= 2 {
                    Ok(State::Published {})
                } else {
                    Ok(State::PendingReview { approval_count: updated_approval_count })
                }
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'published'", self))
        }
    }
    fn reject(&self) -> Result<State, Error> {
        match self {
            &State::PendingReview { approval_count: _ } => {
                Ok(State::Draft)
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'draft'", self))
        }
    }
    fn can_add_text(&self) -> bool {
        match self {
            &State::Draft => {
                true
            },
            _ => false
        }
    }
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        match self {
            &State::Published => {
                &post.content
            },
            _ =>
                ""
        }
    }
    fn name(&self) -> String {
        (match self {
            &State::Draft => {
                "draft"
            },
            &State::PendingReview { approval_count: _ } => {
                "pending_review"
            },
            &State::Published => {
                "published"
            }
        }).to_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::Post;

    #[test]
    fn should_allow_to_request_review_and_approve_post() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.name());

        post.approve().unwrap();
        post.approve().unwrap();
        assert_eq!("I ate a salad for lunch today", post.content());
        assert_eq!("published", post.state.name());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        let mut post = Post::new();

        post.add_text("And fish for dinner").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.name());

        post.reject().unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());
    }

    #[test]
    fn requires_two_calls_to_approve_to_transition_to_published_state() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.name());

        post.approve().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.name());
    }

    #[test]
    fn text_content_can_be_changed_only_in_draft_state() {
        let mut post = Post::new();

        post.add_text("1").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.add_text("2").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.add_text("3").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.name());

        post.request_review().unwrap();
        post.add_text("4").unwrap_err();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.name());

        post.approve().unwrap();
        post.add_text("5").unwrap_err();
        post.approve().unwrap();
        post.add_text("6").unwrap_err();
        assert_eq!("123", post.content());
        assert_eq!("published", post.state.name());
    }

    #[test]
    fn not_possible_to_approve_post_which_is_not_pending_review() {
        let mut post = Post::new();
        assert_eq!("draft", post.state.name());
        post.approve().unwrap_err();
        assert_eq!("draft", post.state.name());
    }
}