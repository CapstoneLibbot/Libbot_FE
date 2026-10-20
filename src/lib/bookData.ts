export type BookRecord = {
  id: number
  title: string
  author: string
  description: string
  classification: string
  shelf: string
  shelfLevel: number
  endpointId: number
}

export const sampleBooks: BookRecord[] = [
  {
    id: 5001,
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupery',
    description: 'A poetic novella about friendship, imagination and human connection.',
    classification: 'PQ2637.A274 P7',
    shelf: 'Shelf A-01',
    shelfLevel: 2,
    endpointId: 101,
  },
  {
    id: 5002,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description: 'A practical guide to writing clear and maintainable software.',
    classification: 'QA76.76.D47 M37',
    shelf: 'Shelf A-02',
    shelfLevel: 3,
    endpointId: 102,
  },
  {
    id: 5003,
    title: 'Design Patterns',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    description: 'A catalog of reusable object-oriented software design patterns.',
    classification: 'QA76.64 D47',
    shelf: 'Shelf A-03',
    shelfLevel: 2,
    endpointId: 106,
  },
  {
    id: 5004,
    title: 'The Pragmatic Programmer',
    author: 'David Thomas and Andrew Hunt',
    description: 'An approach to improving the craft of software development.',
    classification: 'QA76.6 T465',
    shelf: 'Shelf A-04',
    shelfLevel: 1,
    endpointId: 107,
  },
  {
    id: 5005,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    description: 'A comprehensive textbook on algorithms and data structures.',
    classification: 'QA76.6 I585',
    shelf: 'Shelf A-05',
    shelfLevel: 4,
    endpointId: 108,
  },
  {
    id: 5006,
    title: 'Refactoring',
    author: 'Martin Fowler',
    description: 'Techniques for improving the design of existing code.',
    classification: 'QA76.76.M42 F69',
    shelf: 'Shelf A-06',
    shelfLevel: 2,
    endpointId: 109,
  },
  {
    id: 5007,
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    description: 'An introduction to human-centered design and usability.',
    classification: 'TS171.4 N67',
    shelf: 'Shelf A-07',
    shelfLevel: 1,
    endpointId: 110,
  },
  {
    id: 5008,
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    description: 'An exploration of two systems that shape human judgment.',
    classification: 'BF441 K ah',
    shelf: 'Shelf A-08',
    shelfLevel: 3,
    endpointId: 111,
  },
]
