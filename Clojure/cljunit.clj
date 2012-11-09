;Port of a simple unit testing framework from the "Practical Common Lisp" book to Clojure 
;http://www.gigamonkeys.com/book/practical-building-a-unit-test-framework.html
(ns cljunit-testing
  (:require clojure.contrib.string))

(defn function-names-from-stacktrace 
  "Returns a sequence of names of the user defined functions
   obtained from the current Java stack trace"
  [stackTrace]
  (let [functionNames (map #(. %1 getClassName) stackTrace)]
    (take-while 
      #(not (re-find #"eval" %1)) 
      functionNames)))

(defn function-names-to-readable-form 
  "Returns a string representation of a stack trace that has a format
   func1.func2.func3"
  [functionNames]
  (clojure.contrib.string/join "." 
    (reverse 
      (map 
        #(last (re-find #"\$(.+)" %1)) 
        functionNames))))

(defn report-result
  "Checks the result of a test case and prints it to the console"
  [result form]
  (defn test-name
    "Returns a fully qualified test name for the function report-result"
    []
    (function-names-to-readable-form 
      (rest (rest (function-names-from-stacktrace 
        (. (new java.lang.Exception) getStackTrace))))))
  (println (if result "pass" "FAIL") "... " (test-name) " " form)
  result)

(defn combine-results 
  "Combines 'results' without the short-circuiting behavior, so that
   all the results will be evaluated even if there is a 'false' one in the middle"
  [& results]
  (every? identity (vec results)))

(defmacro check 
  "Evaluates each test case in 'results'"
  [& results]
  `(combine-results 
     ~@(map
       (fn [form#]
        `(report-result ~form# '~form#)) 
       results)))

(defmacro deftest 
  "Defines a test, consisting of test cases"
  [name parameters & body]
  `(defn ~name [~@parameters]
     (check
       ~@body)))

(defmacro defsuite 
  "Defines a test suite, consisting of tests or other suites"
  [name parameters & body]
  `(defn ~name [~@parameters]
     (combine-results
       ~@body)))

;Example of how to create tests/test suites
(comment

(deftest test-plus []
  (= (+ 1 2) 3)
  (= (+ 1 2 3) 6)
  (= (+ -1 -3) -4))

(deftest test-minus []
  (= (- 2 3) -1)
  (= (- 10 2) 8))

(deftest test-mutliplication []
  (= (* 2 2) 4)
  (= (* 3 5) 15))

(defsuite test-plus-minus[] 
  (test-plus)
  (test-minus))

(defsuite test-arithmetic[]
  (test-plus-minus)
  (test-mutliplication))

(test-arithmetic)

)