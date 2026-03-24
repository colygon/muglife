export interface FloorInfo {
  number: number;
  name: string;
  shortName: string;
  description: string;
}

export const FLOORS: FloorInfo[] = [
  {
    number: -1,
    name: "Rave Room",
    shortName: "Rave Room",
    description:
      "The basement. When the sun goes down, the bass comes up.",
  },
  {
    number: 1,
    name: "Front Desk",
    shortName: "Front Desk",
    description: "The ground floor entrance to Frontier Tower.",
  },
  {
    number: 2,
    name: "Event Spaceship",
    shortName: "Event Spaceship",
    description:
      "300-person event space, 4 conference rooms, high ceilings, industrial-chic vibe — ideal for meet-ups, workshops, and tech hackathons.",
  },
  {
    number: 3,
    name: "Private Offices",
    shortName: "Private Offices",
    description:
      "Private office suites for teams and companies in the tower.",
  },
  {
    number: 4,
    name: "Cyberpunk Robotics Lab",
    shortName: "Robotics",
    description:
      "A creative R&D hub and testing ground for next-generation robotics — where the future is already being prototyped.",
  },
  {
    number: 6,
    name: "Music & Art Social Space",
    shortName: "MASS",
    description:
      "A floor dedicated to painters, sculptors, musicians, and creative visionaries pushing the boundaries of innovation.",
  },
  {
    number: 7,
    name: "Frontier Makerspace",
    shortName: "Makerspace",
    description:
      "The creative and technical heart of Frontier Tower — where builders, hackers, researchers, artists, and founders work side-by-side.",
  },
  {
    number: 8,
    name: "Biopunk Lab",
    shortName: "Biopunk",
    description:
      "Purpose-built for community science and deep-tech projects — a complete biolab with a hands-on culture for people who build real things.",
  },
  {
    number: 9,
    name: "AI/ML Lab",
    shortName: "AI/ML",
    description:
      "Connecting all aspects of AI to all peoples — a space for citizens to collaborate and learn in this fast-paced, fascinating future.",
  },
  {
    number: 10,
    name: "Frontier Accelerator",
    shortName: "Accelerator",
    description:
      "A curated community where founders, builders, and VCs come together to collaborate, launch, and scale under one roof.",
  },
  {
    number: 11,
    name: "Longevity Lab",
    shortName: "Longevity",
    description:
      "Coordinating to extend healthy human lifespan, advance aging research, and collaborate on healthy habits and biomarker tracking.",
  },
  {
    number: 12,
    name: "Ethereum House",
    shortName: "ETH House",
    description:
      "A builders studio for the next generation of founders accelerating the application layer of Ethereum.",
  },
  {
    number: 14,
    name: "Human Flourishing Lab",
    shortName: "Flourishing",
    description:
      "A living lab dedicated to designing systems, communities and practices that help people and society thrive.",
  },
  {
    number: 15,
    name: "Coworking Space",
    shortName: "Coworking",
    description:
      "Get into manager mode and eliminate your todo list without distractions. Talking allowed but not encouraged.",
  },
  {
    number: 16,
    name: "The Lounge",
    shortName: "Lounge",
    description:
      "The accelerationist lounge for cross-pollination. The top floor for all communities to mingle and bring humanity forward.",
  },
];

// Simple array of floor numbers for the floor picker
export const TOWER_FLOORS = FLOORS.map((f) => f.number);

// Lookup helpers
export function getFloorInfo(floor: number): FloorInfo | undefined {
  return FLOORS.find((f) => f.number === floor);
}

export function getFloorName(floor: number): string {
  return getFloorInfo(floor)?.shortName || `Floor ${floor}`;
}

export function getFloorLabel(floor: number): string {
  return floor === -1 ? "B" : String(floor);
}
