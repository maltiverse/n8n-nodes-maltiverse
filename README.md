# n8n-nodes-maltiverse

Community node for interacting with the Maltiverse API from n8n.

## Features

- Search indicators with `/search`
  - Maltiverse format returns one n8n item per result
  - STIX 2 format returns the raw STIX 2 payload
- Count matches with `/count`
- Lookup a hostname, IP, email, URL or sample directly from its main endpoint
- Upload indicators with the generic `/ioc` endpoint
  - Uploads always target the tenant (platform) scope
- Delete indicators with the generic `/ioc` endpoint
  - Deletes always target the tenant (platform) scope

## Credentials

- `Base URL`: Maltiverse API base URL, defaulting to `https://api.maltiverse.com`. You can override it for development, for example with `http://localhost:8000`
- `Access Token`: token sent as `Authorization: Bearer <token>`

## Development

```bash
npm install
npm run build
```

## Local test with Docker

```bash
docker compose up --build
```

Then open `http://localhost:5678`, create `Maltiverse API` credentials, and add the `Maltiverse` node to a workflow.

## Notes

The `Search` operation supports both the default Maltiverse format and `stix2`. In the Maltiverse format, the node returns one n8n item per result; in `stix2`, it returns the raw STIX 2 payload. The `Lookup` operation reads the main Maltiverse indicator endpoints directly and returns the API payload as-is. The upload and delete operations expect the indicator payload as JSON and always write to the tenant (platform) scope. This first version intentionally focuses on `/search`, `/count`, direct indicator reads and the generic `/ioc` endpoint to keep the integration simple.
