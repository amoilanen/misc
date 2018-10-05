#include <stdio.h>
  
int fibonacci(int n) {
  if ((n == 0) || (n == 1)) {
    return 1;
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}

int main() {
  printf("fibonacci(5) = %d", fibonacci(5));
}
