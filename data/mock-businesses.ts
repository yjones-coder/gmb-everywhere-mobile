export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  primaryCategory: string;
  secondaryCategories: string[];
  rating: number;
  reviewCount: number;
  placeId: string;
  cid: string;
  attributes: string[];
  services: string[];
  hours: { day: string; hours: string }[];
  reviews: Review[];
  posts: Post[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface Post {
  id: string;
  type: "update" | "offer" | "event";
  title: string;
  content: string;
  date: string;
  hasMedia: boolean;
  hasLink: boolean;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}

export const mockBusinesses: Business[] = [
  {
    id: "1",
    name: "Smith Family Dentistry",
    address: "123 Main St, San Francisco, CA 94102",
    phone: "(415) 555-0123",
    website: "https://smithfamilydentistry.com",
    primaryCategory: "Dentist",
    secondaryCategories: ["Cosmetic Dentist", "Pediatric Dentist", "Emergency Dental Service"],
    rating: 4.8,
    reviewCount: 342,
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    cid: "12345678901234567890",
    attributes: ["Wheelchair accessible", "Online appointments", "LGBTQ+ friendly"],
    services: ["Teeth Whitening", "Dental Implants", "Root Canal", "Braces", "Veneers"],
    hours: [
      { day: "Monday", hours: "8:00 AM - 6:00 PM" },
      { day: "Tuesday", hours: "8:00 AM - 6:00 PM" },
      { day: "Wednesday", hours: "8:00 AM - 6:00 PM" },
      { day: "Thursday", hours: "8:00 AM - 6:00 PM" },
      { day: "Friday", hours: "8:00 AM - 4:00 PM" },
      { day: "Saturday", hours: "9:00 AM - 2:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    reviews: [
      { id: "r1", author: "John D.", rating: 5, text: "Excellent service! Dr. Smith is very professional and the staff is friendly.", date: "2024-11-15", helpful: 12 },
      { id: "r2", author: "Sarah M.", rating: 5, text: "Best dentist in the city. They made my root canal painless.", date: "2024-11-10", helpful: 8 },
      { id: "r3", author: "Mike R.", rating: 4, text: "Good experience overall. Wait time was a bit long.", date: "2024-11-05", helpful: 3 },
      { id: "r4", author: "Emily K.", rating: 5, text: "My kids love coming here! Great pediatric dentist.", date: "2024-10-28", helpful: 15 },
      { id: "r5", author: "David L.", rating: 3, text: "Decent service but expensive. Insurance didn't cover much.", date: "2024-10-20", helpful: 5 },
    ],
    posts: [
      { id: "p1", type: "offer", title: "Holiday Special!", content: "20% off teeth whitening this December", date: "2024-12-01", hasMedia: true, hasLink: true },
      { id: "p2", type: "update", title: "New Equipment", content: "We've upgraded to the latest digital X-ray technology", date: "2024-11-15", hasMedia: true, hasLink: false },
    ],
  },
  {
    id: "2",
    name: "Golden Gate Auto Repair",
    address: "456 Market St, San Francisco, CA 94103",
    phone: "(415) 555-0456",
    website: "https://ggautorepair.com",
    primaryCategory: "Auto Repair Shop",
    secondaryCategories: ["Oil Change Service", "Brake Shop", "Tire Shop"],
    rating: 4.5,
    reviewCount: 189,
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY5",
    cid: "12345678901234567891",
    attributes: ["Free estimates", "Warranty offered", "Certified mechanics"],
    services: ["Oil Change", "Brake Repair", "Engine Diagnostics", "Tire Rotation", "AC Repair"],
    hours: [
      { day: "Monday", hours: "7:00 AM - 7:00 PM" },
      { day: "Tuesday", hours: "7:00 AM - 7:00 PM" },
      { day: "Wednesday", hours: "7:00 AM - 7:00 PM" },
      { day: "Thursday", hours: "7:00 AM - 7:00 PM" },
      { day: "Friday", hours: "7:00 AM - 7:00 PM" },
      { day: "Saturday", hours: "8:00 AM - 5:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    reviews: [
      { id: "r6", author: "Tom H.", rating: 5, text: "Honest mechanics! They didn't try to upsell unnecessary repairs.", date: "2024-11-12", helpful: 20 },
      { id: "r7", author: "Lisa W.", rating: 4, text: "Good service but a bit pricey for an oil change.", date: "2024-11-08", helpful: 6 },
      { id: "r8", author: "Chris P.", rating: 5, text: "Fixed my brakes quickly and at a fair price.", date: "2024-11-01", helpful: 11 },
    ],
    posts: [
      { id: "p3", type: "offer", title: "Winter Check-Up", content: "Free 20-point inspection with any service", date: "2024-12-05", hasMedia: false, hasLink: true },
    ],
  },
  {
    id: "3",
    name: "Bay Area Plumbing Co.",
    address: "789 Oak St, San Francisco, CA 94104",
    phone: "(415) 555-0789",
    website: "https://bayareaplumbing.com",
    primaryCategory: "Plumber",
    secondaryCategories: ["Emergency Plumber", "Water Heater Installation", "Drain Cleaning Service"],
    rating: 4.2,
    reviewCount: 156,
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY6",
    cid: "12345678901234567892",
    attributes: ["24/7 emergency service", "Licensed & insured", "Free estimates"],
    services: ["Leak Repair", "Drain Cleaning", "Water Heater Installation", "Pipe Replacement", "Sewer Line Repair"],
    hours: [
      { day: "Monday", hours: "24 hours" },
      { day: "Tuesday", hours: "24 hours" },
      { day: "Wednesday", hours: "24 hours" },
      { day: "Thursday", hours: "24 hours" },
      { day: "Friday", hours: "24 hours" },
      { day: "Saturday", hours: "24 hours" },
      { day: "Sunday", hours: "24 hours" },
    ],
    reviews: [
      { id: "r9", author: "Nancy B.", rating: 5, text: "Came out at 2 AM for an emergency. Lifesaver!", date: "2024-11-14", helpful: 25 },
      { id: "r10", author: "Robert J.", rating: 3, text: "Fixed the issue but left a mess. Had to clean up after.", date: "2024-11-09", helpful: 8 },
      { id: "r11", author: "Karen S.", rating: 4, text: "Professional service, reasonable prices.", date: "2024-11-02", helpful: 4 },
    ],
    posts: [],
  },
  {
    id: "4",
    name: "Sunrise Yoga Studio",
    address: "321 Pine St, San Francisco, CA 94105",
    phone: "(415) 555-0321",
    website: "https://sunriseyogasf.com",
    primaryCategory: "Yoga Studio",
    secondaryCategories: ["Meditation Center", "Pilates Studio", "Fitness Center"],
    rating: 4.9,
    reviewCount: 278,
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY7",
    cid: "12345678901234567893",
    attributes: ["First class free", "Online classes available", "Beginner friendly"],
    services: ["Vinyasa Yoga", "Hot Yoga", "Meditation Classes", "Private Sessions", "Teacher Training"],
    hours: [
      { day: "Monday", hours: "6:00 AM - 9:00 PM" },
      { day: "Tuesday", hours: "6:00 AM - 9:00 PM" },
      { day: "Wednesday", hours: "6:00 AM - 9:00 PM" },
      { day: "Thursday", hours: "6:00 AM - 9:00 PM" },
      { day: "Friday", hours: "6:00 AM - 8:00 PM" },
      { day: "Saturday", hours: "7:00 AM - 6:00 PM" },
      { day: "Sunday", hours: "8:00 AM - 5:00 PM" },
    ],
    reviews: [
      { id: "r12", author: "Amanda T.", rating: 5, text: "Best yoga studio in SF! The instructors are amazing.", date: "2024-11-16", helpful: 30 },
      { id: "r13", author: "Brian K.", rating: 5, text: "Great atmosphere and variety of classes.", date: "2024-11-11", helpful: 18 },
      { id: "r14", author: "Diana R.", rating: 5, text: "Life-changing experience. Highly recommend!", date: "2024-11-06", helpful: 22 },
    ],
    posts: [
      { id: "p4", type: "event", title: "New Year Meditation", content: "Join us for a special meditation session on Jan 1st", date: "2024-12-10", hasMedia: true, hasLink: true },
      { id: "p5", type: "update", title: "New Instructor", content: "Welcome Sarah, our new hot yoga instructor!", date: "2024-11-20", hasMedia: true, hasLink: false },
    ],
  },
  {
    id: "5",
    name: "Pacific Heights Law Firm",
    address: "555 California St, San Francisco, CA 94106",
    phone: "(415) 555-0555",
    website: "https://pacificheightslaw.com",
    primaryCategory: "Law Firm",
    secondaryCategories: ["Personal Injury Attorney", "Family Law Attorney", "Real Estate Attorney"],
    rating: 4.6,
    reviewCount: 89,
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY8",
    cid: "12345678901234567894",
    attributes: ["Free consultation", "Contingency fees available", "Multilingual staff"],
    services: ["Personal Injury", "Divorce & Family Law", "Real Estate Law", "Business Law", "Estate Planning"],
    hours: [
      { day: "Monday", hours: "9:00 AM - 6:00 PM" },
      { day: "Tuesday", hours: "9:00 AM - 6:00 PM" },
      { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
      { day: "Thursday", hours: "9:00 AM - 6:00 PM" },
      { day: "Friday", hours: "9:00 AM - 5:00 PM" },
      { day: "Saturday", hours: "By appointment" },
      { day: "Sunday", hours: "Closed" },
    ],
    reviews: [
      { id: "r15", author: "George M.", rating: 5, text: "Won my case! Professional and thorough.", date: "2024-11-13", helpful: 15 },
      { id: "r16", author: "Helen P.", rating: 4, text: "Good communication throughout the process.", date: "2024-11-07", helpful: 7 },
    ],
    posts: [],
  },
];

export const relatedCategories: Record<string, { category: string; trafficPotential: "high" | "medium" | "low" }[]> = {
  "Dentist": [
    { category: "Orthodontist", trafficPotential: "high" },
    { category: "Oral Surgeon", trafficPotential: "medium" },
    { category: "Endodontist", trafficPotential: "medium" },
    { category: "Periodontist", trafficPotential: "low" },
    { category: "Dental Clinic", trafficPotential: "high" },
  ],
  "Auto Repair Shop": [
    { category: "Car Dealer", trafficPotential: "high" },
    { category: "Auto Parts Store", trafficPotential: "medium" },
    { category: "Car Wash", trafficPotential: "medium" },
    { category: "Towing Service", trafficPotential: "low" },
  ],
  "Plumber": [
    { category: "HVAC Contractor", trafficPotential: "high" },
    { category: "Electrician", trafficPotential: "high" },
    { category: "Handyman", trafficPotential: "medium" },
    { category: "General Contractor", trafficPotential: "medium" },
  ],
  "Yoga Studio": [
    { category: "Gym", trafficPotential: "high" },
    { category: "Personal Trainer", trafficPotential: "medium" },
    { category: "Massage Therapist", trafficPotential: "medium" },
    { category: "Wellness Center", trafficPotential: "low" },
  ],
  "Law Firm": [
    { category: "Notary Public", trafficPotential: "medium" },
    { category: "Accountant", trafficPotential: "medium" },
    { category: "Financial Advisor", trafficPotential: "low" },
    { category: "Insurance Agency", trafficPotential: "medium" },
  ],
};

export function searchBusinesses(query: string): Business[] {
  const lowerQuery = query.toLowerCase();
  return mockBusinesses.filter(
    (b) =>
      b.name.toLowerCase().includes(lowerQuery) ||
      b.primaryCategory.toLowerCase().includes(lowerQuery) ||
      b.secondaryCategories.some((c) => c.toLowerCase().includes(lowerQuery)) ||
      b.services.some((s) => s.toLowerCase().includes(lowerQuery))
  );
}
