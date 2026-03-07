export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface CreateUploadRequest {
  fileName: string;
  contentType: string;
}

export interface CreateUploadResponse {
  jobId: string;
  status: JobStatus;
  uploadUrl: string;
  s3Key?: string;
  correlationId?: string;
}

export interface TopToken {
  token: string;
  count: number;
}

export interface ProcessingResult {
  wordCount?: number;
  uniqueWordCount?: number;
  topTokens?: TopToken[];
  [key: string]: unknown;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  fileName?: string;
  contentType?: string;
  createdAt?: string;
  updatedAt?: string;
  correlationId?: string;
  s3Key?: string;
  result?: ProcessingResult;
  error?: string;
  [key: string]: unknown;
}
