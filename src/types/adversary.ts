export type AdversaryMessage = {
  id: string;
  role: "user" | "adversary";
  content: string;
};
