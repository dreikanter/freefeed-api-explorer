import type { ApiEndpoint, FreeFeedInstance } from './types.js';
import apiData from './freefeed-api.json';

export const FREEFEED_INSTANCES: FreeFeedInstance[] = [
  {
    name: 'Staging (candy.freefeed.net)',
    url: 'https://candy.freefeed.net',
    description: 'Development and testing environment',
  },
  {
    name: 'Production (freefeed.net)',
    url: 'https://freefeed.net',
    description: 'Live production environment',
  },
];

export const API_ENDPOINTS: ApiEndpoint[] = apiData.endpoints as ApiEndpoint[];
