// src/server/scanner/riskScoring.ts
// Explainable risk calculation engine normalized from 0 to 100

import { Finding, RiskScoreBreakdown, Severity } from '../../types';

export function calculateRiskScore(findings: Finding[], openServicesCount: number = 0): RiskScoreBreakdown {
  let rawScore = 0;
  const contributors: { label: string; points: number; description: string }[] = [];

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;
  let unresolvedCount = 0;

  for (const f of findings) {
    if (f.status === 'RESOLVED' || f.status === 'FALSE_POSITIVE') continue;
    unresolvedCount++;

    if (f.severity === 'CRITICAL') {
      criticalCount++;
      const pts = 25;
      rawScore += pts;
    } else if (f.severity === 'HIGH') {
      highCount++;
      const pts = 15;
      rawScore += pts;
    } else if (f.severity === 'MEDIUM') {
      mediumCount++;
      const pts = 7;
      rawScore += pts;
    } else if (f.severity === 'LOW') {
      lowCount++;
      const pts = 3;
      rawScore += pts;
    } else {
      infoCount++;
    }
  }

  if (criticalCount > 0) {
    const critPts = Math.min(criticalCount * 25, 50);
    contributors.push({
      label: 'Critical Exposures',
      points: critPts,
      description: `${criticalCount} critical vulnerability/service leak (e.g. exposed credentials or unauthenticated database)`,
    });
  }

  if (highCount > 0) {
    const highPts = Math.min(highCount * 15, 30);
    contributors.push({
      label: 'High Severity Findings',
      points: highPts,
      description: `${highCount} high-risk misconfiguration or exposed management interface`,
    });
  }

  if (mediumCount > 0) {
    const medPts = Math.min(mediumCount * 7, 20);
    contributors.push({
      label: 'Medium Severity Weaknesses',
      points: medPts,
      description: `${mediumCount} missing defensive controls, header leaks, or legacy protocols`,
    });
  }

  if (openServicesCount > 5) {
    const srvPts = Math.min((openServicesCount - 5) * 2, 10);
    rawScore += srvPts;
    contributors.push({
      label: 'Broad Attack Surface / Services',
      points: srvPts,
      description: `${openServicesCount} exposed network ports and public service listeners`,
    });
  }

  // Normalize score to 0 - 100
  const normalizedScore = Math.min(Math.max(Math.round(rawScore), 0), 100);

  let level: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (normalizedScore >= 81) {
    level = 'CRITICAL';
  } else if (normalizedScore >= 61) {
    level = 'HIGH';
  } else if (normalizedScore >= 41) {
    level = 'ELEVATED';
  } else if (normalizedScore >= 21) {
    level = 'GUARDED';
  } else {
    level = 'LOW';
  }

  return {
    score: normalizedScore,
    level,
    contributors,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    exposedServicesCount: openServicesCount,
    unresolvedCount,
  };
}
