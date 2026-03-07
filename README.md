# Simple Angular UI for AIG Async File Processing

This Angular UI lets users:

- choose a file
- call `POST /uploads`
- upload the file directly to the returned pre-signed S3 URL
- poll `GET /jobs/{jobId}`
- manually look up an existing `jobId`

## Configure the backend URL

Update `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://YOUR_API_ID.execute-api.eu-west-1.amazonaws.com/Prod'
};
```

## Run locally

```bash
npm install
npm start
```

the application will be available on the url: http://localhost:4200/

## Notes

The app assumes:
- `POST /uploads` returns `{ jobId, uploadUrl, status, s3Key?, correlationId? }`
- `GET /jobs/{jobId}` returns a job payload with `status`, optional `result`, and optional `error`

