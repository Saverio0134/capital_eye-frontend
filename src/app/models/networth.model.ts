import { Growth } from "./growth.model";

export interface MonthlyNetWorth {
  date: Date;
  value: number;
}


export interface MonthlyNetWorthWithGrowth {
  monthlyNetWorth: MonthlyNetWorth[];
  growth: Growth;
  dateLastSnapshot: { asset: Date; liquidity: Date };
}
