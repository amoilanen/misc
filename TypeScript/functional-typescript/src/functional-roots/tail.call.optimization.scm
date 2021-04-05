(define (map f elements)
  (if (null? elements) '()
    (cons (f (car elements))
          (map f (cdr elements)))))

(define list-size 15000)
(define elements
  (make-list list-size 5))

(newline)
(display
  (map
    (lambda (x)
      (* x x))
    elements))
(newline)