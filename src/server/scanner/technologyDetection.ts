// src/server/scanner/technologyDetection.ts
// Passive technology stack fingerprinting module

import { HttpMetadata, Service, Technology } from '../../types';

export function detectTechnologies(
  assetId: string,
  hostname: string,
  httpMeta?: HttpMetadata,
  services: Service[] = []
): Technology[] {
  const technologies: Technology[] = [];
  const now = new Date().toISOString();
  const added = new Set<string>();

  const addTech = (name: string, category: string, version?: string, confidence = 95) => {
    if (added.has(name)) return;
    added.add(name);
    technologies.push({
      id: `tech_${Math.random().toString(36).substring(2, 9)}`,
      assetId,
      name,
      category,
      version,
      confidence,
      firstSeen: now,
      lastSeen: now,
    });
  };

  const headers = httpMeta?.headers || {};
  const server = (headers['server'] || '').toLowerCase();
  const poweredBy = (headers['x-powered-by'] || '').toLowerCase();

  // Server Headers
  if (server.includes('cloudflare')) {
    addTech('Cloudflare CDN', 'CDN & WAF', undefined, 100);
  }
  if (server.includes('nginx')) {
    const vMatch = server.match(/nginx\/([\d.]+)/);
    addTech('Nginx', 'Web Server', vMatch ? vMatch[1] : undefined, 95);
  }
  if (server.includes('apache')) {
    const vMatch = server.match(/apache\/([\d.]+)/);
    addTech('Apache HTTP Server', 'Web Server', vMatch ? vMatch[1] : undefined, 95);
  }
  if (server.includes('express')) {
    addTech('Express', 'Web Framework', undefined, 95);
  }

  // Powered-by Headers
  if (poweredBy.includes('express')) {
    addTech('Express', 'Web Framework', undefined, 95);
    addTech('Node.js', 'Runtime', undefined, 95);
  }
  if (poweredBy.includes('php')) {
    const vMatch = poweredBy.match(/php\/([\d.]+)/);
    addTech('PHP', 'Programming Language', vMatch ? vMatch[1] : undefined, 95);
  }
  if (poweredBy.includes('next.js') || headers['x-nextjs-cache']) {
    addTech('Next.js', 'Web Framework', undefined, 95);
    addTech('React', 'JavaScript UI', undefined, 95);
  }

  // Inspect Services
  for (const s of services) {
    if (s.name === 'SSH' || s.port === 22) {
      addTech('OpenSSH', 'Remote Management', undefined, 90);
    }
    if (s.name === 'Redis' || s.port === 6379) {
      addTech('Redis', 'Cache / Database', '6.2+', 90);
    }
    if (s.name === 'MySQL' || s.port === 3306) {
      addTech('MySQL', 'Database', '8.0', 95);
    }
    if (s.name === 'PostgreSQL' || s.port === 5432) {
      addTech('PostgreSQL', 'Database', undefined, 95);
    }
    if (s.name === 'Elasticsearch' || s.port === 9200) {
      addTech('Elasticsearch', 'Search Engine', '7.x', 90);
    }
    if (s.port === 3000 || s.name.includes('Grafana')) {
      addTech('Grafana', 'Observability', '9.x', 90);
    }
  }

  // Hostname heuristic
  if (hostname.includes('mail')) {
    addTech('Postfix', 'Mail Transfer Agent', undefined, 85);
  }

  // Default fallback if minimal stack
  if (technologies.length === 0) {
    addTech('TLS/HTTPS', 'Transport Protocol', '1.3', 90);
  }

  return technologies;
}
