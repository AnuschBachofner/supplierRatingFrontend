export interface RatingHistoryPoint {
  date: Date;
  totalScore: number;
  quality: number;
  cost: number;
  reliability: number;
  availability: number | null;
  orderName: string;
}
