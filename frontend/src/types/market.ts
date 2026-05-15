export interface IndexPriceInfo {
  lastPrice: number;
  change: number;
  pChange: number;
  pchange?: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  totalTradedVolume: number;
  indexSymbol: string;
}

export interface IndexAdvance {
  advances: number;
  declines: number;
  unChanged: number;
}

export interface IndexMetadata {
  indexIdentifier: string;
  indexPriority: number;
  numberOfConstituents: number;
  launchDate: string;
  baseDate: string;
  methodology: string;
  description: string;
  isActive: boolean;
}

export interface IndexDetail {
  name: string;
  time: string;
  indexPriceInfoDTO: IndexPriceInfo;
  indexAdvanceDTO: IndexAdvance;
  indexMetadataDTO: IndexMetadata;
}
