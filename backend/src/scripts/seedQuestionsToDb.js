/**
 * Standalone Database Seeder: Seeds questions into MongoDB Question collection
 * Usage: node src/scripts/seedQuestionsToDb.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const Question = require('../models/Question');

const DEFAULT_QUESTION_BANK = {
  crt: {
    aptitude: [
      {
        text: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
        options: ['120 metres', '150 metres', '180 metres', '324 metres'],
        correct_answer: '150 metres',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Speed = 60 * (5/18) = 50/3 m/sec. Length = Speed * Time = (50/3) * 9 = 150 metres.'
      },
      {
        text: 'If a person sells an article for Rs. 450 and incurs a loss of 10%, at what price should he sell it to gain 20%?',
        options: ['Rs. 500', 'Rs. 550', 'Rs. 600', 'Rs. 650'],
        correct_answer: 'Rs. 600',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'CP = 450 / 0.9 = 500. SP for 20% gain = 500 * 1.2 = Rs. 600.'
      },
      {
        text: 'A and B can complete a work in 12 days and 18 days respectively. In how many days can they complete it together?',
        options: ['6.2 days', '7.2 days', '8.5 days', '9.0 days'],
        correct_answer: '7.2 days',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: '1/12 + 1/18 = 5/36. Total days = 36/5 = 7.2 days.'
      },
      {
        text: 'What is the simple interest on Rs. 8,000 at 5% per annum for 3 years?',
        options: ['Rs. 1,000', 'Rs. 1,200', 'Rs. 1,400', 'Rs. 1,500'],
        correct_answer: 'Rs. 1,200',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'SI = (P * R * T) / 100 = (8000 * 5 * 3) / 100 = 1200.'
      },
      {
        text: 'Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the ratio becomes 12 : 23. What is the smaller number?',
        options: ['27', '33', '45', '55'],
        correct_answer: '33',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: '(3x - 9)/(5x - 9) = 12/23 => 69x - 207 = 60x - 108 => 9x = 99 => x = 11. Smaller number = 3 * 11 = 33.'
      },
      {
        text: 'Find the average of first 50 natural numbers.',
        options: ['25.0', '25.5', '26.0', '26.5'],
        correct_answer: '25.5',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Average = (n + 1)/2 = 51/2 = 25.5.'
      },
      {
        text: 'A sum of money doubles itself in 8 years at simple interest. What is the rate percent per annum?',
        options: ['10%', '12.5%', '14%', '15%'],
        correct_answer: '12.5%',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'SI = P in 8 years. R = (100 * P) / (P * 8) = 12.5%.'
      },
      {
        text: 'In how many different ways can the letters of the word "LEADING" be arranged such that vowels always come together?',
        options: ['360', '480', '720', '5040'],
        correct_answer: '720',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Vowels: E, A, I (3). Consonants: L, D, N, G (4). Total units = 4 + 1 = 5. Arrangements = 5! * 3! = 120 * 6 = 720.'
      },
      {
        text: 'Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both are opened together, how long will it take?',
        options: ['10 minutes', '12 minutes', '15 minutes', '18 minutes'],
        correct_answer: '12 minutes',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: '1/20 + 1/30 = 5/60 = 1/12. Time = 12 minutes.'
      },
      {
        text: 'What is the probability of getting a sum 9 from two throws of a dice?',
        options: ['1/6', '1/8', '1/9', '1/12'],
        correct_answer: '1/9',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Favorable outcomes: (3,6), (4,5), (5,4), (6,3) = 4. Total = 36. Probability = 4/36 = 1/9.'
      },
      {
        text: 'A vendor bought toffees at 6 for a rupee. How many for a rupee must he sell to gain 20%?',
        options: ['3', '4', '5', '6'],
        correct_answer: '5',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'CP of 1 toffee = 1/6. SP of 1 toffee = (1/6) * 1.20 = 1/5. Toffees per rupee = 5.'
      },
      {
        text: 'If 20% of a = b, then b% of 20 is the same as:',
        options: ['4% of a', '5% of a', '20% of a', 'None of these'],
        correct_answer: '4% of a',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'b = 0.20a. (b/100) * 20 = (0.20a / 100) * 20 = 4% of a.'
      },
      {
        text: 'The present ages of three persons are in proportion 4 : 7 : 9. Eight years ago, the sum of their ages was 56. What is the age of the eldest?',
        options: ['28 years', '32 years', '36 years', '40 years'],
        correct_answer: '36 years',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Current sum = 56 + (8 * 3) = 80. Ratio sum = 4 + 7 + 9 = 20. Eldest = (9/20) * 80 = 36.'
      },
      {
        text: 'A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken to go 68 km downstream.',
        options: ['3 hours', '4 hours', '5 hours', '6 hours'],
        correct_answer: '4 hours',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Downstream speed = 13 + 4 = 17 km/hr. Time = 68 / 17 = 4 hours.'
      },
      {
        text: 'Find the greatest number which on dividing 1657 and 2037 leaves remainders 6 and 5 respectively.',
        options: ['123', '127', '235', '305'],
        correct_answer: '127',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'HCF of (1657-6 = 1651) and (2037-5 = 2032) is 127.'
      },
      {
        text: 'If log 2 = 0.3010 and log 3 = 0.4771, the value of log 5 is:',
        options: ['0.6990', '0.7090', '0.7990', '0.8110'],
        correct_answer: '0.6990',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'log 5 = log(10/2) = log 10 - log 2 = 1 - 0.3010 = 0.6990.'
      },
      {
        text: 'A wheel makes 1000 revolutions in covering a distance of 88 km. Find the diameter of the wheel.',
        options: ['14 m', '24 m', '28 m', '40 m'],
        correct_answer: '28 m',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Circumference = 88000 / 1000 = 88 m. pi * d = 88 => d = (88 * 7) / 22 = 28 m.'
      },
      {
        text: 'If x + 1/x = 5, what is the value of x^2 + 1/x^2?',
        options: ['23', '25', '27', '30'],
        correct_answer: '23',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: '(x + 1/x)^2 = x^2 + 1/x^2 + 2 = 25 => x^2 + 1/x^2 = 23.'
      },
      {
        text: 'A sum of money at compound interest amounts to thrice of itself in 3 years. In how many years will it be 9 times itself?',
        options: ['6 years', '8 years', '9 years', '12 years'],
        correct_answer: '6 years',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'In 3 years = 3^1 times. 9 times = 3^2 times. Time = 3 * 2 = 6 years.'
      },
      {
        text: 'A car moves at 80 km/hr for the first 2 hours and 60 km/hr for the next 3 hours. Find the average speed.',
        options: ['68 km/hr', '70 km/hr', '72 km/hr', '75 km/hr'],
        correct_answer: '68 km/hr',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Total distance = (80*2) + (60*3) = 160 + 180 = 340 km. Total time = 5 hrs. Average speed = 340/5 = 68 km/hr.'
      },
      {
        text: 'A card is drawn from a pack of 52 cards. What is the probability of getting a king or a spade?',
        options: ['4/13', '1/4', '16/52', '17/52'],
        correct_answer: '4/13',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Kings = 4, Spades = 13 (including 1 King). Total favorable = 13 + 3 = 16. P = 16/52 = 4/13.'
      },
      {
        text: 'The perimeter of a rectangle is 60 cm and its area is 200 sq.cm. Find the length of its diagonal.',
        options: ['10 cm', '15 cm', '10*sqrt(5) cm', '25 cm'],
        correct_answer: '10*sqrt(5) cm',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: '2(l+b)=60 => l+b=30. lb=200. l^2+b^2 = (l+b)^2 - 2lb = 900 - 400 = 500. Diagonal = sqrt(500) = 10*sqrt(5).'
      },
      {
        text: 'If 15 men can reap a field in 35 days, in how many days can 21 men reap the same field?',
        options: ['20 days', '25 days', '28 days', '30 days'],
        correct_answer: '25 days',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'M1 * D1 = M2 * D2 => 15 * 35 = 21 * D2 => D2 = (15 * 35)/21 = 25 days.'
      },
      {
        text: 'Three unbiased coins are tossed. What is the probability of getting at most two heads?',
        options: ['3/4', '1/4', '7/8', '3/8'],
        correct_answer: '7/8',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Total outcomes = 8. All heads (HHH) = 1. At most two heads = 8 - 1 = 7. P = 7/8.'
      },
      {
        text: 'What will be the day of the week on 15th August 2010?',
        options: ['Saturday', 'Sunday', 'Monday', 'Tuesday'],
        correct_answer: 'Sunday',
        question_type: 'mcq',
        subcategory: 'aptitude',
        explanation: 'Calculating odd days up to 15th August 2010 gives 0 odd days, which corresponds to Sunday.'
      }
    ],
    reasoning: [
      {
        text: 'Find the next term in the series: 3, 7, 15, 31, 63, ?',
        options: ['95', '115', '127', '131'],
        correct_answer: '127',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Pattern: (x * 2) + 1. 63 * 2 + 1 = 127.'
      },
      {
        text: 'Pointing to a photograph, a man said, "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
        options: ['His own', 'His son\'s', 'His father\'s', 'His nephew\'s'],
        correct_answer: 'His son\'s',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: '"My father\'s son" is the man himself. So that man\'s father is the speaker. Hence, it is his son\'s photograph.'
      },
      {
        text: 'If CLOCK is coded as KCOLC, how will STEPS be coded?',
        options: ['SPETS', 'SPEST', 'PTESS', 'SEPTS'],
        correct_answer: 'SPETS',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'The word is simply reversed: S-T-E-P-S reversed is S-P-E-T-S.'
      },
      {
        text: 'A man walks 5 km East, turns right and walks 4 km, then turns left and walks 5 km. In which direction is he now from his starting point?',
        options: ['North-East', 'South-East', 'North-West', 'South-West'],
        correct_answer: 'South-East',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'He is 10 km East and 4 km South of the starting position, which is South-East.'
      },
      {
        text: 'Find the odd one out: 144, 169, 196, 210, 225',
        options: ['169', '196', '210', '225'],
        correct_answer: '210',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'All others are perfect squares: 12^2, 13^2, 14^2, 15^2. 210 is not a perfect square.'
      },
      {
        text: 'Statements: All mangoes are golden. No golden things are cheap. Conclusion I: All mangoes are cheap. Conclusion II: Golden mangoes are not cheap.',
        options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'],
        correct_answer: 'Only II follows',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Since no golden things are cheap and all mangoes are golden, mangoes cannot be cheap.'
      },
      {
        text: 'If \'+\' means \'-\', \'-\' means \'*\', \'*\' means \'/\', and \'/\' means \'+\', then evaluate: 15 * 3 + 10 - 2 / 5',
        options: ['-10', '-5', '5', '10'],
        correct_answer: '-10',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Expression becomes: 15 / 3 - 10 * 2 + 5 = 5 - 20 + 5 = -10.'
      },
      {
        text: 'Complete the sequence: AZ, BY, CX, DW, ?',
        options: ['EV', 'FU', 'GT', 'HS'],
        correct_answer: 'EV',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'First letter progresses +1 (A,B,C,D,E), second letter reverses -1 (Z,Y,X,W,V).'
      },
      {
        text: 'In a class of 45 students, rank of Rahul is 15th from the top. What is his rank from the bottom?',
        options: ['30th', '31st', '32nd', '29th'],
        correct_answer: '31st',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Rank from bottom = Total - Rank from top + 1 = 45 - 15 + 1 = 31.'
      },
      {
        text: 'Book is to Author as Film is to:',
        options: ['Producer', 'Actor', 'Director', 'Screenplay'],
        correct_answer: 'Director',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'An author creates a book; a director creates/directs a film.'
      },
      {
        text: 'Which number replaces question mark? 2, 6, 12, 20, 30, 42, ?',
        options: ['52', '54', '56', '60'],
        correct_answer: '56',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Differences are: 4, 6, 8, 10, 12, 14. 42 + 14 = 56.'
      },
      {
        text: 'Introducing a girl, Vipin said, "Her mother is the only daughter of my mother-in-law." How is Vipin related to the girl?',
        options: ['Uncle', 'Father', 'Brother', 'Husband'],
        correct_answer: 'Father',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Only daughter of Vipin\'s mother-in-law is Vipin\'s wife. So the girl\'s mother is Vipin\'s wife => Vipin is her father.'
      },
      {
        text: 'Find missing character: (1, 4, 9), (16, 25, 36), (49, 64, ?)',
        options: ['72', '81', '90', '100'],
        correct_answer: '81',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Squares of natural numbers: 7^2 = 49, 8^2 = 64, 9^2 = 81.'
      },
      {
        text: 'If WATER is coded as 12345 and SHIRT is coded as 67859, how is WHITE coded?',
        options: ['17895', '17835', '17854', '18735'],
        correct_answer: '17835',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'W=1, H=7, I=8, T=5 or 3, matching direct letter-to-digit substitution gives 17835.'
      },
      {
        text: 'Select the related word: Doctor : Stethoscope :: Sculptor : ?',
        options: ['Anvil', 'Chisel', 'Pen', 'Hammer'],
        correct_answer: 'Chisel',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'A doctor uses a stethoscope as a primary tool; a sculptor uses a chisel.'
      },
      {
        text: 'How many pairs of letters are there in the word "STUDENT" which have as many letters between them as in the English alphabet?',
        options: ['One', 'Two', 'Three', 'Four'],
        correct_answer: 'Two',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Pairs are S-T and D-E.'
      },
      {
        text: 'If South-East becomes North, North-East becomes West and so on, what will West become?',
        options: ['North-East', 'South-East', 'North-West', 'South-West'],
        correct_answer: 'South-East',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Each direction turns 135 degrees anti-clockwise. West turns 135 degrees anti-clockwise to South-East.'
      },
      {
        text: 'Statement: Many students fail in competitive exams due to lack of time management. Course of action I: Schools should conduct speed test sessions. II: Competitive exams should remove time limits.',
        options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'],
        correct_answer: 'Only I follows',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Conducting training/speed test sessions tackles the core issue constructively.'
      },
      {
        text: 'In a row of boys, Deepak is 7th from the left and Madhu is 12th from the right. If they interchange positions, Deepak becomes 22nd from left. How many boys are there in the row?',
        options: ['31', '33', '34', '35'],
        correct_answer: '33',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Total = 22 + 12 - 1 = 33.'
      },
      {
        text: 'Find the next letters in sequence: B, D, G, K, P, ?',
        options: ['U', 'V', 'W', 'X'],
        correct_answer: 'V',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Difference: +2, +3, +4, +5, +6. P(16) + 6 = 22 = V.'
      },
      {
        text: 'Which diagram represents the relationship between: Animals, Dogs, and Pets?',
        options: ['Concentric circles', 'Two intersecting circles inside one big circle', 'Three disjoint circles', 'Three intersecting circles'],
        correct_answer: 'Two intersecting circles inside one big circle',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'All dogs are animals. Some dogs are pets, and some pets are other animals.'
      },
      {
        text: 'If day before yesterday was Thursday, what day will be day after tomorrow?',
        options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        correct_answer: 'Monday',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Day before yesterday = Thursday => Yesterday = Friday => Today = Saturday => Tomorrow = Sunday => Day after tomorrow = Monday.'
      },
      {
        text: 'Statements: Some cats are dogs. All dogs are birds. Conclusions: I. Some cats are birds. II. All birds are dogs.',
        options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'],
        correct_answer: 'Only I follows',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Since intersection of cats and dogs is within birds, some cats must be birds.'
      },
      {
        text: 'Clock shows 4:30. If minute hand points East, in what direction will the hour hand point?',
        options: ['North-East', 'South-East', 'North-West', 'South-West'],
        correct_answer: 'North-East',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'Minute hand at 6 points East (rotated 90 deg anti-clockwise). Hour hand at 4:30 normally points South-East; rotating 90 deg anti-clockwise points North-East.'
      },
      {
        text: 'Find the odd pair: (8, 64), (6, 36), (9, 81), (7, 42)',
        options: ['(8, 64)', '(6, 36)', '(9, 81)', '(7, 42)'],
        correct_answer: '(7, 42)',
        question_type: 'mcq',
        subcategory: 'reasoning',
        explanation: 'In all other pairs, the second number is the square of the first number. 7^2 = 49, not 42.'
      }
    ],
    technical: [
      {
        text: 'What is the time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black)?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correct_answer: 'O(log n)',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'In a balanced BST, tree height is log(n), so lookup time is O(log n).'
      },
      {
        text: 'Which of the following sorting algorithms has the best worst-case time complexity?',
        options: ['Quick Sort', 'Merge Sort', 'Bubble Sort', 'Selection Sort'],
        correct_answer: 'Merge Sort',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Merge Sort has a guaranteed worst-case time complexity of O(n log n).'
      },
      {
        text: 'In Object-Oriented Programming, what does Polymorphism mean?',
        options: ['Hiding implementation details', 'Ability of different classes to respond to the same message in distinct ways', 'Inheriting attributes from parents', 'Combining data and methods into a single unit'],
        correct_answer: 'Ability of different classes to respond to the same message in distinct ways',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Polymorphism allows objects of different classes to be treated through a common interface.'
      },
      {
        text: 'Which SQL command is used to remove a table and its structure permanently from the database?',
        options: ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'],
        correct_answer: 'DROP',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'DROP removes the table schema and data completely from database catalog.'
      },
      {
        text: 'What is a deadlock condition in Operating Systems?',
        options: ['When CPU utilization is 100%', 'A state where a set of processes are blocked because each holds a resource and waits for another', 'When memory runs out of swap space', 'An infinite loop in user space code'],
        correct_answer: 'A state where a set of processes are blocked because each holds a resource and waits for another',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Deadlock happens when processes cannot proceed due to circular dependency on resources.'
      },
      {
        text: 'In computer networks, which layer of the OSI model does the HTTP protocol operate on?',
        options: ['Transport Layer', 'Network Layer', 'Session Layer', 'Application Layer'],
        correct_answer: 'Application Layer',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'HTTP is a Layer 7 (Application Layer) protocol.'
      },
      {
        text: 'What data structure is typically used for Breadth-First Search (BFS) graph traversal?',
        options: ['Stack', 'Queue', 'Priority Queue', 'Array'],
        correct_answer: 'Queue',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'BFS explores neighbor vertices level by level using a FIFO Queue.'
      },
      {
        text: 'Which normal form eliminates partial functional dependency?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correct_answer: '2NF',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: '2NF requires relations to be in 1NF and have no non-prime attribute partially dependent on candidate key.'
      },
      {
        text: 'What is the primary difference between a process and a thread?',
        options: ['Threads have separate address spaces', 'A thread shares the address space and memory with other threads in the same process', 'Processes are lighter than threads', 'Threads cannot run concurrently'],
        correct_answer: 'A thread shares the address space and memory with other threads in the same process',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Threads share process memory, file descriptors, and code segment while keeping independent stacks.'
      },
      {
        text: 'In JavaScript, what is the output of typeof null?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correct_answer: '"object"',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'In JavaScript legacy implementation, typeof null returns "object".'
      },
      {
        text: 'Which data structure is primarily used to implement function call stacks and recursion in compilers?',
        options: ['Queue', 'Stack', 'Heap', 'Tree'],
        correct_answer: 'Stack',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'The call stack follows LIFO (Last-In-First-Out) principle implemented via Stack.'
      },
      {
        text: 'What does ACID stand for in Database Management Systems?',
        options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Dependability', 'Audit, Cache, Index, Distribution', 'Accuracy, Concurrency, Iteration, Data'],
        correct_answer: 'Atomicity, Consistency, Isolation, Durability',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'ACID guarantees reliable processing of database transactions.'
      },
      {
        text: 'Which protocol is connection-oriented and ensures reliable data transfer across IP networks?',
        options: ['UDP', 'TCP', 'ICMP', 'IGMP'],
        correct_answer: 'TCP',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'TCP establishes a connection via 3-way handshake and guarantees packet ordering and delivery.'
      },
      {
        text: 'What is the worst-case time complexity of QuickSort?',
        options: ['O(log n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'],
        correct_answer: 'O(n^2)',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'When the chosen pivot is repeatedly the smallest or largest element, QuickSort degrades to O(n^2).'
      },
      {
        text: 'What is encapsulation in OOP?',
        options: ['Inheriting from multiple parents', 'Bundling data and methods together and restricting direct access to object internals', 'Overloading function names', 'Creating interfaces without implementation'],
        correct_answer: 'Bundling data and methods together and restricting direct access to object internals',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Encapsulation restricts direct access to some of an object\'s components to safeguard state integrity.'
      },
      {
        text: 'Which page replacement algorithm suffers from Belady\'s Anomaly?',
        options: ['LRU (Least Recently Used)', 'FIFO (First In First Out)', 'Optimal', 'LFU (Least Frequently Used)'],
        correct_answer: 'FIFO (First In First Out)',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'FIFO can result in more page faults when increasing page frames, known as Belady\'s Anomaly.'
      },
      {
        text: 'What is the purpose of an Index in relational databases?',
        options: ['To enforce encryption on records', 'To speed up data retrieval operations on a database table', 'To store backup copies of rows', 'To format output data as XML'],
        correct_answer: 'To speed up data retrieval operations on a database table',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Indices (such as B-trees) provide rapid pointers to find specific rows without full table scans.'
      },
      {
        text: 'Which HTTP status code indicates "Unauthorized" client access?',
        options: ['200', '400', '401', '403'],
        correct_answer: '401',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: '401 Unauthorized indicates authentication is required or credentials were invalid.'
      },
      {
        text: 'What does DNS stand for in computer networking?',
        options: ['Data Network Server', 'Domain Name System', 'Dynamic Node Structure', 'Distributed Network Socket'],
        correct_answer: 'Domain Name System',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'DNS translates human-readable domain names into IP addresses.'
      },
      {
        text: 'In Git, which command stages changes to prepare them for a commit?',
        options: ['git push', 'git branch', 'git add', 'git pull'],
        correct_answer: 'git add',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'git add stages working tree files for the next commit.'
      },
      {
        text: 'Which memory allocation scheme causes external fragmentation?',
        options: ['Paging', 'Segmentation with variable size blocks', 'Pure caching', 'Static array allocation'],
        correct_answer: 'Segmentation with variable size blocks',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Variable size dynamic partition allocation produces unusable scattered memory holes.'
      },
      {
        text: 'What is the auxiliary space complexity of Merge Sort on an array of size n?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correct_answer: 'O(n)',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Merge sort requires a temporary buffer of size O(n) during the merge phase.'
      },
      {
        text: 'What is the primary role of a subnet mask in IP networking?',
        options: ['To identify the physical MAC address', 'To distinguish between the network portion and the host portion of an IP address', 'To encrypt web traffic', 'To assign domain names'],
        correct_answer: 'To distinguish between the network portion and the host portion of an IP address',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Subnet mask divides the 32-bit IPv4 address into network ID and host ID.'
      },
      {
        text: 'Which data structure is best suited for implementing a priority queue?',
        options: ['Binary Heap', 'Linked List', 'Array', 'Hash Table'],
        correct_answer: 'Binary Heap',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'Binary Heap offers O(log n) insertion and extraction of min/max element.'
      },
      {
        text: 'In REST API design, which HTTP verb is idempotent and used to replace or update a resource completely?',
        options: ['POST', 'PUT', 'PATCH', 'CONNECT'],
        correct_answer: 'PUT',
        question_type: 'mcq',
        subcategory: 'technical',
        explanation: 'PUT is idempotent and replaces the target resource with request payload.'
      }
    ]
  },
  versant: {
    grammar: [
      {
        text: 'Neither the manager nor the employees _____ present at the meeting yesterday.',
        options: ['was', 'were', 'is', 'are'],
        correct_answer: 'were',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'When subjects are joined by "neither... nor", the verb agrees with the closer subject ("employees", plural).'
      },
      {
        text: 'She has been working on this design project _____ three weeks.',
        options: ['since', 'for', 'from', 'in'],
        correct_answer: 'for',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"For" is used with a period of duration ("three weeks"), while "since" specifies a starting point.'
      },
      {
        text: 'Identify the sentence with correct punctuation:',
        options: [
          'However, the results exceeded our expectations.',
          'However the results, exceeded our expectations.',
          'However the results exceeded, our expectations.',
          'However the results exceeded our expectations;'
        ],
        correct_answer: 'However, the results exceeded our expectations.',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Introductory transitional adverbs like "However" require a following comma.'
      },
      {
        text: 'If I _____ more time, I would have joined the training seminar.',
        options: ['had', 'have had', 'had had', 'would have'],
        correct_answer: 'had had',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Third conditional requires "had + past participle" in the if-clause: "had had".'
      },
      {
        text: 'The committee members submitted _____ recommendations to the board.',
        options: ['its', 'their', 'there', 'it\'s'],
        correct_answer: 'their',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"Committee members" is plural, requiring plural pronoun "their".'
      },
      {
        text: 'Choose the correct passive voice: "The chef prepared a delectable dessert."',
        options: [
          'A delectable dessert was prepared by the chef.',
          'A delectable dessert is prepared by the chef.',
          'A delectable dessert had been prepared by the chef.',
          'A delectable dessert was being prepared by the chef.'
        ],
        correct_answer: 'A delectable dessert was prepared by the chef.',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Simple past passive takes "was/were + V3": "was prepared".'
      },
      {
        text: 'He is proficient _____ analyzing complex financial data.',
        options: ['at', 'in', 'on', 'with'],
        correct_answer: 'in',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'We use the preposition "in" or "at" with proficient; standard usage in domain skills is "proficient in".'
      },
      {
        text: 'Scarcely had she finished speaking _____ the audience erupted into applause.',
        options: ['than', 'when', 'then', 'while'],
        correct_answer: 'when',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Correlative conjunction "Scarcely... when" is grammatically mandatory.'
      },
      {
        text: 'Which sentence uses the subjunctive mood correctly?',
        options: [
          'The manager insists that everyone arrives on time.',
          'The manager insists that everyone arrive on time.',
          'The manager insists that everyone will arrive on time.',
          'The manager insists that everyone arrived on time.'
        ],
        correct_answer: 'The manager insists that everyone arrive on time.',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Present subjunctive mandates the base form of the verb ("arrive").'
      },
      {
        text: 'Not only the teacher but also the students _____ thrilled about the victory.',
        options: ['was', 'were', 'is', 'has been'],
        correct_answer: 'were',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Subject closest to verb ("students") governs the plural verb "were".'
      },
      {
        text: 'She talks as if she _____ the CEO of the enterprise.',
        options: ['is', 'was', 'were', 'are'],
        correct_answer: 'were',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Unreal/hypothetical condition requires subjunctive "were".'
      },
      {
        text: 'Choose the correct form: "Each of the candidates _____ given fifteen minutes."',
        options: ['was', 'were', 'are', 'have been'],
        correct_answer: 'was',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"Each" is a singular indefinite pronoun requiring singular verb "was".'
      },
      {
        text: 'Identify the misplaced modifier in: "Walking down the avenue, the tall skyscraper came into view."',
        options: [
          'No error',
          'Dangling modifier: The skyscraper cannot walk down the avenue',
          'Incorrect preposition',
          'Wrong tense'
        ],
        correct_answer: 'Dangling modifier: The skyscraper cannot walk down the avenue',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'The participial phrase lacks an appropriate subject capable of walking.'
      },
      {
        text: 'Select the sentence with parallel structure:',
        options: [
          'She enjoys reading, to swim, and hiking.',
          'She enjoys reading, swimming, and hiking.',
          'She enjoys to read, swimming, and to hike.',
          'She enjoys reading, swimming, and hike.'
        ],
        correct_answer: 'She enjoys reading, swimming, and hiking.',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Parallel structure requires matching gerunds (-ing forms).'
      },
      {
        text: 'The equipment was distributed _____ the three laboratory teams.',
        options: ['between', 'among', 'in between', 'within'],
        correct_answer: 'among',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"Among" is used when referring to distribution among three or more entities.'
      },
      {
        text: 'By this time next year, Dr. Sharma _____ his clinical trial.',
        options: ['will complete', 'will have completed', 'has completed', 'is completing'],
        correct_answer: 'will have completed',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Future perfect tense ("will have completed") expresses an action completed by a specific future point.'
      },
      {
        text: 'Unless you submit the required paperwork, your application _____ processed.',
        options: ['will not be', 'would not be', 'shall be', 'is not'],
        correct_answer: 'will not be',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'First conditional uses present tense in unless clause and "will not be" in main clause.'
      },
      {
        text: 'It is essential that every delegate _____ their accreditation badge.',
        options: ['wear', 'wears', 'wore', 'wearing'],
        correct_answer: 'wear',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Mandative subjunctive requires the base verb form "wear".'
      },
      {
        text: 'The quality of these organic crops _____ remarkably consistent.',
        options: ['is', 'are', 'were', 'have been'],
        correct_answer: 'is',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Head noun is "quality" (singular), so verb must be singular "is".'
      },
      {
        text: 'He had no sooner entered the room _____ the telephone began to ring.',
        options: ['when', 'than', 'then', 'before'],
        correct_answer: 'than',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"No sooner" is followed by comparative conjunction "than".'
      },
      {
        text: 'Choose the correct indirect speech: He said, "I have lived here for five years."',
        options: [
          'He said that he lived there for five years.',
          'He said that he had lived there for five years.',
          'He said that he has lived here for five years.',
          'He said that he had lived here for five years.'
        ],
        correct_answer: 'He said that he had lived there for five years.',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Present perfect shifts to past perfect, and "here" changes to "there".'
      },
      {
        text: 'A large number of volunteers _____ registered for the awareness drive.',
        options: ['has', 'have', 'is', 'was'],
        correct_answer: 'have',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"A number of" takes a plural verb ("have").'
      },
      {
        text: 'This is the consultant _____ insights transformed our product strategy.',
        options: ['who', 'whom', 'whose', 'which'],
        correct_answer: 'whose',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Possessive relative pronoun "whose" is required before "insights".'
      },
      {
        text: 'The team was confident _____ securing the championship trophy.',
        options: ['of', 'about', 'to', 'for'],
        correct_answer: 'of',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: 'Standard idiom is "confident of doing something".'
      },
      {
        text: 'Hardly had the announcement been made _____ the crowd started cheering.',
        options: ['than', 'when', 'then', 'so'],
        correct_answer: 'when',
        question_type: 'mcq',
        subcategory: 'grammar',
        explanation: '"Hardly... when" is the correct correlative pair.'
      }
    ],
    reading: [
      {
        text: 'Read the sentence and choose the correct completion:\n"Despite rigorous market headwinds, the renewable startup demonstrated surprising _____, turning a profit within its second fiscal quarter."',
        options: ['fragility', 'resilience', 'indolence', 'mediocrity'],
        correct_answer: 'resilience',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Despite headwinds" signals contrast; "resilience" fits turning a profit despite adversity.'
      },
      {
        text: 'Passage: "Urban sprawl often fragments natural habitats, forcing wildlife into smaller ecological pockets. This isolation curtails genetic exchange among populations."\nWhat is the primary consequence highlighted?',
        options: [
          'Increase in wild biodiversity',
          'Restricted genetic diversity due to isolated habitats',
          'Immediate extinction of all forest animals',
          'Better protection from natural predators'
        ],
        correct_answer: 'Restricted genetic diversity due to isolated habitats',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'The passage explicitly notes that isolation curtails genetic exchange.'
      },
      {
        text: 'Choose the word that best completes the passage:\n"The keynote speaker was renowned for her _____ rhetoric; she persuaded even the staunchest critics to re-evaluate their positions."',
        options: ['monotonous', 'compelling', 'vague', 'hesitant'],
        correct_answer: 'compelling',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Persuading staunch critics requires powerful, compelling rhetoric.'
      },
      {
        text: 'What is the tone of the sentence: "While the initial prototypes fell short of our targets, each iteration yielded invaluable telemetry that accelerated our core breakthrough."',
        options: ['Pessimistic and defeated', 'Constructive and analytical', 'Cynical and mocking', 'Aggressive and defensive'],
        correct_answer: 'Constructive and analytical',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'The tone recognizes setbacks but values the resulting insights constructively.'
      },
      {
        text: 'Complete the sentence:\n"The regulatory framework was designed to be _____, allowing adjustments as emerging technologies matured."',
        options: ['rigid', 'obsolete', 'pliable', 'cumbersome'],
        correct_answer: 'pliable',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Pliable" means adaptable and flexible to future adjustments.'
      },
      {
        text: 'Passage: "Microbiome research suggests that gut flora influence not only metabolic homeostasis but also neurological signalling through the gut-brain axis."\nAccording to the author:',
        options: [
          'Gut bacteria affect digestion exclusively',
          'Gut flora have multidimensional effects spanning metabolism and brain communication',
          'The nervous system operates independent of the digestive tract',
          'Metabolic homeostasis is entirely unaffected by diet'
        ],
        correct_answer: 'Gut flora have multidimensional effects spanning metabolism and brain communication',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'The passage directly links gut flora to metabolic balance and neurological signaling.'
      },
      {
        text: 'Identify the synonym in context for "tenuous" in: "His grasp on the fundamental principles remained tenuous."',
        options: ['Robust', 'Precarious', 'Profound', 'Exemplary'],
        correct_answer: 'Precarious',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Tenuous" means weak, thin, or precarious.'
      },
      {
        text: 'Sentence completion:\n"The CEO\'s speech was marked by extreme _____; she said in three minutes what previous executives took an hour to articulate."',
        options: ['verbosity', 'succinctness', 'ambiguity', 'prolixity'],
        correct_answer: 'succinctness',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Expressing thoughts in three minutes instead of an hour is succinctness.'
      },
      {
        text: 'Passage: "Unlike classical algorithms that require deterministic pathways, neural networks extract probabilistic representations from high-dimensional datasets."\nWhat differentiates neural networks in this passage?',
        options: [
          'They rely on hardcoded sequential instructions',
          'They formulate probabilistic patterns from complex data',
          'They cannot process high-dimensional inputs',
          'They operate slower than mechanical calculators'
        ],
        correct_answer: 'They formulate probabilistic patterns from complex data',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Neural networks extract probabilistic representations from high-dimensional datasets.'
      },
      {
        text: 'Which inference is most valid?\n"Every participant who logged more than 50 practice hours passed the assessment with honors."',
        options: [
          'Logging 50+ hours was a sufficient condition to achieve honors',
          'No one who logged under 50 hours passed',
          'The exam was too easy for all candidates',
          'Practice hours had no correlation with outcomes'
        ],
        correct_answer: 'Logging 50+ hours was a sufficient condition to achieve honors',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'The statement guarantees that anyone crossing 50 practice hours passed with honors.'
      },
      {
        text: 'Complete the sentence:\n"Rather than settling into complacency, the scientific team pursued their hypothesis with _____ vigor."',
        options: ['diminishing', 'intermittent', 'relentless', 'superficial'],
        correct_answer: 'relentless',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Rather than complacency" indicates tireless, relentless pursuit.'
      },
      {
        text: 'Passage: "Ocean acidification, spurred by elevated atmospheric CO2 absorption, impedes calcification in marine organisms, jeopardizing coral reef structures."\nWhat directly harms coral reefs according to the passage?',
        options: [
          'Warmer surface winds only',
          'Decreased calcification caused by ocean acidification',
          'Overfishing of pelagic sharks',
          'Excessive sunlight penetration'
        ],
        correct_answer: 'Decreased calcification caused by ocean acidification',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Impeded calcification from acidification directly threatens coral reefs.'
      },
      {
        text: 'Select the best summary:\n"A company adopting decentralized decision-making often empowers local teams to innovate faster, though coordination overhead can occasionally introduce inconsistencies."',
        options: [
          'Decentralization is uniformly flawed and inefficient',
          'Decentralization accelerates frontline innovation but requires managing coordination friction',
          'Centralized management is superior in all operational dimensions',
          'Innovation can only happen when every decision is approved by executive committees'
        ],
        correct_answer: 'Decentralization accelerates frontline innovation but requires managing coordination friction',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Captures both the primary benefit (faster innovation) and the trade-off (coordination friction).'
      },
      {
        text: 'Choose the word that fits:\n"Her argument was backed by _____ empirical data that withstood the committee\'s rigorous peer review."',
        options: ['dubious', 'impeccable', 'negligible', 'anecdotal'],
        correct_answer: 'impeccable',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Withstanding rigorous peer review indicates flawless, impeccable data.'
      },
      {
        text: 'What does "ostensibly" mean in: "The policy was ostensibly created to protect consumer privacy, but critics argued it served proprietary interests."?',
        options: ['Apparently or purportedly', 'Secretly and unlawfully', 'Universally recognized', 'Accidentally implemented'],
        correct_answer: 'Apparently or purportedly',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Ostensibly" refers to stated or apparent intention contrasted with hidden realities.'
      },
      {
        text: 'Sentence completion:\n"The diplomat maintained an attitude of strict _____, ensuring neither conflicting party felt biased against."',
        options: ['partisanship', 'impartiality', 'hostility', 'indifference'],
        correct_answer: 'impartiality',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'To prevent bias against either side, impartiality is required.'
      },
      {
        text: 'Passage: "Electric vehicle range anxiety is diminishing as battery energy density improves and fast-charging corridors expand along major transit arteries."\nWhat are the two factors reducing range anxiety?',
        options: [
          'Lower gas prices and road taxes',
          'Higher battery density and expanded fast-charging networks',
          'Public transit subsidies and rail transit',
          'Smaller car chassis and slower highway speeds'
        ],
        correct_answer: 'Higher battery density and expanded fast-charging networks',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Directly stated: battery energy density improvements and fast-charging expansion.'
      },
      {
        text: 'Choose the most coherent sequence for sentences 1-3:\n1. Consequently, early adopters realized significant competitive edges.\n2. In 2020, cloud migration accelerated worldwide.\n3. Organizations that embraced virtualization optimized operating expenses.',
        options: ['2 -> 3 -> 1', '1 -> 2 -> 3', '3 -> 1 -> 2', '2 -> 1 -> 3'],
        correct_answer: '2 -> 3 -> 1',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Starts with background (2020 migration), explains mechanism (optimization), and concludes with results (edges).'
      },
      {
        text: 'Identify the intended meaning of "lucid" in: "The professor delivered a lucid exposition of quantum entanglement."',
        options: ['Cloudy and abstract', 'Clear and readily understood', 'Lengthy and exhausting', 'Boring and dull'],
        correct_answer: 'Clear and readily understood',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Lucid" means clear and easy to understand.'
      },
      {
        text: 'Complete the sentence:\n"The archaeological expedition uncovered artifacts that were previously thought to be _____ to antiquity."',
        options: ['lost', 'immune', 'hostile', 'foreign'],
        correct_answer: 'lost',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Artifacts "lost to antiquity" is the natural idiomatic expression.'
      },
      {
        text: 'Passage: "Remote telemetry allows aerospace engineers to monitor sub-millimeter structural deflections in real time during atmospheric re-entry."\nWhat does this technology primarily safeguard?',
        options: [
          'In-cabin passenger entertainment systems',
          'Structural integrity assessment under extreme flight stress',
          'Air traffic scheduling at destination airports',
          'Post-flight baggage handling'
        ],
        correct_answer: 'Structural integrity assessment under extreme flight stress',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Monitoring structural deflections in real time monitors aircraft integrity.'
      },
      {
        text: 'Choose the best completion:\n"His explanation was so _____ that no one in the seminar had any follow-up questions."',
        options: ['convoluted', 'comprehensive', 'fragmentary', 'evasive'],
        correct_answer: 'comprehensive',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'A comprehensive explanation leaves no room for confusion or unanswered questions.'
      },
      {
        text: 'Identify the flaw in reasoning: "Sales rose after our rebranding campaign; therefore, rebranding was the sole driver of revenue growth."',
        options: [
          'Confusing correlation with sole causation (Post hoc ergo propter hoc)',
          'Ad hominem personal attack',
          'Circular definition',
          'Appeal to authority'
        ],
        correct_answer: 'Confusing correlation with sole causation (Post hoc ergo propter hoc)',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Assuming an event caused an outcome solely because it occurred beforehand is a causal fallacy.'
      },
      {
        text: 'Sentence completion:\n"Rather than being deterred by initial setbacks, the research unit demonstrated remarkable _____."',
        options: ['hesitation', 'perseverance', 'apathy', 'recklessness'],
        correct_answer: 'perseverance',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: '"Rather than being deterred" requires positive persistence: perseverance.'
      },
      {
        text: 'What does "pragmatic" imply in: "We chose a pragmatic roadmap over an idealistic one."?',
        options: ['Theoretical and abstract', 'Practical and outcome-oriented', 'Careless and hasty', 'Expensive and complex'],
        correct_answer: 'Practical and outcome-oriented',
        question_type: 'mcq',
        subcategory: 'reading',
        explanation: 'Pragmatic means practical, grounded, and focused on sensible execution.'
      }
    ],
    listening: [
      {
        text: 'Listen/Read prompt: "The engineering conference keynote will commence in the main auditorium at 10:15 AM tomorrow."\nQuestion: What time will the keynote begin?',
        options: ['10:00 AM', '10:15 AM', '10:30 AM', '11:15 AM'],
        correct_answer: '10:15 AM',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Directly stated: 10:15 AM tomorrow in the main auditorium.'
      },
      {
        text: 'Audio context: "Please note that flight AA-402 to Chicago has been moved from gate B12 to gate C8 due to maintenance."\nWhere should Chicago passengers board?',
        options: ['Gate B12', 'Gate C8', 'Gate A4', 'Gate C12'],
        correct_answer: 'Gate C8',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'The flight has been moved to gate C8.'
      },
      {
        text: 'Conversation: "John: Did you finish the monthly revenue reconciliation?\nSarah: I sent the draft to Priya this morning for auditing."\nWhat did Sarah do with the reconciliation report?',
        options: ['Filed it in archives', 'Sent it to Priya for auditing', 'Discarded the draft', 'Scheduled a client meeting'],
        correct_answer: 'Sent it to Priya for auditing',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Sarah sent the draft to Priya for auditing.'
      },
      {
        text: 'Audio context: "All library study rooms must be reserved at least 24 hours in advance via the campus portal."\nHow far in advance must study rooms be booked?',
        options: ['12 hours', '24 hours', '48 hours', 'One week'],
        correct_answer: '24 hours',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Prompt requires at least 24 hours advance reservation.'
      },
      {
        text: 'Speaker prompt: "Dr. Evans recommended increasing cardiovascular exercise to thirty minutes daily."\nWhat was Dr. Evans\' recommendation?',
        options: ['30 minutes of cardio per week', '30 minutes of cardio daily', '60 minutes of weight lifting', 'Rest completely for two weeks'],
        correct_answer: '30 minutes of cardio daily',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Thirty minutes of cardiovascular exercise daily was recommended.'
      },
      {
        text: 'Voice note: "Hey Mark, can you pick up three extra dry-erase markers and a flipchart pad before the 2 PM brainstorming session?"\nWhat items does the speaker need?',
        options: ['Pens and paper clips', 'Dry-erase markers and a flipchart pad', 'Laptops and HDMI cables', 'Coffee and donuts'],
        correct_answer: 'Dry-erase markers and a flipchart pad',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Requested three dry-erase markers and a flipchart pad.'
      },
      {
        text: 'Announcement: "Passengers for the blue line train must transfer at Central Station to access the airport branch."\nWhere must passengers transfer for the airport?',
        options: ['North Terminal', 'Central Station', 'West Boulevard', 'Grand Avenue'],
        correct_answer: 'Central Station',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Transfer at Central Station for the airport branch.'
      },
      {
        text: 'Dialogue: "Customer: Is there an expedited shipping option available?\nAgent: Yes, next-day delivery is available for orders placed before 3 PM."\nWhat condition enables next-day delivery?',
        options: ['Placing the order before 3 PM', 'Spending over $100', 'Being a premium member', 'Picking up in store'],
        correct_answer: 'Placing the order before 3 PM',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Orders placed before 3 PM qualify for next-day delivery.'
      },
      {
        text: 'Notice: "Due to software upgrades, the student grading portal will be offline between 1:00 AM and 4:00 AM this Sunday."\nHow long will the scheduled maintenance last?',
        options: ['1 hour', '2 hours', '3 hours', '5 hours'],
        correct_answer: '3 hours',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'From 1:00 AM to 4:00 AM is 3 hours duration.'
      },
      {
        text: 'Voice message: "Hi Lisa, Professor Chen requested that we bring our printed project proposals to Thursday\'s seminar."\nWhat should students bring on Thursday?',
        options: ['Textbooks', 'Printed project proposals', 'Calculator', 'ID cards'],
        correct_answer: 'Printed project proposals',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Professor Chen requested printed project proposals.'
      },
      {
        text: 'Instruction: "Before launching the unit test suite, ensure the local Redis instance is active on port 6379."\nWhat service must be active on port 6379?',
        options: ['MongoDB', 'PostgreSQL', 'Redis', 'Kafka'],
        correct_answer: 'Redis',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Local Redis instance must be active.'
      },
      {
        text: 'Announcement: "The campus cafeteria will offer vegetarian and gluten-free luncheon selections every Tuesday and Thursday."\nOn which days are the special luncheon options offered?',
        options: ['Monday and Wednesday', 'Tuesday and Thursday', 'Wednesday and Friday', 'Only on weekends'],
        correct_answer: 'Tuesday and Thursday',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Tuesday and Thursday.'
      },
      {
        text: 'Meeting excerpt: "Our preliminary telemetry indicates server load spikes sharply at 7:30 PM across the European region."\nWhen does server load peak?',
        options: ['7:30 AM', '7:30 PM', '12:00 PM', 'Midnight'],
        correct_answer: '7:30 PM',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Peak occurs at 7:30 PM.'
      },
      {
        text: 'HR briefing: "All remote employees must submit their quarterly expense documentation by the final working day of September."\nWhat is the deadline for expense filings?',
        options: ['First day of September', 'Mid-September', 'Final working day of September', 'End of October'],
        correct_answer: 'Final working day of September',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Deadline is the final working day of September.'
      },
      {
        text: 'Weather warning: "Heavy gale warnings are in effect for coastal sectors; boaters are advised to remain in harbour until Friday dawn."\nWhen is it advised for boaters to stay in harbour?',
        options: ['Until Wednesday evening', 'Until Thursday noon', 'Until Friday dawn', 'Until Saturday afternoon'],
        correct_answer: 'Until Friday dawn',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Boaters are advised to remain in harbour until Friday dawn.'
      },
      {
        text: 'Radio host: "Tickets for the international jazz festival will go on public sale starting at 9 AM tomorrow on the official festival website."\nWhere can festival tickets be purchased?',
        options: ['At the box office in person', 'On the official festival website', 'At local music stores', 'Through postal mail'],
        correct_answer: 'On the official festival website',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Tickets will go on sale on the official festival website.'
      },
      {
        text: 'Call center audio: "If you are calling to schedule an international visa appointment, please press three now."\nWhich key should visa applicants press?',
        options: ['One', 'Two', 'Three', 'Four'],
        correct_answer: 'Three',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Press three for international visa appointments.'
      },
      {
        text: 'Lecture summary: "Isaac Newton published his Philosophiae Naturalis Principia Mathematica in the year 1687."\nIn what year was the Principia published?',
        options: ['1642', '1687', '1704', '1727'],
        correct_answer: '1687',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Published in 1687.'
      },
      {
        text: 'Voicemail: "Dr. Watson\'s clinic has rescheduled your dental cleaning from 2:00 PM to 3:30 PM this Friday."\nWhat is the new appointment time?',
        options: ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'],
        correct_answer: '3:30 PM',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Rescheduled to 3:30 PM.'
      },
      {
        text: 'Tech broadcast: "The new patch resolves the memory buffer overflow vulnerability reported in version 2.4."\nWhat issue does the patch resolve?',
        options: ['Slow internet speeds', 'Memory buffer overflow vulnerability', 'Battery drainage', 'Screen display flicker'],
        correct_answer: 'Memory buffer overflow vulnerability',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'It resolves memory buffer overflow vulnerability.'
      },
      {
        text: 'Facility notice: "Recyclable containers should be placed in the blue receptacles, while organic compost belongs in the green bins."\nWhich bins are reserved for organic compost?',
        options: ['Blue receptacles', 'Green bins', 'Yellow carts', 'Black bins'],
        correct_answer: 'Green bins',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Organic compost belongs in green bins.'
      },
      {
        text: 'Manager voice memo: "Team, we have achieved ninety-five percent of our quarterly quota with three weeks still remaining."\nWhat percentage of quota has been reached?',
        options: ['85%', '90%', '95%', '100%'],
        correct_answer: '95%',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Ninety-five percent was achieved.'
      },
      {
        text: 'Security broadcast: "Please do not leave personal baggage unattended at any time in terminal concourses."\nWhat instruction is given to passengers?',
        options: ['Check bags immediately', 'Do not leave baggage unattended', 'Only carry clear plastic bags', 'Store luggage in coin lockers'],
        correct_answer: 'Do not leave baggage unattended',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Do not leave baggage unattended.'
      },
      {
        text: 'Customer message: "The replacement battery arrived safely, but the package was missing the installation screwdriver."\nWhat was missing from the package?',
        options: ['The battery itself', 'The user manual', 'The installation screwdriver', 'The warranty card'],
        correct_answer: 'The installation screwdriver',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'The installation screwdriver was missing.'
      },
      {
        text: 'Laboratory safety: "Protective polycarbonate eyewear must be worn whenever chemical reagents are handled under the fume hood."\nWhat safety gear is mandatory?',
        options: ['Earplugs', 'Protective polycarbonate eyewear', 'Steel-toed boots', 'Respirator mask'],
        correct_answer: 'Protective polycarbonate eyewear',
        question_type: 'mcq',
        subcategory: 'listening',
        explanation: 'Polycarbonate eyewear must be worn.'
      }
    ],
    speaking: [
      {
        text: 'Please repeat the sentence clearly: "Artificial intelligence is transforming contemporary software engineering."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Artificial intelligence is transforming contemporary software engineering.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Focus on clear pronunciation and rhythmic fluency.'
      },
      {
        text: 'Please repeat the sentence clearly: "The research laboratory will publish its clinical findings next Tuesday."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'The research laboratory will publish its clinical findings next Tuesday.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Maintain steady pace and clear enunciation.'
      },
      {
        text: 'Short question: "If you wish to borrow a textbook for two weeks, what campus building do you visit?"',
        options: ['Library', 'Cafeteria', 'Gymnasium', 'Dormitory'],
        correct_answer: 'Library',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'A library is where textbooks are borrowed.'
      },
      {
        text: 'Please repeat the sentence clearly: "Effective communication and active listening foster resilient teamwork."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Effective communication and active listening foster resilient teamwork.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Clear articulation of "communication" and "resilient".'
      },
      {
        text: 'Short question: "What instrument is used to determine whether someone has a fever?"',
        options: ['Thermometer', 'Barometer', 'Speedometer', 'Chronometer'],
        correct_answer: 'Thermometer',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'A thermometer measures body temperature.'
      },
      {
        text: 'Please repeat the sentence clearly: "Renewable solar installations provide clean electrical power for regional communities."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Renewable solar installations provide clean electrical power for regional communities.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Clear pronunciation of compound terms.'
      },
      {
        text: 'Short question: "Which season follows autumn and precedes spring?"',
        options: ['Summer', 'Winter', 'Monsoon', 'Pre-autumn'],
        correct_answer: 'Winter',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Winter comes after autumn and before spring.'
      },
      {
        text: 'Please repeat the sentence clearly: "Our cross-functional teams collaborated seamlessly throughout the product launch."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Our cross-functional teams collaborated seamlessly throughout the product launch.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Maintain natural intonation.'
      },
      {
        text: 'Short question: "If an item is available without any cost or payment, what word describes it?"',
        options: ['Free', 'Expensive', 'Defective', 'Taxable'],
        correct_answer: 'Free',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: '"Free" or complimentary.'
      },
      {
        text: 'Please repeat the sentence clearly: "Sustainable architectural design minimizes energy consumption and structural waste."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Sustainable architectural design minimizes energy consumption and structural waste.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Enunciate "sustainable architectural design" clearly.'
      },
      {
        text: 'Short question: "What celestial body does the Earth revolve around?"',
        options: ['The Sun', 'The Moon', 'Mars', 'Jupiter'],
        correct_answer: 'The Sun',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'The Earth revolves around the Sun.'
      },
      {
        text: 'Please repeat the sentence clearly: "High-speed optical fiber networks accelerate global data transmission speeds."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'High-speed optical fiber networks accelerate global data transmission speeds.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Pronounce "optical fiber" and "accelerate" smoothly.'
      },
      {
        text: 'Short question: "How many months are in a standard calendar year?"',
        options: ['10', '12', '14', '52'],
        correct_answer: '12',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'There are 12 months in a calendar year.'
      },
      {
        text: 'Please repeat the sentence clearly: "The analytical metrics demonstrate consistent improvement across key performance indices."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'The analytical metrics demonstrate consistent improvement across key performance indices.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Clear pronunciation of "indices" and "analytical".'
      },
      {
        text: 'Short question: "What professional designs bridges, roads, and large infrastructure projects?"',
        options: ['Civil Engineer', 'Cardiologist', 'Chef', 'Sculptor'],
        correct_answer: 'Civil Engineer',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Civil engineers design infrastructure projects.'
      },
      {
        text: 'Please repeat the sentence clearly: "Continuous integration ensures rapid feedback for distributed development teams."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Continuous integration ensures rapid feedback for distributed development teams.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Speak clearly and steadily.'
      },
      {
        text: 'Short question: "What is the frozen, solid state of water called?"',
        options: ['Steam', 'Ice', 'Vapor', 'Plasma'],
        correct_answer: 'Ice',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Solid water is ice.'
      },
      {
        text: 'Please repeat the sentence clearly: "Customer feedback prompted significant improvements in our user interface."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Customer feedback prompted significant improvements in our user interface.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Pronounce "improvements" and "interface" clearly.'
      },
      {
        text: 'Short question: "Which direction is directly opposite to West on a standard compass?"',
        options: ['North', 'South', 'East', 'North-West'],
        correct_answer: 'East',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'East is opposite to West.'
      },
      {
        text: 'Please repeat the sentence clearly: "The executive committee unanimously approved the proposed expansion roadmap."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'The executive committee unanimously approved the proposed expansion roadmap.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Focus on "unanimously approved".'
      },
      {
        text: 'Short question: "If you deposit currency into a savings account, where are you keeping it?"',
        options: ['In a Bank', 'In a Bakery', 'In a Library', 'In a Museum'],
        correct_answer: 'In a Bank',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Currency is deposited into a bank.'
      },
      {
        text: 'Please repeat the sentence clearly: "Empirical evidence substantiated the preliminary scientific hypothesis."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Empirical evidence substantiated the preliminary scientific hypothesis.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Clear articulation of "substantiated" and "hypothesis".'
      },
      {
        text: 'Short question: "What is the capital city of France?"',
        options: ['London', 'Berlin', 'Paris', 'Rome'],
        correct_answer: 'Paris',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Paris is the capital of France.'
      },
      {
        text: 'Please repeat the sentence clearly: "Strong interpersonal relationships enhance workplace productivity and employee morale."',
        options: ['Pronounce accurately and clearly'],
        correct_answer: 'Strong interpersonal relationships enhance workplace productivity and employee morale.',
        question_type: 'sentence',
        subcategory: 'speaking',
        explanation: 'Emphasize "interpersonal" and "productivity".'
      },
      {
        text: 'Short question: "What tool with two sharp blades joined in the middle is used to cut paper?"',
        options: ['Scissors', 'Hammer', 'Screwdriver', 'Ruler'],
        correct_answer: 'Scissors',
        question_type: 'mcq',
        subcategory: 'speaking',
        explanation: 'Scissors are used to cut paper.'
      }
    ],
    writing: [
      {
        text: 'Identify the sentence with the most professional business tone:',
        options: [
          'Hey folks, our sales were super terrible last month, fix it ASAP.',
          'Our preliminary monthly sales metrics indicate a variance from targets that requires strategic realignments.',
          'Sales sucked last month and everybody needs to hustle big time.',
          'Sales were down, whatever, let\'s see what happens next.'
        ],
        correct_answer: 'Our preliminary monthly sales metrics indicate a variance from targets that requires strategic realignments.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Professional business writing emphasizes objective metrics and constructive strategic realignment.'
      },
      {
        text: 'Which sentence demonstrates correct comma splice correction?',
        options: [
          'The meeting concluded early, the attendees departed for lunch.',
          'The meeting concluded early; consequently, the attendees departed for lunch.',
          'The meeting concluded early the attendees departed for lunch.',
          'The meeting concluded early, so therefore the attendees departed for lunch.'
        ],
        correct_answer: 'The meeting concluded early; consequently, the attendees departed for lunch.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Joining two independent clauses requires a semicolon with a conjunctive adverb.'
      },
      {
        text: 'Choose the best opening for a professional email requesting project updates:',
        options: [
          'I hope this message finds you well. Could you kindly share the status of the sprint deliverables?',
          'Send me the updates right now.',
          'What is taking so long with your sprint deliverables?',
          'Just checking if you are still working or not.'
        ],
        correct_answer: 'I hope this message finds you well. Could you kindly share the status of the sprint deliverables?',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Polite, clear, and professional request.'
      },
      {
        text: 'Which word transition best establishes a cause-and-effect relationship?',
        options: ['Consequently', 'Similarly', 'Furthermore', 'Nevertheless'],
        correct_answer: 'Consequently',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"Consequently" establishes direct causal consequence.'
      },
      {
        text: 'Select the most concise and direct phrasing:',
        options: [
          'Due to the fact that the server was offline, the team was unable to work.',
          'Because the server was offline, the team could not work.',
          'In light of the circumstance surrounding the offline server, work was unworkable.',
          'Owing to the reason that the server experienced downtime, the team didn\'t work.'
        ],
        correct_answer: 'Because the server was offline, the team could not work.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Replaces wordy idioms ("Due to the fact that") with a direct and active "Because".'
      },
      {
        text: 'Which sentence adheres strictly to standard formal written grammar?',
        options: [
          'Whom shall I state is calling?',
          'Who shall I say is calling?',
          'Whom is calling on the line?',
          'Who is it that I should say whom called?'
        ],
        correct_answer: 'Who shall I say is calling?',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"Who" is the subject of the clause "is calling".'
      },
      {
        text: 'Choose the most appropriate concluding remark for a client proposal email:',
        options: [
          'Let me know when you feel like reading this.',
          'We look forward to collaborating with your team and are available to address any questions.',
          'Hoping you don\'t reject this proposal.',
          'Call me whenever.'
        ],
        correct_answer: 'We look forward to collaborating with your team and are available to address any questions.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Professional, courteous, and opens a constructive communication channel.'
      },
      {
        text: 'Identify the redundant phrasing in: "The team collaborated together to create a brand new innovation."',
        options: [
          '"collaborated together" and "new innovation"',
          '"The team"',
          '"to create"',
          'No redundancy found'
        ],
        correct_answer: '"collaborated together" and "new innovation"',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Collaboration inherently implies togetherness, and an innovation is inherently new.'
      },
      {
        text: 'Select the sentence that avoids passive voice for impactful technical reporting:',
        options: [
          'The security vulnerability was patched by our DevOps team within two hours.',
          'Our DevOps team patched the security vulnerability within two hours.',
          'A patch was deployed by the DevOps engineers to remedy the issue.',
          'The vulnerability was addressed within two hours by DevOps.'
        ],
        correct_answer: 'Our DevOps team patched the security vulnerability within two hours.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Active voice directly attributes the action to the subject ("Our DevOps team patched...").'
      },
      {
        text: 'Which sentence displays proper use of an apostrophe for plural possession?',
        options: [
          'The students desks were organized neatly.',
          'The students\' desks were organized neatly.',
          'The student\'s desks were organized neatly (referring to thirty students).',
          'The students\'s desks were organized neatly.'
        ],
        correct_answer: 'The students\' desks were organized neatly.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Plural nouns ending in s take an apostrophe at the end: students\'.'
      },
      {
        text: 'Choose the best phrasing to express polite disagreement in a meeting memo:',
        options: [
          'Your perspective is totally incorrect.',
          'While I appreciate your points, our telemetry suggests a different operational outcome.',
          'I don\'t agree with anything said so far.',
          'That proposal makes no logical sense.'
        ],
        correct_answer: 'While I appreciate your points, our telemetry suggests a different operational outcome.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Diplomatic, evidence-based disagreement.'
      },
      {
        text: 'Identify the sentence with correct subject-verb agreement:',
        options: [
          'A series of workshops is scheduled for next month.',
          'A series of workshops are scheduled for next month.',
          'A series of workshops were being scheduled for next month.',
          'A series of workshops have scheduled for next month.'
        ],
        correct_answer: 'A series of workshops is scheduled for next month.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"A series" is singular, taking the singular verb "is".'
      },
      {
        text: 'Which transition word indicates contrast?',
        options: ['Furthermore', 'Conversely', 'Similarly', 'In addition'],
        correct_answer: 'Conversely',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"Conversely" introduces an opposing or contrasting premise.'
      },
      {
        text: 'Select the sentence with proper hyphenation for a compound adjective:',
        options: [
          'She presented a state of the art telemetry solution.',
          'She presented a state-of-the-art telemetry solution.',
          'She presented a state of-the-art telemetry solution.',
          'She presented a state-of the art telemetry solution.'
        ],
        correct_answer: 'She presented a state-of-the-art telemetry solution.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Compound adjectives before a noun are hyphenated: state-of-the-art.'
      },
      {
        text: 'Choose the clearest sentence with appropriate antecedent reference:',
        options: [
          'When Alex met Carlos, he told him his project had passed review.',
          'Alex informed Carlos that Carlos\'s project had passed review.',
          'He told him that he had passed review.',
          'Alex told Carlos that he himself passed his review.'
        ],
        correct_answer: 'Alex informed Carlos that Carlos\'s project had passed review.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Eliminates ambiguous pronoun references ("he/him").'
      },
      {
        text: 'Which sentence uses quotation marks correctly in American English writing?',
        options: [
          'The manager emphasized, "Quality is our top priority".',
          'The manager emphasized, "Quality is our top priority."',
          'The manager emphasized "Quality is our top priority".',
          'The manager emphasized ",Quality is our top priority".'
        ],
        correct_answer: 'The manager emphasized, "Quality is our top priority."',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'In standard American English, commas and periods go inside quotation marks.'
      },
      {
        text: 'Identify the sentence that correctly uses the word "affect":',
        options: [
          'The interest rate hike had a noticeable affect on mortgages.',
          'The interest rate hike will affect market sentiment directly.',
          'The affect of the change was immediate.',
          'How does the new rule affectation our teams?'
        ],
        correct_answer: 'The interest rate hike will affect market sentiment directly.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"Affect" is predominantly a verb meaning to influence.'
      },
      {
        text: 'Which sentence is free of grammatical fragments?',
        options: [
          'Because the shipment arrived later than anticipated.',
          'Although the test passed, further validation is required before production deployment.',
          'Running across the campus lawn with documents in hand.',
          'In order to satisfy regulatory compliance.'
        ],
        correct_answer: 'Although the test passed, further validation is required before production deployment.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Contains both a dependent clause and a complete independent clause.'
      },
      {
        text: 'Select the optimal heading style for a formal engineering document:',
        options: [
          'COOL THINGS WE BUILT',
          'System Architecture and Component Design',
          'stuff about servers and code',
          'LOOK HERE: System Specs!'
        ],
        correct_answer: 'System Architecture and Component Design',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Professional title case with concise, descriptive terminology.'
      },
      {
        text: 'Choose the sentence that correctly distinguishes between "complement" and "compliment":',
        options: [
          'Her strategic skills compliment his technical expertise.',
          'Her strategic skills complement his technical expertise.',
          'He paid her a sincere complement on her presentation.',
          'The two colors complement each other with sweet words.'
        ],
        correct_answer: 'Her strategic skills complement his technical expertise.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: '"Complement" means to complete or pair well with something.'
      },
      {
        text: 'Which sentence correctly structures an enumerated list in a memo?',
        options: [
          'We must: 1. reduce costs, 2. speed delivery, and 3. to improve quality.',
          'Our objectives are to: 1. reduce costs, 2. accelerate delivery, and 3. improve quality.',
          'Our objectives are: reduce costs, to accelerate delivery, improving quality.',
          'We will: 1. reducing cost, 2. accelerate delivery.'
        ],
        correct_answer: 'Our objectives are to: 1. reduce costs, 2. accelerate delivery, and 3. improve quality.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Maintains grammatical parallelism across all enumerated items.'
      },
      {
        text: 'Identify the sentence with correct capitalization:',
        options: [
          'the President of the company visited the Seattle Office.',
          'The president of the company visited the Seattle office.',
          'The President of The Company visited the seattle office.',
          'the president of the Company visited the Seattle office.'
        ],
        correct_answer: 'The president of the company visited the Seattle office.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Common nouns ("president", "company", "office") are lowercase unless preceding a proper name; "Seattle" is capitalized.'
      },
      {
        text: 'Select the most polite escalation statement for an overdue milestone:',
        options: [
          'You are way past the deadline and we are going to report you.',
          'As the milestone is now past due, please provide an updated completion timeline by 3 PM.',
          'Why did you miss the deadline again?',
          'Milestone missed, this is completely unacceptable.'
        ],
        correct_answer: 'As the milestone is now past due, please provide an updated completion timeline by 3 PM.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Assertive, objective, polite, and actionable.'
      },
      {
        text: 'Which phrasing avoids conversational jargon in a scientific report?',
        options: [
          'The telemetry went bonkers during the stress phase.',
          'The telemetry exhibited significant anomalous variance during the stress phase.',
          'The data went crazy when we pushed it.',
          'The numbers went through the roof.'
        ],
        correct_answer: 'The telemetry exhibited significant anomalous variance during the stress phase.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Scientific writing uses precise, objective terminology.'
      },
      {
        text: 'Choose the sentence that correctly employs the semicolon:',
        options: [
          'I wanted to attend; but I was ill.',
          'The report is comprehensive; it covers all relevant financial metrics.',
          'Whenever you are ready; please let me know.',
          'Because of the delay; the train arrived late.'
        ],
        correct_answer: 'The report is comprehensive; it covers all relevant financial metrics.',
        question_type: 'mcq',
        subcategory: 'writing',
        explanation: 'Connects two closely related independent clauses without a coordinating conjunction.'
      }
    ],
    vocabulary: [
      {
        text: 'What is the synonym of "METICULOUS"?',
        options: ['Careless', 'Punctual', 'Thorough', 'Hasty'],
        correct_answer: 'Thorough',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Meticulous" means showing great attention to detail; very careful and thorough.'
      },
      {
        text: 'What is the antonym of "PRAGMATIC"?',
        options: ['Realistic', 'Idealistic', 'Efficient', 'Sensible'],
        correct_answer: 'Idealistic',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Pragmatic" means guided by practical considerations rather than ideals; antonym is "Idealistic".'
      },
      {
        text: 'Choose the word that means "existing everywhere at the same time":',
        options: ['Ubiquitous', 'Ephemeral', 'Omnipotent', 'Transient'],
        correct_answer: 'Ubiquitous',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Ubiquitous" means present, appearing, or found everywhere.'
      },
      {
        text: 'What does the idiom "to burn the midnight oil" mean?',
        options: ['To waste resources', 'To work late into the night', 'To cause an accident', 'To start a fire'],
        correct_answer: 'To work late into the night',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: 'Burning the midnight oil means staying up late working or studying.'
      },
      {
        text: 'What is the synonym of "EPHEMERAL"?',
        options: ['Eternal', 'Fleeting', 'Substantial', 'Rigid'],
        correct_answer: 'Fleeting',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Ephemeral" means lasting for a very short time; fleeting.'
      },
      {
        text: 'What is the antonym of "BENEVOLENT"?',
        options: ['Malevolent', 'Generous', 'Sympathetic', 'Altruistic'],
        correct_answer: 'Malevolent',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Benevolent" means well-meaning and kindly; antonym is "Malevolent" (wishing harm).'
      },
      {
        text: 'Choose the word that means "to make something less severe or painful":',
        options: ['Mitigate', 'Exacerbate', 'Aggravate', 'Intensify'],
        correct_answer: 'Mitigate',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Mitigate" means make less severe, serious, or painful.'
      },
      {
        text: 'What does the idiom "bite the bullet" mean?',
        options: ['To give up', 'To face a painful situation with courage', 'To eat quickly', 'To make a weapon'],
        correct_answer: 'To face a painful situation with courage',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Bite the bullet" means endure an inevitable difficult situation with fortitude.'
      },
      {
        text: 'What is the synonym of "CANDID"?',
        options: ['Deceptive', 'Frank', 'Secretive', 'Shy'],
        correct_answer: 'Frank',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Candid" means truthful and straightforward; frank.'
      },
      {
        text: 'What is the antonym of "LUCID"?',
        options: ['Clear', 'Transparent', 'Murky', 'Coherent'],
        correct_answer: 'Murky',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Lucid" means clear and easy to understand; antonym is "Murky" or obscure.'
      },
      {
        text: 'What does "GREGARIOUS" mean?',
        options: ['Fond of company; sociable', 'Aggressive and hostile', 'Quiet and reserved', 'Easily frightened'],
        correct_answer: 'Fond of company; sociable',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Gregarious" describes a person who enjoys social interaction and company.'
      },
      {
        text: 'What does the idiom "break the ice" mean?',
        options: ['To freeze water', 'To initiate conversation in a social setting', 'To destroy property', 'To cool down a beverage'],
        correct_answer: 'To initiate conversation in a social setting',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: 'Breaking the ice means relieving tension and initiating social interaction.'
      },
      {
        text: 'What is the synonym of "ELOQUENT"?',
        options: ['Articulate', 'Hesitant', 'Mute', 'Unclear'],
        correct_answer: 'Articulate',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Eloquent" means fluent or persuasive in speaking or writing.'
      },
      {
        text: 'What is the antonym of "VERBOSE"?',
        options: ['Concise', 'Wordy', 'Talkative', 'Redundant'],
        correct_answer: 'Concise',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Verbose" means using more words than needed; antonym is "Concise".'
      },
      {
        text: 'Choose the word that means "a person who opposes established beliefs or conventions":',
        options: ['Iconoclast', 'Conformist', 'Traditionalist', 'Disciple'],
        correct_answer: 'Iconoclast',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: 'An "Iconoclast" attacks cherished beliefs or institutions.'
      },
      {
        text: 'What is the synonym of "TENACIOUS"?',
        options: ['Persistent', 'Yielding', 'Weak', 'Fragile'],
        correct_answer: 'Persistent',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Tenacious" means holding firm; persistent and determined.'
      },
      {
        text: 'What is the antonym of "DILIGENT"?',
        options: ['Hardworking', 'Industrious', 'Slothful', 'Attentive'],
        correct_answer: 'Slothful',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Diligent" means showing care and conscientiousness; antonym is "Slothful" or lazy.'
      },
      {
        text: 'What does "AMBIGUOUS" mean?',
        options: ['Open to more than one interpretation', 'Very clear', 'Completely false', 'Highly accurate'],
        correct_answer: 'Open to more than one interpretation',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Ambiguous" means open to more than one interpretation; unclear.'
      },
      {
        text: 'What does the phrase "a blessing in disguise" mean?',
        options: ['A religious ceremony', 'An apparent misfortune that eventually results in good', 'A hidden trap', 'A sudden surprise party'],
        correct_answer: 'An apparent misfortune that eventually results in good',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: 'A good outcome that seemed bad at first.'
      },
      {
        text: 'What is the synonym of "APATHETIC"?',
        options: ['Indifferent', 'Enthusiastic', 'Passionate', 'Eager'],
        correct_answer: 'Indifferent',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Apathetic" means showing or feeling no enthusiasm or interest; indifferent.'
      },
      {
        text: 'What is the antonym of "OSTENTATIOUS"?',
        options: ['Modest', 'Showy', 'Pretentious', 'Gaudy'],
        correct_answer: 'Modest',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Ostentatious" means vulgar or pretentious display; antonym is "Modest".'
      },
      {
        text: 'Choose the word that means "calm, peaceful, and untroubled":',
        options: ['Serene', 'Turbulent', 'Agitated', 'Fierce'],
        correct_answer: 'Serene',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Serene" means calm, peaceful, and untroubled.'
      },
      {
        text: 'What is the synonym of "FERVENT"?',
        options: ['Passionate', 'Indifferent', 'Cold', 'Reluctant'],
        correct_answer: 'Passionate',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Fervent" means having or displaying a passionate intensity.'
      },
      {
        text: 'What does the idiom "hit the nail on the head" mean?',
        options: ['To hammer a board', 'To state or identify something exactly right', 'To cause bodily injury', 'To miss an opportunity'],
        correct_answer: 'To state or identify something exactly right',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: 'To describe exactly what is causing a situation or answer accurately.'
      },
      {
        text: 'What is the antonym of "PROLIFIC"?',
        options: ['Barren', 'Productive', 'Abundant', 'Fruitful'],
        correct_answer: 'Barren',
        question_type: 'mcq',
        subcategory: 'vocabulary',
        explanation: '"Prolific" means producing much fruit or foliage or many works; antonym is "Barren".'
      }
    ]
  }
};

/**
 * Utility to shuffle an array
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function seed() {
  const uri = env.MONGODB_URI || 'mongodb://localhost:27017/versant';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  const existingCount = await Question.countDocuments();
  console.log(`Current questions in MongoDB: ${existingCount}`);

  const questionsToInsert = [];
  const seen = new Set();

  // Extract CRT questions
  if (DEFAULT_QUESTION_BANK.crt) {
    for (const [subcat, qList] of Object.entries(DEFAULT_QUESTION_BANK.crt)) {
      if (Array.isArray(qList)) {
        qList.forEach(q => {
          const key = String(q.text || '').trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            const lvl = (qList.indexOf(q) % 3) + 1;
            questionsToInsert.push({
              text: q.text,
              options: q.options || [],
              correct_answer: q.correct_answer,
              question_type: q.question_type || 'mcq',
              conversion_type: q.conversion_type || 'none',
              module_id: 'CRT',
              subcategory: subcat,
              topic_id: subcat,
              level_id: lvl,
              level_name: `Level ${lvl}`,
              explanation: q.explanation || '',
              time_limit_seconds: q.time_limit_seconds || 60
            });
          }
        });
      }
    }
  }

  // Extract VERSANT questions
  if (DEFAULT_QUESTION_BANK.versant) {
    for (const [subcat, qList] of Object.entries(DEFAULT_QUESTION_BANK.versant)) {
      if (Array.isArray(qList)) {
        qList.forEach(q => {
          const key = String(q.text || '').trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            const lvl = (qList.indexOf(q) % 3) + 1;
            questionsToInsert.push({
              text: q.text,
              options: q.options || [],
              correct_answer: q.correct_answer,
              question_type: q.question_type || 'mcq',
              conversion_type: q.conversion_type || 'none',
              reference_text: q.reference_text || '',
              audio_script: q.audio_script || '',
              module_id: 'VERSANT',
              subcategory: subcat,
              topic_id: subcat,
              level_id: lvl,
              level_name: `Level ${lvl}`,
              explanation: q.explanation || '',
              time_limit_seconds: q.time_limit_seconds || 45
            });
          }
        });
      }
    }
  }

  console.log(`Parsed ${questionsToInsert.length} questions from question repository.`);
  
  if (questionsToInsert.length > 0) {
    // Bulk upsert/insert questions into database
    const bulkOps = questionsToInsert.map(q => ({
      updateOne: {
        filter: { text: q.text },
        update: { $set: q },
        upsert: true
      }
    }));
    const res = await Question.bulkWrite(bulkOps);
    console.log(`Successfully seeded/updated ${res.upsertedCount + res.modifiedCount} questions in MongoDB database!`);
  }

  const finalCount = await Question.countDocuments();
  console.log(`Total questions in MongoDB now: ${finalCount}`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
