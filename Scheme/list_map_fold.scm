; Maps function over list
; f - function of one argument, returns transformed argument
; l - list
(define (map f l)
  (if (> (length l) 0)
     (cons
        (f (car l))
        (map f (cdr l))
     )
     ()
  )
)

; Folds list with a given function
; f - function that accepts two arguments and produces result of the same type
; l - list
; a - initial value to use for folding
(define (foldLeft f l a)
  (if (> (length l) 0)
    (foldLeft f (cdr l) (f (car l) a))
    a
  )
)

; Examples
(map (lambda (x) (* x x)) (list 1 2 3))
(foldLeft (lambda (x y) (+ x y)) (list 1 2 3 4 5) 0)