export const ANIMALS = [
  'Cat', 'Dog', 'Elephant', 'Giraffe', 'Lion',
  'Tiger', 'Bear', 'Rabbit', 'Fox', 'Wolf',
  'Owl', 'Eagle', 'Dolphin', 'Whale', 'Shark',
  'Penguin', 'Koala', 'Panda', 'Monkey', 'Zebra',
  'Horse', 'Cow', 'Pig', 'Sheep', 'Chicken',
  'Duck', 'Frog', 'Snake', 'Turtle', 'Octopus',
  'Butterfly', 'Bee', 'Ant', 'Spider', 'Crab',
  'Lobster', 'Jellyfish', 'Starfish', 'Seahorse', 'Bat',
  'Deer', 'Moose', 'Rhino', 'Hippo', 'Gorilla',
  'Cheetah', 'Leopard', 'Crocodile', 'Flamingo', 'Peacock',
];

/** Returns `count` unique random animals from the list */
export function getRandomAnimals(count: number): string[] {
  const shuffled = [...ANIMALS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
