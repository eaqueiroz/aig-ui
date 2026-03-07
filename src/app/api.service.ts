import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateUploadRequest, CreateUploadResponse, JobResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  createUploadJob(payload: CreateUploadRequest): Observable<CreateUploadResponse> {
    return this.http.post<CreateUploadResponse>(`${this.baseUrl}/uploads`, payload);
  }

  getJob(jobId: string): Observable<JobResponse> {
    return this.http.get<JobResponse>(`${this.baseUrl}/jobs/${encodeURIComponent(jobId)}`);
  }

  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const url =
      environment.s3UploadProxyPath &&
      environment.s3BucketOrigin &&
      uploadUrl.startsWith(environment.s3BucketOrigin)
        ? uploadUrl.replace(environment.s3BucketOrigin, environment.s3UploadProxyPath)
        : uploadUrl;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Upload to S3 failed with status ${response.status}${body ? `: ${body}` : ''}`);
    }
  }
}
