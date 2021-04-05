(define (unique-n-tuples-of elements n)
  (define (element-pairs first rest)
    (map (lambda (x) (cons first x)) rest))
  (if (eq? n 1) (map (lambda (x) (list x)) elements)
    (if (null? elements) '()
      (append
        (element-pairs
          (car elements)
          (unique-n-tuples-of (cdr elements) (- n 1)))
        (unique-n-tuples-of (cdr elements) n)))))

(define (unique-pairs-of elements)
  (unique-n-tuples-of elements 2))

(define elements (list 1 2 3 4 5))
(newline)
(display (unique-pairs-of elements))
(newline)

(newline)
(display (unique-n-tuples-of elements 3))
(newline)