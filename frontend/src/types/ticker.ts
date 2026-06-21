export interface LtpcData {
  instrumentKey: string;
  ltp: number;
  ltt: number;
  cp: number;
}

export interface QuoteDTO {
  bidQ: number;
  bidP: number;
  askQ: number;
  askP: number;
}

export interface FullFeedData {
  instrumentKey: string;
  ltp: number;
  ltt: number;
  cp: number;
  marketLevel: QuoteDTO[];
  atp: number;
  vtt: number;
  oi: number;
  iv: number;
  tbq: number;
  tsq: number;
}
