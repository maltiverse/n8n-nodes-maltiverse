# n8n-nodes-maltiverse

Community node for interacting with the Maltiverse API from n8n.

## Features

- Search indicators with `/search`
- Count matches with `/count`
- Upload indicators with the generic `/ioc` endpoint

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

The upload operation expects the full Maltiverse indicator payload as JSON. This first version intentionally focuses on `/search`, `/count` and the generic `/ioc` endpoint to keep the integration simple.
