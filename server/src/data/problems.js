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
];
