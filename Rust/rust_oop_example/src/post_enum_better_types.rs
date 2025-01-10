use anyhow::{ Error, anyhow };

#[derive(Debug, PartialEq)]
enum Post {
    Draft {
        content: String
    },
    PendingReview {
        content: String,
        approval_count: u8
    },
    Published {
        content: String
    }
}

impl Post {
    pub fn new() -> Post {
        Post::Draft { content: String::new() }
    }

    pub fn add_text(&mut self, text: &str) -> Result<(), Error> {
        match self {
            Post::Draft { content } => {
                content.push_str(text);
                Ok(())
            },
            _ =>
              Err(anyhow!("Cannot add text in current state"))
        }
    }

    pub fn request_review(&self) -> Result<Post, Error> {
        match self {
            Post::Draft { content} => {
                Ok(Post::PendingReview { content: content.to_owned(), approval_count: 0})
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'pending_review'", self))
        }
    }

    pub fn approve(&self) -> Result<Post, Error> {
        match self {
            Post::PendingReview { content, approval_count } => {
                let updated_approval_count = approval_count + 1;
                if updated_approval_count >= 2 {
                    Ok(Post::Published { content: content.to_owned() })
                } else {
                    Ok(Post::PendingReview { content: content.to_owned(), approval_count: updated_approval_count })
                }
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'published'", self))
        }
    }

    pub fn reject(&self) -> Result<Post, Error> {
        match self {
            Post::PendingReview { content, approval_count: _ } => {
                Ok(Post::Draft { content: content.to_owned() } )
            },
            _ =>
                Err(anyhow!("Cannot transition '{:?}' -> 'draft'", self))
        }
    }

    pub fn content(&self) -> &str {
        match self {
            Post::Published { content} => {
                content
            },
            _ =>
                ""
        }
    }

    pub fn name(&self) -> String {
        (match self {
            Post::Draft { content: _ } => {
                "draft"
            },
            Post::PendingReview { content: _, approval_count: _ } => {
                "pending_review"
            },
            Post::Published { content: _ } => {
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
        assert_eq!("draft", post.name());

        post = post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.name());

        post = post.approve().unwrap();
        post = post.approve().unwrap();
        assert_eq!("I ate a salad for lunch today", post.content());
        assert_eq!("published", post.name());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        let mut post = Post::new();

        post.add_text("And fish for dinner").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());

        post = post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.name());

        post = post.reject().unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());
    }

    #[test]
    fn requires_two_calls_to_approve_to_transition_to_published_state() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());

        post = post.request_review().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.name());

        post = post.approve().unwrap();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.name());
    }

    #[test]
    fn text_content_can_be_changed_only_in_draft_state() {
        let mut post = Post::new();

        post.add_text("1").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());

        post.add_text("2").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());

        post.add_text("3").unwrap();
        assert_eq!("", post.content());
        assert_eq!("draft", post.name());

        post = post.request_review().unwrap();
        post.add_text("4").unwrap_err();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.name());

        post = post.approve().unwrap();
        post.add_text("5").unwrap_err();
        post = post.approve().unwrap();
        post.add_text("6").unwrap_err();
        assert_eq!("123", post.content());
        assert_eq!("published", post.name());
    }

    #[test]
    fn not_possible_to_approve_post_which_is_not_pending_review() {
        let post = Post::new();
        assert_eq!("draft", post.name());
        post.approve().unwrap_err();
    }
}