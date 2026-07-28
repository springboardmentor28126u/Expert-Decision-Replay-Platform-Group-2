const dummyDecisions = [
  {
    id: 1,
    title: "Cloud Migration Strategy",
    description:
      "Move existing infrastructure from on-premise servers to AWS Cloud.",
    status: "Draft",
    owner_id: 1,
    owner_name: "Raj Upadhyay",
    category_id: 1,
    category_name: "Technology",
    created_at: "2026-07-10",
    updated_at: "2026-07-12",
  },
  {
    id: 2,
    title: "ERP System Upgrade",
    description:
      "Upgrade ERP system to improve inventory and finance management.",
    status: "In Review",
    owner_id: 2,
    owner_name: "Anjali Upadhyay",
    category_id: 2,
    category_name: "Business",
    created_at: "2026-07-08",
    updated_at: "2026-07-11",
  },
  {
    id: 3,
    title: "Database Migration",
    description:
      "Migrate PostgreSQL database to Supabase for better scalability.",
    status: "Finalized",
    owner_id: 3,
    owner_name: "Rahul Sharma",
    category_id: 1,
    category_name: "Technology",
    created_at: "2026-07-05",
    updated_at: "2026-07-09",
  },
];

export default dummyDecisions;