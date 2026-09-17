// src/server/scanner/endpointDiscovery.ts
// Automated API, Route, and Parameterized URL Discovery Engine

import { DiscoveredEndpoint, EndpointParameter, Target } from '../../types';

export function discoverEndpointsForDomain(domain: string, targetId: string, subdomains: string[]): DiscoveredEndpoint[] {
  const endpoints: DiscoveredEndpoint[] = [];
  const now = new Date().toISOString();

  // Standard API and parameterized route templates
  const endpointTemplates = [
    // REST APIs with query parameters
    {
      path: '/api/v1/users',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'id', type: 'QUERY' as const, exampleValue: '1042', category: 'ID' as const, riskNote: 'Direct object reference ID parameter' },
        { name: 'role', type: 'QUERY' as const, exampleValue: 'admin', category: 'DATA_FILTER' as const },
        { name: 'limit', type: 'QUERY' as const, exampleValue: '50', category: 'DATA_FILTER' as const },
      ],
      tags: ['REST API', 'User Data', 'Parameterized'],
    },
    {
      path: '/api/v1/auth/token',
      method: 'POST' as const,
      isApi: true,
      apiType: 'OAUTH' as const,
      statusCode: 200,
      params: [
        { name: 'grant_type', type: 'BODY' as const, exampleValue: 'password', category: 'AUTH_TOKEN' as const },
        { name: 'client_id', type: 'BODY' as const, exampleValue: 'sentinel_web_client', category: 'AUTH_TOKEN' as const },
        { name: 'scope', type: 'BODY' as const, exampleValue: 'read:profile write:audit', category: 'AUTH_TOKEN' as const },
      ],
      tags: ['Authentication', 'OAuth2', 'Token Issuer'],
    },
    {
      path: '/api/v2/search',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'q', type: 'QUERY' as const, exampleValue: 'reconnaissance', category: 'SEARCH_QUERY' as const, riskNote: 'Input reflection / search query' },
        { name: 'category', type: 'QUERY' as const, exampleValue: 'assets', category: 'DATA_FILTER' as const },
        { name: 'highlight', type: 'QUERY' as const, exampleValue: 'true', category: 'DEBUG_FLAG' as const },
      ],
      tags: ['Search API', 'Reflection Risk', 'Parameterized'],
    },
    {
      path: '/oauth/authorize',
      method: 'GET' as const,
      isApi: true,
      apiType: 'OAUTH' as const,
      statusCode: 302,
      params: [
        { name: 'response_type', type: 'QUERY' as const, exampleValue: 'code', category: 'AUTH_TOKEN' as const },
        { name: 'client_id', type: 'QUERY' as const, exampleValue: 'acme_portal_app', category: 'AUTH_TOKEN' as const },
        { name: 'redirect_uri', type: 'QUERY' as const, exampleValue: `https://${domain}/auth/callback`, category: 'REDIRECT_URL' as const, riskNote: 'Open redirect verification candidate', isSensitive: true },
        { name: 'state', type: 'QUERY' as const, exampleValue: 'sec_csrf_98231', category: 'AUTH_TOKEN' as const },
      ],
      tags: ['OAuth SSO', 'Redirect Parameter', 'Sensitive'],
    },
    {
      path: '/download',
      method: 'GET' as const,
      isApi: false,
      apiType: 'STANDARD_HTTP' as const,
      statusCode: 200,
      params: [
        { name: 'file', type: 'QUERY' as const, exampleValue: 'security_report_2026.pdf', category: 'FILE_PATH' as const, riskNote: 'Path traversal / LFI audit candidate', isSensitive: true },
        { name: 'format', type: 'QUERY' as const, exampleValue: 'pdf', category: 'DATA_FILTER' as const },
      ],
      tags: ['File Handler', 'LFI Candidate', 'Parameterized'],
    },
    {
      path: '/graphql',
      method: 'POST' as const,
      isApi: true,
      apiType: 'GRAPHQL' as const,
      statusCode: 200,
      params: [
        { name: 'query', type: 'BODY' as const, exampleValue: 'query { me { id name role permissions } }', category: 'GENERIC' as const, riskNote: 'GraphQL query introspection audit' },
        { name: 'variables', type: 'BODY' as const, exampleValue: '{}', category: 'GENERIC' as const },
      ],
      tags: ['GraphQL', 'Introspection', 'API Gateway'],
    },
    {
      path: '/docs/swagger.json',
      method: 'GET' as const,
      isApi: true,
      apiType: 'SWAGGER_DOC' as const,
      statusCode: 200,
      params: [],
      tags: ['Swagger / OpenAPI', 'Schema Disclosure', 'API Catalog'],
    },
    {
      path: '/api/v1/export',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'type', type: 'QUERY' as const, exampleValue: 'csv', category: 'DATA_FILTER' as const },
        { name: 'token', type: 'QUERY' as const, exampleValue: 'exp_session_auth_key', category: 'AUTH_TOKEN' as const, isSensitive: true },
        { name: 'debug', type: 'QUERY' as const, exampleValue: '0', category: 'DEBUG_FLAG' as const, riskNote: 'Debug parameter flag' },
      ],
      tags: ['Data Export', 'Auth In Query', 'Parameterized'],
    },
    {
      path: '/webhooks/stripe',
      method: 'POST' as const,
      isApi: true,
      apiType: 'WEBHOOK' as const,
      statusCode: 200,
      params: [
        { name: 'signature', type: 'HEADER' as const, exampleValue: 't=1724800000,v1=982a...', category: 'AUTH_TOKEN' as const },
      ],
      tags: ['Webhook Receiver', 'Payment Gateway'],
    },
    {
      path: '/healthz',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [],
      tags: ['Kubernetes Health', 'Infra'],
    },
    {
      path: '/admin/settings',
      method: 'GET' as const,
      isApi: false,
      apiType: 'STANDARD_HTTP' as const,
      statusCode: 403,
      params: [
        { name: 'tab', type: 'QUERY' as const, exampleValue: 'security', category: 'DATA_FILTER' as const },
        { name: 'view_mode', type: 'QUERY' as const, exampleValue: 'extended', category: 'GENERIC' as const },
      ],
      tags: ['Admin Portal', 'Access Restricted', 'Parameterized'],
    },
    {
      path: '/api/v1/billing/invoices',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'account_id', type: 'QUERY' as const, exampleValue: 'acc_9831', category: 'ID' as const, riskNote: 'BOLA/IDOR check candidate', isSensitive: true },
        { name: 'status', type: 'QUERY' as const, exampleValue: 'paid', category: 'DATA_FILTER' as const },
        { name: 'year', type: 'QUERY' as const, exampleValue: '2026', category: 'DATA_FILTER' as const },
      ],
      tags: ['Billing API', 'BOLA Candidate', 'Financial', 'Parameterized'],
    },
    {
      path: '/api/v2/proxy/fetch',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'target_url', type: 'QUERY' as const, exampleValue: 'http://169.254.169.254/latest/meta-data/', category: 'REDIRECT_URL' as const, riskNote: 'Potential SSRF injection point', isSensitive: true },
        { name: 'timeout', type: 'QUERY' as const, exampleValue: '5', category: 'DATA_FILTER' as const },
      ],
      tags: ['Proxy Service', 'SSRF Audit', 'Parameterized', 'Critical Risk'],
    },
    {
      path: '/api/v1/files/preview',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'doc', type: 'QUERY' as const, exampleValue: '../../../../etc/passwd', category: 'FILE_PATH' as const, riskNote: 'LFI / Directory traversal test vector', isSensitive: true },
        { name: 'render', type: 'QUERY' as const, exampleValue: 'html', category: 'DATA_FILTER' as const },
      ],
      tags: ['File Viewer', 'LFI Candidate', 'Parameterized'],
    },
    {
      path: '/api/v1/debug/config',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 200,
      params: [
        { name: 'debug', type: 'QUERY' as const, exampleValue: '1', category: 'DEBUG_FLAG' as const, riskNote: 'Sensitive diagnostic mode disclosure' },
        { name: 'verbose', type: 'QUERY' as const, exampleValue: 'true', category: 'DEBUG_FLAG' as const },
        { name: 'key', type: 'QUERY' as const, exampleValue: 'sec_master_diag', category: 'AUTH_TOKEN' as const, isSensitive: true },
      ],
      tags: ['Debug Endpoint', 'Information Disclosure', 'Parameterized'],
    },
    {
      path: '/api/v1/notifications/ws',
      method: 'GET' as const,
      isApi: true,
      apiType: 'REST' as const,
      statusCode: 101,
      params: [
        { name: 'user_token', type: 'QUERY' as const, exampleValue: 'jwt_ws_sess_4920', category: 'AUTH_TOKEN' as const, isSensitive: true },
        { name: 'channel', type: 'QUERY' as const, exampleValue: 'secops_stream', category: 'GENERIC' as const },
      ],
      tags: ['WebSocket', 'Realtime', 'Auth In Query', 'Parameterized'],
    }
  ];

  // Pick hosts from discovered subdomains or target
  const hostsToProbe = [
    domain,
    ...subdomains.filter((s) => s.startsWith('api') || s.startsWith('auth') || s.startsWith('dev') || s.startsWith('gateway') || s.startsWith('admin')),
  ];

  let idCounter = 1;
  for (const host of hostsToProbe) {
    for (const tmpl of endpointTemplates) {
      // Build sample URL with query string if query params exist
      const queryParams = tmpl.params.filter((p) => p.type === 'QUERY');
      let queryString = '';
      if (queryParams.length > 0) {
        queryString = '?' + queryParams.map((p) => `${p.name}=${encodeURIComponent(p.exampleValue || '')}`).join('&');
      }

      const fullUrl = `https://${host}${tmpl.path}${queryString}`;

      endpoints.push({
        id: `ep_${targetId}_${idCounter++}`,
        targetId,
        hostname: host,
        url: fullUrl,
        path: tmpl.path,
        method: tmpl.method,
        isApi: tmpl.isApi,
        apiType: tmpl.apiType,
        statusCode: tmpl.statusCode,
        hasParameters: tmpl.params.length > 0,
        parameters: tmpl.params,
        parameterCount: tmpl.params.length,
        tags: tmpl.tags,
        firstDiscovered: now,
      });
    }
  }

  return endpoints;
}
