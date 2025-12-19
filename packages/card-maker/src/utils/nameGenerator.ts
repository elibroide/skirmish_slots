
const ADJECTIVES = [
  "Laughing", "Moaning", "Running", "Flying", "Swimming", "Dancing", "Singing", "Fighting", "Sleeping", "Dreaming", "Crying", "Screaming", "Shouting", "Whispering", "Walking", "Jumping", "Sitting", "Standing", "Eating", "Drinking", "Cooking", "Cleaning", "Washing", "Driving", "Riding", "Flying", "Sailing", "Rowing", "Fishing", "Hunting", "Shooting", "Camping", "Hiking", "Climbing", "Falling", "Rising", "Growing", "Shrinking", "Glowing", "Shining", "Burning", "Freezing", "Melting", "Exploding", "Imploding", "Breaking", "Fixing", "Building", "Destroying", "Creating", "Designing", "Drawing", "Painting", "Writing", "Reading", "Learning", "Teaching", "Thinking", "Knowing", "Understanding", "Believing", "Doubting", "Hoping", "Fearing", "Loving", "Hating", "Liking", "Disliking", "Wanting", "Needing", "Feeling", "Sensing", "Seeing", "Hearing", "Smelling", "Tasting", "Touching", "Holding", "Carrying", "Pushing", "Pulling", "Throwing", "Catching", "Hitting", "Kicking", "Punching", "Stabbing", "Cutting", "Slicing", "Chopping", "Grinding", "Crushing", "Smasher", "Breaker"
];

const NOUNS = [
  "Llama", "Sidekick", "Hero", "Villain", "Monster", "Dragon", "Wizard", "Witch", "Warrior", "Knight", "King", "Queen", "Prince", "Princess", "Giant", "Dwarf", "Elf", "Orc", "Goblin", "Troll", "Vampire", "Werewolf", "Ghost", "Spirit", "Demon", "Angel", "God", "Goddess", "Titan", "Beast", "Creature", "Animal", "Bird", "Fish", "Insect", "Spider", "Snake", "Lizard", "Frog", "Toad", "Turtle", "Tortoise", "Crocodile", "Alligator", "Shark", "Whale", "Dolphin", "Octopus", "Squid", "Crab", "Lobster", "Shrimp", "Clam", "Oyster", "Snail", "Slug", "Worm", "Bee", "Wasp", "Ant", "Fly", "Mosquito", "Butterfly", "Moth", "Beetle", "Ladybug", "Spider", "Scorpion", "Centipede", "Millipede", "Cat", "Dog", "Horse", "Cow", "Pig", "Sheep", "Goat", "Chicken", "Duck", "Goose", "Turkey", "Rabbit", "Mouse", "Rat", "Squirrel", "Chipmunk", "Beaver", "Otter", "Badger", "Fox", "Wolf", "Bear", "Lion", "Tiger", "Leopard", "Cheetah", "Jaguar", "Cougar", "Puma", "Panther", "Lynx", "Bobcat", "Ocelot", "Serval", "Caracal", "Hyena", "Jackal", "Coyote", "Dingo", "Dog", "Puppy", "Kitten", "Cub", "Calf", "Foal", "Lamb", "Kid", "Piglet", "Chick", "Duckling", "Gosling", "Poult", "Bunny"
];

export const generateRandomName = (): string => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
};
