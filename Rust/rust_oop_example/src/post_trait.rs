use anyhow::{ Error, anyhow };

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

    pub fn add_text(&mut self, text: &str) -> Result<(), Error> {
        if let Some(s) = &self.state {
            if s.can_add_text() {
                self.content.push_str(text);
                Ok(())
            } else {
                Err(anyhow!("Cannot add text in current state"))
            }
        } else {
            Err(anyhow!("Current state is not set"))
        }

    }

    pub fn request_review(&mut self) -> Result<(), Error> {
        if let Some(s) = self.state.as_ref() {
            self.state = Some(s.request_review()?);
            Ok(())
        } else {
            Err(anyhow!("Cannot request review in current state"))
        }
    }

    pub fn approve(&mut self) -> Result<(), Error> {
        if let Some(s) = self.state.as_ref() {
            self.state = Some(s.approve()?);
            Ok(())
        } else {
            Err(anyhow!("Cannot approve in current state"))
        }
    }

    pub fn reject(&mut self) -> Result<(), Error> {
        if let Some(s) = self.state.as_ref() {
            self.state = Some(s.reject()?);
            Ok(())
        } else {
            Err(anyhow!("Cannot reject in current state"))
        }
    }

    pub fn content(&self) -> Result<&str, Error> {
        let state = self.state.as_ref().ok_or(anyhow!("State not defined"))?;
        Ok(state.content(self))
    }
}

trait State {
    fn request_review(&self) -> Result<Box<dyn State>, Error>;
    fn approve(&self) -> Result<Box<dyn State>, Error>;
    fn reject(&self) -> Result<Box<dyn State>, Error>;
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
    fn request_review(&self) -> Result<Box<dyn State>, Error> {
        Ok(Box::new(PendingReview { approval_count: 0}))
    }
    fn approve(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'draft' -> 'approved'"))
    }
    fn reject(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'draft' -> 'rejected'"))
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
    fn request_review(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'pending_review' -> 'pending_review'"))
    }
    fn approve(&self) -> Result<Box<dyn State>, Error> {
        let updated_approval_count = self.approval_count + 1;
        if updated_approval_count >= 2 {
            Ok(Box::new(Published {}))
        } else {
            Ok(Box::new(PendingReview { approval_count: updated_approval_count }))
        }
    }
    fn reject(&self) -> Result<Box<dyn State>, Error> {
        Ok(Box::new(Draft {}))
    }
    fn name(&self) -> String {
        "pending_review".to_owned()
    }
}

#[derive(Debug, PartialEq)]
struct Published {}

impl State for Published {
    fn request_review(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'published' -> 'pending_review'"))
    }
    fn approve(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'published' -> 'approved'"))
    }
    fn reject(&self) -> Result<Box<dyn State>, Error> {
        Err(anyhow!("Cannot transition 'published' -> 'rejected'"))
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

        post.add_text("I ate a salad for lunch today").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review().unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve().unwrap();
        post.approve().unwrap();
        assert_eq!("I ate a salad for lunch today", post.content().unwrap());
        assert_eq!("published", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn method_reject_changes_post_state_back_to_draft() {
        let mut post = Post::new();

        post.add_text("And fish for dinner").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review().unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.reject().unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn requires_two_calls_to_approve_to_transition_to_published_state() {
        let mut post = Post::new();

        post.add_text("I ate a salad for lunch today").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review().unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve().unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn text_content_can_be_changed_only_in_draft_state() {
        let mut post = Post::new();

        post.add_text("1").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.add_text("2").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.add_text("3").unwrap();
        assert_eq!("", post.content().unwrap());
        assert_eq!("draft", post.state.as_ref().unwrap().name());

        post.request_review().unwrap();
        post.add_text("4").unwrap_err();
        assert_eq!("", post.content().unwrap());
        assert_eq!("pending_review", post.state.as_ref().unwrap().name());

        post.approve().unwrap();
        post.add_text("5").unwrap_err();
        post.approve().unwrap();
        post.add_text("6").unwrap_err();
        assert_eq!("123", post.content().unwrap());
        assert_eq!("published", post.state.as_ref().unwrap().name());
    }

    #[test]
    fn not_possible_to_approve_post_which_is_not_pending_review() {
        let mut post = Post::new();
        assert_eq!("draft", post.state.as_ref().unwrap().name());
        post.approve().unwrap_err();
        assert_eq!("draft", post.state.as_ref().unwrap().name());
    }
}