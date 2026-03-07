import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { JobResponse, JobStatus } from './api.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  selectedFile: File | null = null;
  lookupJobId = '';
  currentJob: JobResponse | null = null;

  isSubmitting = false;
  isUploading = false;
  isPolling = false;
  errorMessage = '';
  successMessage = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submit(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please choose a file first.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.currentJob = null;
    this.isSubmitting = true;

    this.api.createUploadJob({
      fileName: this.selectedFile.name,
      contentType: this.selectedFile.type || 'text/plain'
    }).pipe(
      finalize(() => {
        this.isSubmitting = false;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: async response => {
        try {
          this.isUploading = true;
          await this.api.uploadFile(response.uploadUrl, this.selectedFile as File);
          this.successMessage = 'File uploaded successfully.';
          this.lookupJobId = response.jobId;
          this.fetchJob(response.jobId);
          this.startPolling(response.jobId);
        } catch (error) {
          this.errorMessage = error instanceof Error ? error.message : 'Upload failed.';
        } finally {
          this.isUploading = false;
        }
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Failed to create upload job.';
      }
    });
  }

  fetchLookupJob(): void {
    const jobId = this.lookupJobId.trim();
    if (!jobId) {
      this.errorMessage = 'Please enter a job ID.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.fetchJob(jobId);
    this.startPolling(jobId);
  }

  private fetchJob(jobId: string): void {
    this.api.getJob(jobId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: job => {
          this.currentJob = job;
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Failed to fetch job status.';
        }
      });
  }

  private startPolling(jobId: string): void {
    this.isPolling = true;

    timer(0, 3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.api.getJob(jobId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: job => {
              this.currentJob = job;

              if (job.status === 'DONE' || job.status === 'FAILED') {
                this.isPolling = false;
              }
            },
            error: err => {
              this.isPolling = false;
              this.errorMessage = err?.error?.message || 'Failed to poll job status.';
            }
          });
      });
  }

  getStatusClass(status?: JobStatus): string {
    switch (status) {
      case 'DONE':
        return 'badge success';
      case 'FAILED':
        return 'badge failed';
      case 'PROCESSING':
        return 'badge warning';
      case 'PENDING':
      default:
        return 'badge pending';
    }
  }

  stringify(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
