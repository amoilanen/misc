pub struct Post {
    state: Option<Box<dyn State>>,
    content: String,
}

impl Post {
    pub fn new() -> Post {
        Post {
            state: Some(Box::new(Draft {})),
            content: String::new(),
        }
    }

    pub fn add_text(&mut self, text: &str) {
        if let Some(s) = &self.state {
            if s.can_add_text() {
                self.content.push_str(text);
            }
        }
    }

    pub fn request_review(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.request_review())
        }
    }

    pub fn approve(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.approve())
        }
    }

    pub fn reject(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.reject())
        }
    }

    pub fn content(&self) -> &str {
        self.state.as_ref().unwrap().content(self)
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;
    fn reject(self: Box<Self>) -> Box<dyn State>;
    fn can_add_text(&self) -> bool {
        false
    }
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        ""
    }
    fn name(&self) -> String;
}

#[derive(Debug, PartialEq)]
struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview { approval_count: 0})
    }
    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn reject(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn can_add_text<'a>(&self) -> bool {
        true
    }
    fn name(&self) -> String {
        "draft".to_owned()
    }
}

#[derive(Debug, PartialEq)]
struct PendingReview {
    approval_count: u8
}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn approve(self: Box<Self>) -> Box<dyn State> {
        let updated_approval_count = self.approval_count + 1;
        if updated_approval_count >= 2 {
            Box::new(Published {})
        } else {
            Box::new(PendingReview { approval_count: updated_approval_count })
        }
    }
    fn reject(self: Box<Self>) -> Box<dyn State> {
        Box::new(Draft {})
    }
    fn name(&self) -> String {
        "pending_review".to_owned()
    }
}

#[derive(Debug, PartialEq)]
struct Published {}

impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn reject(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        &post.content
    }
    fn name(&self) -> String {
        "published".to_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::Post;

    #[test]
    fn should_allow_to_request_review_and_approve_post() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve();
        post.approve();
        assert_eq!("I ate a salad for lunch today", post.content());
        assert_eq!("published", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        let mut post = Post::new();

        post.add_text("And fish for dinner");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.reject();
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn requires_two_calls_to_approve_to_transition_to_published_state() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve();
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn text_content_can_be_changed_only_in_draft_state() {
        let mut post = Post::new();

        post.add_text("1");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.add_text("2");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.add_text("3");
        assert_eq!("", post.content());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review();
        post.add_text("4");
        assert_eq!("", post.content());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve();
        post.add_text("5");
        post.approve();
        post.add_text("6");
        assert_eq!("123", post.content());
        assert_eq!("published", post.state.as_ref().unwrap().name());
    }

    //TODO: Trying to change the state of the post to an invalid state should result in an error
}