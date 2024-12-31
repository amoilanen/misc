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
        self.content.push_str(text);
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

    pub fn content(&self) -> &str {
        self.state.as_ref().unwrap().content(self)
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;
    fn name(&self) -> String;
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        ""
    }
}

#[derive(Debug, PartialEq)]
struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview {})
    }
    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn name(&self) -> String {
        "draft".to_owned()
    }
}

#[derive(Debug, PartialEq)]
struct PendingReview {}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }
    fn approve(self: Box<Self>) -> Box<dyn State> {
        Box::new(Published {})
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
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        &post.content
    }
    fn name(&self) -> String {
        "published".to_owned()
    }
}

fn main() {
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
        assert_eq!("I ate a salad for lunch today", post.content());
        assert_eq!("published", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        //TODO: Implement
    }

    #[test]
    fn requires_two_calls_to_approve_to_transition_to_published_state() {
        //TODO: Implement
    }

    #[test]
    fn text_content_can_be_changed_in_draft_state() {
        //TODO: Implement
    }

    #[test]
    fn text_content_cannot_be_changed_in_pending_review_state() {
        //TODO: Implement
    }

    #[test]
    fn text_content_cannot_be_changed_in_published_state() {
        //TODO: Implement
    }

    //TODO: Trying to change the state of the post to an invalid state should result in an error
}
