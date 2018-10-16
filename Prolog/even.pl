even(0).
even(s(s(X))):-
        even(X).
odd(s(0)).
odd(s(X)):-
	odd(X).
