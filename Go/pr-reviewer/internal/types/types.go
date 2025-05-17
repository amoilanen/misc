package types

// PRComment represents a comment on a pull request
type PRComment struct {
	ID        int64  `json:"id"`
	Body      string `json:"body"`
	Path      string `json:"path"`
	Line      int    `json:"line"`
	ThreadID  int64  `json:"thread_id"`
	InReplyTo int64  `json:"in_reply_to"`
}
