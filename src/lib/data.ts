import type { Department, Event, User, Winner } from "@/lib/types";

export const departments: Department[] = [
  { id: "cse", name: "Computer Science", head: { name: "Dr. Alan Turing", email: "alan.t@example.com" } },
  { id: "ece", name: "Electronics & Communication", head: { name: "Dr. Marie Curie", email: "marie.c@example.com" } },
  { id: "mech", name: "Mechanical Engineering", head: { name: "Dr. James Watt", email: "james.w@example.com" } },
  { id: "civil", name: "Civil Engineering", head: { name: "Dr. John Smeaton", email: "john.s@example.com" } },
];

export const users: User[] = [
  { id: "user-1", name: "Alex Johnson", email: "alex.j@example.com", college: "Tech University", registeredAt: "2024-08-01T10:00:00Z", avatarUrl: "https://picsum.photos/seed/1/40/40" },
  { id: "user-2", name: "Maria Garcia", email: "maria.g@example.com", college: "State College", registeredAt: "2024-08-01T11:30:00Z", avatarUrl: "https://picsum.photos/seed/2/40/40" },
  { id: "user-3", name: "Chen Wei", email: "chen.w@example.com", college: "Innovation Institute", registeredAt: "2024-08-02T09:00:00Z", avatarUrl: "https://picsum.photos/seed/3/40/40" },
  { id: "user-4", name: "Fatima Al-Sayed", email: "fatima.a@example.com", college: "Global University", registeredAt: "2024-08-02T14:00:00Z", avatarUrl: "https://picsum.photos/seed/4/40/40" },
  { id: "user-5", name: "David Smith", email: "david.s@example.com", college: "Metro College", registeredAt: "2024-08-03T16:00:00Z", avatarUrl: "https://picsum.photos/seed/5/40/40" },
  { id: "user-6", name: "Yuki Tanaka", email: "yuki.t@example.com", college: "Tech University", registeredAt: "2024-08-04T10:00:00Z", avatarUrl: "https://picsum.photos/seed/6/40/40" },
  { id: "user-7", name: "Ben Carter", email: "ben.c@example.com", college: "State College", registeredAt: "2024-08-04T12:00:00Z", avatarUrl: "https://picsum.photos/seed/7/40/40" },
  { id: "user-8", name: "Olivia Martinez", email: "olivia.m@example.com", college: "Innovation Institute", registeredAt: "2024-08-05T09:30:00Z", avatarUrl: "https://picsum.photos/seed/8/40/40" },
];

export const events: Event[] = [
  {
    id: "event-1",
    name: "Hackathon 2024",
    description: "A 24-hour coding competition to build innovative solutions.",
    date: "2024-09-15T09:00:00Z",
    department: departments[0],
    participants: users.slice(0, 5),
    imageUrl: "https://picsum.photos/seed/tech/400/250",
    imageHint: "technology code",
    registrationFee: 10,
  },
  {
    id: "event-2",
    name: "RoboWars",
    description: "Design and build robots to compete in an arena.",
    date: "2024-09-20T10:00:00Z",
    department: departments[1],
    participants: users.slice(2, 7),
    imageUrl: "https://picsum.photos/seed/robotics/400/250",
    imageHint: "robot battle",
    registrationFee: 15,
  },
  {
    id: "event-3",
    name: "Bridge Builders",
    description: "A competition to design and construct the strongest model bridge.",
    date: "2024-09-25T11:00:00Z",
    department: departments[3],
    participants: users.slice(4),
    imageUrl: "https://picsum.photos/seed/bridge/400/250",
    imageHint: "bridge construction",
    registrationFee: 5,
  },
  {
    id: "event-4",
    name: "CAD Design Challenge",
    description: "Showcase your CAD skills by designing a complex mechanical part.",
    date: "2024-09-30T09:00:00Z",
    department: departments[2],
    participants: users.slice(1, 4),
    imageUrl: "https://picsum.photos/seed/design/400/250",
    imageHint: "3d model",
    registrationFee: 8,
  },
];

export const winners: Winner[] = [
  { id: "winner-1", eventId: "event-1", position: 1, user: users[2], prizeAmount: 500 },
  { id: "winner-2", eventId: "event-1", position: 2, user: users[0], prizeAmount: 250 },
  { id: "winner-3", eventId: "event-2", position: 1, user: users[6], prizeAmount: 750 },
];
