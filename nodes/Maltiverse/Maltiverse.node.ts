import { createHash } from 'crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'search',
		options: [
			{
				name: 'Lookup',
				value: 'lookup',
				description: 'Retrieve a single indicator from the selected dataset',
				action: 'Retrieve an indicator from a dataset',
			},
			{
				name: 'Upload',
				value: 'upload',
				description: 'Upload a single indicator to the tenant (platform) dataset',
				action: 'Upload an indicator to tenant (platform)',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search indicators in the selected dataset using a Lucene query',
				action: 'Search indicators in a dataset',
			},
			{
				name: 'Count',
				value: 'count',
				description: 'Count indicators in the selected dataset using a Lucene query',
				action: 'Count indicators in a dataset',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a single indicator from the tenant (platform) dataset',
				action: 'Delete an indicator from tenant (platform)',
			},
		],
	},
];

const lookupFields: INodeProperties[] = [
	{
		displayName: 'Dataset',
		name: 'dataLayer',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['lookup'],
			},
		},
		options: [
			{ name: 'Intelligence', value: 'intelligence' },
			{ name: 'Merge', value: 'merge' },
			{ name: 'Platform', value: 'platform' },
		],
		default: 'intelligence',
		required: true,
		description: 'Choose which Maltiverse dataset to read from',
	},
	{
		displayName: 'Indicator Type',
		name: 'indicatorType',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['lookup'],
			},
		},
		options: [
			{ name: 'Hostname', value: 'hostname' },
			{ name: 'IP', value: 'ip' },
			{ name: 'Email', value: 'email' },
			{ name: 'URL', value: 'url' },
			{ name: 'Sample', value: 'sample' },
		],
		default: 'ip',
		required: true,
		description: 'Choose the kind of indicator you want to retrieve',
	},
	{
		displayName: 'Hostname',
		name: 'hostnameValue',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['lookup'],
				indicatorType: ['hostname'],
			},
		},
		default: '',
		required: true,
		description: 'Enter the domain name to retrieve',
	},
	{
		displayName: 'IP Address',
		name: 'ipValue',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['lookup'],
				indicatorType: ['ip'],
			},
		},
		default: '',
		required: true,
		description: 'Enter a valid public IP address to retrieve',
	},
	{
		displayName: 'Email Address',
		name: 'emailValue',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['lookup'],
				indicatorType: ['email'],
			},
		},
		default: '',
		required: true,
		description: 'Enter the email address to retrieve',
	},
	{
		displayName: 'URL',
		name: 'urlValue',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['lookup'],
				indicatorType: ['url'],
			},
		},
		default: '',
		required: true,
		description:
			'Enter the full URL to retrieve. The node converts it to the Maltiverse URL checksum (SHA256) automatically.',
	},
	{
		displayName: 'SHA256',
		name: 'sampleValue',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['lookup'],
				indicatorType: ['sample'],
			},
		},
		default: '',
		required: true,
		description: 'Enter the sample SHA256 hash to retrieve',
	},
];

const queryFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['search', 'count'],
			},
		},
		default: '',
		required: true,
		description: 'Lucene query to send to Maltiverse',
	},
	{
		displayName: 'Dataset',
		name: 'dataLayer',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['search', 'count'],
			},
		},
		options: [
			{ name: 'Intelligence', value: 'intelligence' },
			{ name: 'Merge', value: 'merge' },
			{ name: 'Platform', value: 'platform' },
		],
		default: 'intelligence',
		required: true,
		description: 'Choose which Maltiverse dataset to query',
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		default: 0,
		description: 'Offset for the search result set',
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		default: 50,
		description: 'Maximum number of records to return',
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		default: '',
		description: 'Optional Elasticsearch sort clause',
	},
	{
		displayName: 'Range',
		name: 'range',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		default: '',
		description: 'Optional range expression to send as the range query parameter',
	},
	{
		displayName: 'Range Field',
		name: 'rangeField',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		default: '',
		description: 'Field used together with the range parameter',
	},
	{
		displayName: 'Response Format',
		name: 'responseFormat',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['search'],
			},
		},
		options: [
			{ name: 'Default', value: '' },
			{ name: 'STIX 2', value: 'stix2' },
		],
		default: '',
	},
];

const uploadFields: INodeProperties[] = [
	{
		displayName: 'Indicator JSON',
		name: 'indicatorJson',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['upload', 'delete'],
			},
		},
		default:
			'{\n  "type": "ip",\n  "ip_addr": "144.22.1.25",\n  "classification": "malicious",\n  "blacklist": [\n    {\n      "source": "test",\n      "description": "Test",\n      "first_seen": "2018-02-17 09:20:27",\n      "last_seen": "2018-02-17 09:20:27"\n    }\n  ]\n}',
		required: true,
		description:
			'Indicator payload sent to the generic /ioc endpoint. Uploads and deletes always write to the tenant (platform) scope.',
	},
];

function normalizeIndicatorPayload(value: IDataObject | string): IDataObject {
	if (typeof value !== 'string') {
		return value;
	}

	try {
		return JSON.parse(value) as IDataObject;
	} catch (error) {
		throw new Error(`Indicator JSON is not valid JSON: ${(error as Error).message}`);
	}
}

async function maltiverseApiRequest(
	context: IExecuteFunctions,
	options: IHttpRequestOptions,
): Promise<IDataObject | IDataObject[]> {
	const credentials = await context.getCredentials('maltiverseApi');
	const baseUrl = String(credentials.baseUrl ?? '').replace(/\/+$/, '');
	const accessToken = String(credentials.accessToken ?? '');

	options.url = `${baseUrl}${options.url}`;
	options.headers = {
		...options.headers,
		Authorization: `Bearer ${accessToken}`,
		Accept: 'application/json',
	};

	try {
		return (await context.helpers.httpRequest(options)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject, {
			message: 'Maltiverse API request failed',
		});
	}
}

function extractSearchSources(responseData: IDataObject | IDataObject[]): IDataObject[] | null {
	if (Array.isArray(responseData)) {
		return null;
	}

	const hitsWrapper = responseData.hits;
	if (!hitsWrapper || typeof hitsWrapper !== 'object' || Array.isArray(hitsWrapper)) {
		return null;
	}

	const rawHits = (hitsWrapper as IDataObject).hits;
	if (!Array.isArray(rawHits)) {
		return null;
	}

	const sources: IDataObject[] = [];
	for (const hit of rawHits) {
		if (!hit || typeof hit !== 'object' || Array.isArray(hit)) {
			return null;
		}

		const source = (hit as IDataObject)._source;
		if (!source || typeof source !== 'object' || Array.isArray(source)) {
			return null;
		}

		sources.push(source as IDataObject);
	}

	return sources;
}

function getLookupValueParameterName(indicatorType: string): string {
	switch (indicatorType) {
		case 'hostname':
			return 'hostnameValue';
		case 'ip':
			return 'ipValue';
		case 'email':
			return 'emailValue';
		case 'url':
			return 'urlValue';
		case 'sample':
			return 'sampleValue';
		default:
			throw new Error(`Unsupported indicator type: ${indicatorType}`);
	}
}

function normalizeLookupValue(indicatorType: string, indicatorValue: string): string {
	if (indicatorType === 'url') {
		return createHash('sha256').update(indicatorValue, 'utf8').digest('hex');
	}

	return indicatorValue;
}

export class Maltiverse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Maltiverse',
		name: 'maltiverse',
		icon: 'file:maltiverse.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the Maltiverse API for reading indicators and uploading IoCs to tenant (platform)',
		defaults: {
			name: 'Maltiverse',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'maltiverseApi',
				required: true,
			},
		],
		properties: [
			...operations,
			...queryFields,
			...uploadFields,
			...lookupFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				if (operation === 'search') {
					const query = this.getNodeParameter('query', i) as string;
					const dataLayer = this.getNodeParameter('dataLayer', i) as string;
					const from = this.getNodeParameter('from', i) as number;
					const size = this.getNodeParameter('size', i) as number;
					const sort = this.getNodeParameter('sort', i) as string;
					const range = this.getNodeParameter('range', i) as string;
					const rangeField = this.getNodeParameter('rangeField', i) as string;
					const responseFormat = this.getNodeParameter('responseFormat', i) as string;

					const qs: IDataObject = {
						query,
						from,
						size,
					};

					if (dataLayer) {
						qs.data_layer = dataLayer;
					}
					if (sort) {
						qs.sort = sort;
					}
					if (range) {
						qs.range = range;
					}
					if (rangeField) {
						qs.range_field = rangeField;
					}
					if (responseFormat) {
						qs.format = responseFormat;
					}

					responseData = await maltiverseApiRequest(this, {
						method: 'GET',
						url: '/search',
						qs,
						json: true,
					});

					if (!responseFormat) {
						const sourceHits = extractSearchSources(responseData);
						if (sourceHits !== null) {
							responseData = sourceHits;
						}
					}
				} else if (operation === 'count') {
					const query = this.getNodeParameter('query', i) as string;
					const dataLayer = this.getNodeParameter('dataLayer', i) as string;
					const qs: IDataObject = { query };

					if (dataLayer) {
						qs.data_layer = dataLayer;
					}

					responseData = await maltiverseApiRequest(this, {
						method: 'GET',
						url: '/count',
						qs,
						json: true,
					});
				} else if (operation === 'upload') {
					const indicatorJson = normalizeIndicatorPayload(
						this.getNodeParameter('indicatorJson', i) as IDataObject | string,
					);

					responseData = await maltiverseApiRequest(this, {
						method: 'POST',
						url: '/ioc',
						qs: {
							index_scope: 'tenant',
						},
						body: indicatorJson,
						json: true,
					});
				} else if (operation === 'delete') {
					const indicatorJson = normalizeIndicatorPayload(
						this.getNodeParameter('indicatorJson', i) as IDataObject | string,
					);

					responseData = await maltiverseApiRequest(this, {
						method: 'DELETE',
						url: '/ioc',
						qs: {
							index_scope: 'tenant',
						},
						body: indicatorJson,
						json: true,
					});
				} else if (operation === 'lookup') {
					const dataLayer = this.getNodeParameter('dataLayer', i) as string;
					const indicatorType = this.getNodeParameter('indicatorType', i) as string;
					const rawIndicatorValue = this.getNodeParameter(
						getLookupValueParameterName(indicatorType),
						i,
					) as string;
					const indicatorValue = normalizeLookupValue(indicatorType, rawIndicatorValue);

					responseData = await maltiverseApiRequest(this, {
						method: 'GET',
						url: `/${indicatorType}/${encodeURIComponent(indicatorValue)}`,
						qs: {
							data_layer: dataLayer,
						},
						json: true,
					});
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
						itemIndex: i,
					});
				}

				if (Array.isArray(responseData)) {
					for (const entry of responseData) {
						returnData.push({ json: entry });
					}
				} else {
					returnData.push({ json: responseData });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: i,
					});
					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}
