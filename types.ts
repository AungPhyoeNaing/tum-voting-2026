export enum CategoryId {
  KING = 'KING',
  QUEEN = 'QUEEN',
  MISTER = 'MISTER',
  MISS = 'MISS',
}

export interface Candidate {
  id: string;
  number: string;
  name: string;
  class: string;
  categoryId: CategoryId;
  bio?: string;
  quote?: string;
}

export interface VoteState {
  [candidateId: string]: number;
}

export interface UserVotes {
  [categoryId: string]: string; // candidateId
}

export interface AdminStats {
  totalVotes: number;
  votesPerCategory: Record<CategoryId, number>;
  leadingCandidates: Record<CategoryId, Candidate>;
}

export interface VoteRecord {
  id: number;
  candidateId: string;
  categoryId: CategoryId;
  ipAddress: string;
  fingerprint: string;
  voterId: string;
  hardwareId: string;
  timestamp: string;
}