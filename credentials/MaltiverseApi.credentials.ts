import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MaltiverseApi implements ICredentialType {
	name = 'maltiverseApi';

	displayName = 'Maltiverse API';

	documentationUrl = 'https://www.maltiverse.com';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.maltiverse.com',
			placeholder: 'https://api.maltiverse.com',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Bearer token used in the Authorization header',
		},
	];
}
