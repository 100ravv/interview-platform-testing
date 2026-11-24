const examples = (rows) => rows.map(([name, input, expectedOutput]) => ({ name, input, expectedOutput, visibility: 'public' }));
const hidden = (rows) => rows.map(([name, input, expectedOutput]) => ({ name, input, expectedOutput, visibility: 'hidden' }));

export const problemDocuments = [
  {
    slug: 'sum-two-numbers', title: 'Sum of Two Numbers', difficulty: 'Easy', category: 'Math', summary: 'Read two integers and print their sum.',
    statement: 'Given two integers, output their sum. The input contains exactly two integers separated by whitespace.',
    inputFormat: 'One line with integers a and b.', outputFormat: 'Print a + b.', constraints: ['-10^9 ≤ a, b ≤ 10^9'],
    testCases: [...examples([['Example 1', '3 5\n', '8\n'], ['Example 2', '-4 9\n', '5\n']]), ...hidden([['Hidden 1', '0 0\n', '0\n'], ['Hidden 2', '1000000000 1000000000\n', '2000000000\n'], ['Hidden 3', '-10 -25\n', '-35\n']])],
  },
  {
    slug: 'maximum-in-array', title: 'Maximum in an Array', difficulty: 'Easy', category: 'Arrays', summary: 'Find the largest value in a list of integers.',
    statement: 'The first input value is n, followed by n integers. Print the maximum value.',
    inputFormat: 'First line: integer n. Second line: n space-separated integers.', outputFormat: 'Print the largest integer.', constraints: ['1 ≤ n ≤ 100000', '-10^9 ≤ values[i] ≤ 10^9'],
    testCases: [...examples([['Example 1', '5\n2 9 1 7 4\n', '9\n'], ['Example 2', '4\n-8 -3 -12 -5\n', '-3\n']]), ...hidden([['Hidden 1', '1\n42\n', '42\n'], ['Hidden 2', '6\n5 5 5 5 5 5\n', '5\n'], ['Hidden 3', '3\n1000000000 0 -1000000000\n', '1000000000\n']])],
  },
  {
    slug: 'count-vowels', title: 'Count the Vowels', difficulty: 'Easy', category: 'Strings', summary: 'Count the vowels in a line of text.',
    statement: 'Given one line of text, count the English vowels (a, e, i, o, u). Treat uppercase and lowercase letters the same.',
    inputFormat: 'One line containing letters and spaces.', outputFormat: 'Print the number of vowels.', constraints: ['The line contains at most 10000 characters.'],
    testCases: [...examples([['Example 1', 'Interview Studio\n', '7\n'], ['Example 2', 'rhythm\n', '0\n']]), ...hidden([['Hidden 1', 'AEIOU\n', '5\n'], ['Hidden 2', 'Education\n', '5\n'], ['Hidden 3', 'a e i o u\n', '5\n']])],
  },
  {
    slug: 'fizzbuzz', title: 'FizzBuzz', difficulty: 'Easy', category: 'Loops', summary: 'Print the classic FizzBuzz sequence up to n.',
    statement: 'For each integer from 1 to n, print FizzBuzz if divisible by both 3 and 5, Fizz if divisible by 3, Buzz if divisible by 5, and the number otherwise. Print one result per line.',
    inputFormat: 'One integer n.', outputFormat: 'Print n lines following the rules in the statement.', constraints: ['1 ≤ n ≤ 1000'],
    testCases: [...examples([['Example 1', '5\n', '1\n2\nFizz\n4\nBuzz\n'], ['Example 2', '3\n', '1\n2\nFizz\n']]), ...hidden([['Hidden 1', '1\n', '1\n'], ['Hidden 2', '15\n', '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n']])],
  },
  {
    slug: 'factorial', title: 'Factorial', difficulty: 'Medium', category: 'Math', summary: 'Compute n factorial for a small non-negative integer.',
    statement: 'Given a non-negative integer n, compute n! = 1 × 2 × ... × n. By definition, 0! = 1.',
    inputFormat: 'One integer n.', outputFormat: 'Print n factorial as an integer.', constraints: ['0 ≤ n ≤ 20'],
    testCases: [...examples([['Example 1', '5\n', '120\n'], ['Example 2', '0\n', '1\n']]), ...hidden([['Hidden 1', '1\n', '1\n'], ['Hidden 2', '10\n', '3628800\n'], ['Hidden 3', '20\n', '2432902008176640000\n']])],
  },
  {
    slug: 'palindrome-check', title: 'Palindrome Check', difficulty: 'Medium', category: 'Strings', summary: 'Check whether a phrase reads the same in both directions.',
    statement: 'Given a line, determine whether it is a palindrome after converting letters to lowercase and ignoring all non-alphanumeric characters. Print true or false.',
    inputFormat: 'One line of text.', outputFormat: 'Print true if it is a palindrome, otherwise false.', constraints: ['The line contains at most 10000 characters.'],
    testCases: [...examples([['Example 1', 'A man, a plan, a canal: Panama!\n', 'true\n'], ['Example 2', 'Interview\n', 'false\n']]), ...hidden([['Hidden 1', 'No lemon, no melon\n', 'true\n'], ['Hidden 2', '!!!\n', 'true\n'], ['Hidden 3', 'RaceCar\n', 'true\n']])],
  },
  {
    slug: 'reverse-string', title: 'Reverse a String', difficulty: 'Easy', category: 'Strings', summary: 'Print a word with its characters in reverse order.',
    statement: 'Given one word, print its characters in reverse order.',
    inputFormat: 'One word containing English letters.', outputFormat: 'Print the reversed word.', constraints: ['1 ≤ word length ≤ 10000'],
    testCases: [...examples([['Example 1', 'coding\n', 'gnidoc\n'], ['Example 2', 'a\n', 'a\n']]), ...hidden([['Hidden 1', 'Interview\n', 'weivretnI\n'], ['Hidden 2', 'level\n', 'level\n']])],
  },
  {
    slug: 'count-even-numbers', title: 'Count Even Numbers', difficulty: 'Easy', category: 'Arrays', summary: 'Count how many values in a list are even.',
    statement: 'Given n integers, print how many are divisible by 2.',
    inputFormat: 'First line: n. Second line: n space-separated integers.', outputFormat: 'Print the number of even integers.', constraints: ['1 ≤ n ≤ 100000', '-10^9 ≤ values[i] ≤ 10^9'],
    testCases: [...examples([['Example 1', '5\n1 2 3 4 6\n', '3\n'], ['Example 2', '4\n-3 -2 0 7\n', '2\n']]), ...hidden([['Hidden 1', '1\n8\n', '1\n'], ['Hidden 2', '3\n1 3 5\n', '0\n']])],
  },
  {
    slug: 'second-largest', title: 'Second Largest Distinct Value', difficulty: 'Easy', category: 'Arrays', summary: 'Find the second largest distinct number in an array.',
    statement: 'Given an array containing at least two distinct values, print its second largest distinct value.',
    inputFormat: 'First line: n. Second line: n space-separated integers.', outputFormat: 'Print the second largest distinct value.', constraints: ['2 ≤ n ≤ 100000', 'The input contains at least two distinct values', '-10^9 ≤ values[i] ≤ 10^9'],
    testCases: [...examples([['Example 1', '5\n4 1 7 7 5\n', '5\n'], ['Example 2', '4\n-2 -5 -1 -3\n', '-2\n']]), ...hidden([['Hidden 1', '2\n1 2\n', '1\n'], ['Hidden 2', '6\n9 8 7 6 5 4\n', '8\n']])],
  },
  {
    slug: 'linear-search', title: 'Linear Search', difficulty: 'Easy', category: 'Searching', summary: 'Find the first zero-based position of a target value.',
    statement: 'Given an array and a target value, print the index of its first occurrence. Print -1 if it does not appear.',
    inputFormat: 'First line: n and target. Second line: n space-separated integers.', outputFormat: 'Print the zero-based index or -1.', constraints: ['1 ≤ n ≤ 100000', '-10^9 ≤ values[i], target ≤ 10^9'],
    testCases: [...examples([['Example 1', '5 7\n2 7 4 7 9\n', '1\n'], ['Example 2', '4 3\n1 2 4 5\n', '-1\n']]), ...hidden([['Hidden 1', '1 5\n5\n', '0\n'], ['Hidden 2', '6 -2\n1 -2 3 -2 4 5\n', '1\n']])],
  },
  {
    slug: 'sum-of-digits', title: 'Sum of Digits', difficulty: 'Easy', category: 'Math', summary: 'Add all digits of a non-negative integer.',
    statement: 'Given a non-negative integer, print the sum of its decimal digits.',
    inputFormat: 'One non-negative integer n.', outputFormat: 'Print the sum of its digits.', constraints: ['0 ≤ n ≤ 10^15'],
    testCases: [...examples([['Example 1', '583\n', '16\n'], ['Example 2', '0\n', '0\n']]), ...hidden([['Hidden 1', '1000000000000000\n', '1\n'], ['Hidden 2', '99999\n', '45\n']])],
  },
  {
    slug: 'greatest-common-divisor', title: 'Greatest Common Divisor', difficulty: 'Easy', category: 'Math', summary: 'Compute the greatest common divisor of two integers.',
    statement: 'Given two non-negative integers a and b, print their greatest common divisor. Define gcd(0, 0) as 0.',
    inputFormat: 'Two non-negative integers a and b.', outputFormat: 'Print gcd(a, b).', constraints: ['0 ≤ a, b ≤ 10^9'],
    testCases: [...examples([['Example 1', '18 24\n', '6\n'], ['Example 2', '7 13\n', '1\n']]), ...hidden([['Hidden 1', '0 15\n', '15\n'], ['Hidden 2', '0 0\n', '0\n']])],
  },
  {
    slug: 'fibonacci-number', title: 'Fibonacci Number', difficulty: 'Easy', category: 'Math', summary: 'Find the nth Fibonacci number iteratively.',
    statement: 'The sequence is defined by F0 = 0, F1 = 1, and Fn = F(n-1) + F(n-2). Given n, print Fn.',
    inputFormat: 'One integer n.', outputFormat: 'Print Fn.', constraints: ['0 ≤ n ≤ 78'],
    testCases: [...examples([['Example 1', '6\n', '8\n'], ['Example 2', '0\n', '0\n']]), ...hidden([['Hidden 1', '1\n', '1\n'], ['Hidden 2', '10\n', '55\n'], ['Hidden 3', '78\n', '8944394323791464\n']])],
  },
  {
    slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Medium', category: 'Stacks', summary: 'Check whether brackets are balanced and correctly nested.',
    statement: 'A string is valid when every opening bracket has a matching closing bracket of the same type and brackets close in the correct order. The input uses only (), {}, and []. Print true or false.',
    inputFormat: 'One non-empty string containing only brackets.', outputFormat: 'Print true if valid, otherwise false.', constraints: ['1 ≤ string length ≤ 100000'],
    testCases: [...examples([['Example 1', '{[]}()\n', 'true\n'], ['Example 2', '([)]\n', 'false\n']]), ...hidden([['Hidden 1', '((()))\n', 'true\n'], ['Hidden 2', '((())\n', 'false\n'], ['Hidden 3', '}{\n', 'false\n']])],
  },
  {
    slug: 'merge-sorted-arrays', title: 'Merge Sorted Arrays', difficulty: 'Medium', category: 'Arrays', summary: 'Merge two sorted arrays into one sorted list.',
    statement: 'Given two arrays sorted in non-decreasing order, print all their values in sorted order. Keep duplicate values.',
    inputFormat: 'First line: n and m. Second line: n values. Third line: m values. If an array is empty, its line may be blank.', outputFormat: 'Print the merged values separated by spaces.', constraints: ['0 ≤ n, m ≤ 100000', 'At least one of n or m is positive', '-10^9 ≤ values[i] ≤ 10^9'],
    testCases: [...examples([['Example 1', '3 3\n1 4 7\n2 3 8\n', '1 2 3 4 7 8\n'], ['Example 2', '2 3\n1 5\n1 2 6\n', '1 1 2 5 6\n']]), ...hidden([['Hidden 1', '0 3\n\n-2 0 4\n', '-2 0 4\n'], ['Hidden 2', '4 0\n-3 -1 2 9\n\n', '-3 -1 2 9\n']])],
  },
  {
    slug: 'binary-search', title: 'Binary Search', difficulty: 'Medium', category: 'Searching', summary: 'Find the first occurrence of a target in a sorted array.',
    statement: 'Given a sorted array and a target, print the zero-based index of its first occurrence. Print -1 if the target is absent.',
    inputFormat: 'First line: n and target. Second line: n space-separated sorted integers.', outputFormat: 'Print the first matching index or -1.', constraints: ['1 ≤ n ≤ 100000', '-10^9 ≤ values[i], target ≤ 10^9'],
    testCases: [...examples([['Example 1', '6 4\n1 2 4 4 4 8\n', '2\n'], ['Example 2', '5 3\n1 2 4 5 6\n', '-1\n']]), ...hidden([['Hidden 1', '1 9\n9\n', '0\n'], ['Hidden 2', '5 1\n1 1 1 1 1\n', '0\n']])],
  },
  {
    slug: 'two-sum-exists', title: 'Two Sum Exists', difficulty: 'Medium', category: 'Arrays', summary: 'Check whether two different array positions sum to a target.',
    statement: 'Given an integer array and a target, determine whether two values at different indices add up to the target. Print true or false.',
    inputFormat: 'First line: n and target. Second line: n space-separated integers.', outputFormat: 'Print true if such a pair exists, otherwise false.', constraints: ['1 ≤ n ≤ 5000', '-10^9 ≤ values[i], target ≤ 10^9'],
    testCases: [...examples([['Example 1', '4 9\n2 7 11 15\n', 'true\n'], ['Example 2', '3 7\n1 2 4\n', 'false\n']]), ...hidden([['Hidden 1', '2 6\n3 3\n', 'true\n'], ['Hidden 2', '1 10\n10\n', 'false\n']])],
  },
  {
    slug: 'rotate-array-right', title: 'Rotate an Array Right', difficulty: 'Medium', category: 'Arrays', summary: 'Rotate array values right by k positions.',
    statement: 'Move each array value k positions to the right. Values that pass the end wrap around to the beginning.',
    inputFormat: 'First line: n and k. Second line: n space-separated integers.', outputFormat: 'Print the rotated array separated by spaces.', constraints: ['1 ≤ n ≤ 100000', '0 ≤ k ≤ 10^9', '-10^9 ≤ values[i] ≤ 10^9'],
    testCases: [...examples([['Example 1', '5 2\n1 2 3 4 5\n', '4 5 1 2 3\n'], ['Example 2', '4 0\n8 6 4 2\n', '8 6 4 2\n']]), ...hidden([['Hidden 1', '3 5\n1 2 3\n', '2 3 1\n'], ['Hidden 2', '1 100\n7\n', '7\n']])],
  },
  {
    slug: 'longest-word', title: 'Longest Word', difficulty: 'Easy', category: 'Strings', summary: 'Print the longest word, keeping the first in a tie.',
    statement: 'Given words separated by single spaces, print the longest word. If multiple words have the same maximum length, print the earliest one.',
    inputFormat: 'One non-empty line containing English words.', outputFormat: 'Print the longest word.', constraints: ['The line contains at most 10000 characters.'],
    testCases: [...examples([['Example 1', 'write clean code\n', 'write\n'], ['Example 2', 'one two three\n', 'three\n']]), ...hidden([['Hidden 1', 'same size\n', 'same\n'], ['Hidden 2', 'extraordinary\n', 'extraordinary\n']])],
  },
  {
    slug: 'count-character', title: 'Count a Character', difficulty: 'Easy', category: 'Strings', summary: 'Count how many times a character appears in a word.',
    statement: 'Given a word and a target English letter, count the target character in the word. The comparison is case-sensitive.',
    inputFormat: 'One line with a word and a target character separated by a space.', outputFormat: 'Print the number of occurrences.', constraints: ['1 ≤ word length ≤ 10000'],
    testCases: [...examples([['Example 1', 'banana a\n', '3\n'], ['Example 2', 'Interview e\n', '2\n']]), ...hidden([['Hidden 1', 'aaaa a\n', '4\n'], ['Hidden 2', 'Coding z\n', '0\n']])],
  },
];
