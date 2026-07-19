# Architecture

GitHub is the engineering source of truth.

Google Drive stores deployment artifacts, release ZIP files, manifests, and backups.

The Custom GPT invokes a Cloudflare Worker. The Worker forwards authenticated requests to Google Apps Script. Apps Script manages Google Drive and the Ghost Admin API.

```text
ChatGPT → Cloudflare Worker → Apps Script → Google Drive / Ghost(Pro)
```
