# n8n-nodes-maltiverse

Community node for interacting with the Maltiverse API from n8n.

## Installation

Install the package as an n8n community node:

- From the n8n UI: `Settings` -> `Community Nodes` -> `Install`, then enter `n8n-nodes-maltiverse`
- With npm in a self-hosted n8n setup:

```bash
npm install n8n-nodes-maltiverse
```

After installation, restart n8n and add the `Maltiverse` node to your workflow.

## Compatibility

- Developed against `n8n` `1.83.x`
- Uses `n8nNodesApiVersion: 1`
- Requires a Maltiverse API token
- `Upload` and `Delete` are designed for the private tenant (`Platform`) dataset
- `Search`, `Count`, and `Lookup` support dataset selection when the authenticated account supports it

## Credentials

- `Base URL`: Maltiverse API base URL, defaulting to `https://api.maltiverse.com`. You can override it for development, for example with `http://localhost:8000`
- `Access Token`: token sent as `Authorization: Bearer <token>`

## Datasets

Maltiverse exposes different datasets for read operations:

- `Intelligence`: the Maltiverse intelligence dataset
- `Platform`: the private tenant (platform) dataset
- `Merge`: the merged view available to the authenticated user when supported by the account

In this node, `Search`, `Count`, and `Lookup` let you choose the dataset to query. `Upload` and `Delete` always write to the `Platform` dataset.

## Operations

### Search

Searches indicators using a Lucene query.

- `Dataset`: choose which Maltiverse dataset to query
- `Response Format`:
  - `Default`: returns one n8n item per result
  - `STIX 2`: returns the raw STIX 2 payload

Example query:

```text
type:ip AND classification:malicious
```

### Count

Counts indicators matching a Lucene query.

- `Dataset`: choose which Maltiverse dataset to query

Example query:

```text
type:hostname AND blacklist.source:"Maltiverse"
```

### Lookup

Retrieves a single indicator from the selected dataset.

- `Dataset`: choose which Maltiverse dataset to query
- `Indicator Type`: choose whether you want to retrieve a hostname, IP, email, URL, or sample
- The input field changes with the selected type:
  - `Hostname`: enter a domain name
  - `IP Address`: enter a valid public IP address
  - `Email Address`: enter an email address
  - `URL`: enter the full URL; the node converts it to the Maltiverse URL checksum automatically
  - `SHA256`: enter a sample SHA256 hash

Example values:

```text
Hostname: example.org
IP: 8.8.8.8
Email: test@example.com
URL: http://example.org/path
Sample: 0000000000000000000000000000000000000000000000000000000000000000
```

### Upload

Uploads a single indicator.

- The node always writes to the tenant (platform) scope
- The payload must be a valid Maltiverse indicator JSON document

Example payload:

```json
{
  "type": "ip",
  "ip_addr": "144.22.1.25",
  "classification": "malicious",
  "blacklist": [
    {
      "source": "test",
      "description": "Test",
      "first_seen": "2018-02-17 09:20:27",
      "last_seen": "2018-02-17 09:20:27"
    }
  ]
}
```

### Delete

Deletes a single indicator.

- The node always writes to the tenant (platform) scope
- The payload must contain enough identifier fields for Maltiverse to resolve the indicator

Example payload:

```json
{
  "type": "ip",
  "ip_addr": "144.22.1.25"
}
```

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

The `Search` operation supports both the default Maltiverse format and `stix2`. In the Maltiverse format, the node returns one n8n item per result; in `stix2`, it returns the raw STIX 2 payload. The `Lookup` operation retrieves a single indicator from the selected dataset and returns the API payload as-is. For URL lookups, the node converts the provided URL to the Maltiverse URL checksum automatically. The upload and delete operations expect the indicator payload as JSON and always write to the tenant (platform) scope. This first version intentionally focuses on `/search`, `/count`, indicator lookups and the generic `/ioc` endpoint to keep the integration simple.
