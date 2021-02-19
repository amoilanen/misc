(define (is-sorted? l)
  (if (null? l) #t
    (let ((element-pairs (zip l (cdr l))))
      (or
        (every
          (lambda (pair)
            (<= (car pair) (cadr pair)))
          element-pairs
        )
        (every
          (lambda (pair)
            (>= (car pair) (cadr pair)))
          element-pairs)))))

(define (test test-input)
  (lambda () (is-sorted? test-input)))

(define tests
  (list
    (cons #t (test (list 5 4 3 2 1)))
    (cons #t (test (list 1 2 3 4 5)))
    (cons #f (test (list 5 4 1 2 3)))
    (cons #t (test (list 4 4 4 3 2 1 1)))
    (cons #f (test (list 1 1 1 3 2 4 5 5 5)))
    (cons #t (test (list 1)))
    (cons #t (test '()))))

(newline)
(display "Running tests:")
(newline)
(map
  (lambda (test-fixture)
    (let ((expected-result (car test-fixture))
          (test-to-execute (cdr test-fixture)))
      (if (equal? expected-result (test-to-execute))
        (display "√")
        (display "F"))))
  tests)
(newline)