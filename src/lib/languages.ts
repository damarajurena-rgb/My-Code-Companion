export const LANGUAGES = [
  { id: "python", label: "Python", monaco: "python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "c", label: "C", monaco: "c" },
  { id: "cpp", label: "C++", monaco: "cpp" },
] as const;

export type LangId = (typeof LANGUAGES)[number]["id"];

export const SAMPLES: Record<LangId, string> = {
  python: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

numbers = [1, 2, 3, 4, 5]
results = [factorial(x) for x in numbers]
print(results)
`,
  javascript: `function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const series = Array.from({ length: 8 }, (_, i) => fibonacci(i));
console.log(series);
`,
  java: `public class Main {
    public static int sum(int[] arr) {
        int total = 0;
        for (int n : arr) total += n;
        return total;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5};
        System.out.println(sum(nums));
    }
}
`,
  c: `#include <stdio.h>

int main(void) {
    int nums[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += nums[i];
    }
    printf("%d\\n", sum);
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : v) sum += n;
    std::cout << sum << std::endl;
    return 0;
}
`,
};
