/**
 * Security Monitoring & Incident Response
 *
 * Comprehensive security event logging, alerting, and response system
 * for AI applications with real-time threat detection
 */

interface SecurityIncident {
  id: string;
  timestamp: string;
  type: 'PROMPT_INJECTION' | 'DATA_BREACH' | 'AUTH_ATTACK' | 'MODEL_ABUSE' | 'SYSTEM_COMPROMISE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  source: string;
  description: string;
  evidence: SecurityEvidence[];
  response: IncidentResponse;
  metadata: Record<string, any>;
}

interface SecurityEvidence {
  type: 'LOG_ENTRY' | 'NETWORK_DATA' | 'USER_INPUT' | 'SYSTEM_OUTPUT' | 'FILE_ACCESS';
  timestamp: string;
  data: string;
  hash: string;
  source: string;
}

interface IncidentResponse {
  automaticActions: string[];
  manualActions: string[];
  notifications: NotificationTarget[];
  escalationLevel: number;
  responseTime: number;
}

interface NotificationTarget {
  type: 'EMAIL' | 'SLACK' | 'SMS' | 'WEBHOOK';
  target: string;
  severity: 'HIGH' | 'CRITICAL';
}

interface SecurityMetrics {
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  averageResponseTime: number;
  blockedAttacks: number;
  falsePositives: number;
  systemUptime: number;
}

interface MonitoringConfig {
  enableRealTimeAlerts: boolean;
  enableBehaviorAnalysis: boolean;
  enableThreatIntelligence: boolean;
  maxIncidentsPerHour: number;
  autoContainmentEnabled: boolean;
  retentionDays: number;
  alertThresholds: {
    promptInjections: number;
    failedAuth: number;
    dataLeaks: number;
    anomalousPatterns: number;
  };
}

class SecurityMonitoringService {
  private static incidents: Map<string, SecurityIncident> = new Map();
  private static metrics: SecurityMetrics = {
    totalIncidents: 0,
    incidentsByType: {},
    incidentsBySeverity: {},
    averageResponseTime: 0,
    blockedAttacks: 0,
    falsePositives: 0,
    systemUptime: 100
  };

  private static config: MonitoringConfig = {
    enableRealTimeAlerts: true,
    enableBehaviorAnalysis: true,
    enableThreatIntelligence: true,
    maxIncidentsPerHour: 50,
    autoContainmentEnabled: true,
    retentionDays: 90,
    alertThresholds: {
      promptInjections: 5,
      failedAuth: 10,
      dataLeaks: 1,
      anomalousPatterns: 20
    }
  };

  private static alertCounts: Map<string, { count: number; windowStart: number }> = new Map();

  /**
   * Report security incident for monitoring and response
   */
  static reportIncident(
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity'],
    description: string,
    source: string,
    evidence: Partial<SecurityEvidence>[] = [],
    metadata: Record<string, any> = {}
  ): string {
    const incidentId = this.generateIncidentId();
    const timestamp = new Date().toISOString();

    const incident: SecurityIncident = {
      id: incidentId,
      timestamp,
      type,
      severity,
      status: 'DETECTED',
      source,
      description,
      evidence: evidence.map(e => ({
        type: e.type || 'LOG_ENTRY',
        timestamp: e.timestamp || timestamp,
        data: e.data || '',
        hash: this.hashData(e.data || ''),
        source: e.source || source
      })),
      response: {
        automaticActions: [],
        manualActions: [],
        notifications: [],
        escalationLevel: this.calculateEscalationLevel(severity),
        responseTime: 0
      },
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        reportedAt: timestamp
      }
    };

    // Store incident
    this.incidents.set(incidentId, incident);

    // Update metrics
    this.updateMetrics(incident);

    // Trigger automated response
    this.triggerAutomatedResponse(incident);

    // Check alert thresholds
    this.checkAlertThresholds(type, severity);

    // Log incident
    this.logIncident(incident);

    console.warn(`🚨 Security incident ${incidentId} reported:`, {
      type,
      severity,
      description,
      source
    });

    return incidentId;
  }

  /**
   * Comprehensive threat pattern analysis
   */
  static analyzeThreatPatterns(timeWindowHours = 24): {
    patterns: ThreatPattern[];
    recommendations: string[];
    riskScore: number;
  } {
    const cutoff = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentIncidents = Array.from(this.incidents.values())
      .filter(i => new Date(i.timestamp).getTime() > cutoff);

    const patterns: ThreatPattern[] = [];
    let riskScore = 0;

    // Pattern 1: Coordinated prompt injection attacks
    const injectionAttacks = recentIncidents.filter(i => i.type === 'PROMPT_INJECTION');
    if (injectionAttacks.length > 3) {
      patterns.push({
        type: 'COORDINATED_INJECTION',
        confidence: Math.min(100, injectionAttacks.length * 20),
        description: `${injectionAttacks.length} prompt injection attempts detected`,
        indicators: injectionAttacks.map(i => i.source),
        recommendation: 'Implement stricter input validation and rate limiting'
      });
      riskScore += 30;
    }

    // Pattern 2: Authentication brute force
    const authAttacks = recentIncidents.filter(i => i.type === 'AUTH_ATTACK');
    if (authAttacks.length > 5) {
      patterns.push({
        type: 'BRUTE_FORCE',
        confidence: Math.min(100, authAttacks.length * 15),
        description: `${authAttacks.length} authentication attacks detected`,
        indicators: [...new Set(authAttacks.map(i => i.source))],
        recommendation: 'Enable account lockout and implement CAPTCHA'
      });
      riskScore += 40;
    }

    // Pattern 3: Data exfiltration attempts
    const dataBreaches = recentIncidents.filter(i => i.type === 'DATA_BREACH');
    if (dataBreaches.length > 0) {
      patterns.push({
        type: 'DATA_EXFILTRATION',
        confidence: 95,
        description: `${dataBreaches.length} data breach incidents detected`,
        indicators: dataBreaches.map(i => i.source),
        recommendation: 'Review data access controls and enable DLP'
      });
      riskScore += 60;
    }

    // Pattern 4: Model abuse patterns
    const modelAbuse = recentIncidents.filter(i => i.type === 'MODEL_ABUSE');
    if (modelAbuse.length > 2) {
      patterns.push({
        type: 'MODEL_MANIPULATION',
        confidence: Math.min(100, modelAbuse.length * 25),
        description: `${modelAbuse.length} model abuse attempts detected`,
        indicators: modelAbuse.map(i => i.metadata.technique || 'unknown'),
        recommendation: 'Implement model output filtering and usage monitoring'
      });
      riskScore += 35;
    }

    const recommendations = [
      ...patterns.map(p => p.recommendation),
      riskScore > 80 ? 'URGENT: Enable emergency security mode' : '',
      riskScore > 60 ? 'Consider implementing additional security controls' : '',
      patterns.length > 3 ? 'Review and update security policies' : ''
    ].filter(Boolean);

    return {
      patterns,
      recommendations,
      riskScore: Math.min(100, riskScore)
    };
  }

  /**
   * Real-time behavioral anomaly detection
   */
  static detectAnomalies(userBehavior: UserBehavior): {
    anomalies: Anomaly[];
    riskScore: number;
    actions: string[];
  } {
    const anomalies: Anomaly[] = [];
    let riskScore = 0;

    // Check request frequency anomalies
    if (userBehavior.requestsPerMinute > 30) {
      anomalies.push({
        type: 'HIGH_FREQUENCY',
        severity: 'MEDIUM',
        description: `Unusually high request rate: ${userBehavior.requestsPerMinute}/min`,
        confidence: 85
      });
      riskScore += 25;
    }

    // Check prompt length anomalies
    if (userBehavior.averagePromptLength > 5000) {
      anomalies.push({
        type: 'LARGE_PROMPTS',
        severity: 'HIGH',
        description: `Unusually large prompts: ${userBehavior.averagePromptLength} chars`,
        confidence: 90
      });
      riskScore += 40;
    }

    // Check geographic anomalies
    if (userBehavior.locationChanges > 3) {
      anomalies.push({
        type: 'GEOGRAPHIC_ANOMALY',
        severity: 'HIGH',
        description: `Rapid location changes: ${userBehavior.locationChanges}`,
        confidence: 80
      });
      riskScore += 35;
    }

    // Check timing anomalies
    if (userBehavior.offHoursActivity > 80) {
      anomalies.push({
        type: 'TIMING_ANOMALY',
        severity: 'MEDIUM',
        description: `High off-hours activity: ${userBehavior.offHoursActivity}%`,
        confidence: 70
      });
      riskScore += 20;
    }

    const actions = this.generateResponseActions(anomalies, riskScore);

    return { anomalies, riskScore, actions };
  }

  /**
   * Security dashboard metrics
   */
  static getSecurityDashboard(): {
    overview: SecurityMetrics;
    recentIncidents: SecurityIncident[];
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendations: string[];
  } {
    const recentIncidents = Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const threatLevel = this.calculateThreatLevel();
    const recommendations = this.generateSecurityRecommendations();

    return {
      overview: { ...this.metrics },
      recentIncidents,
      threatLevel,
      recommendations
    };
  }

  /**
   * Generate incident ID
   */
  private static generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INC_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Calculate escalation level based on severity
   */
  private static calculateEscalationLevel(severity: SecurityIncident['severity']): number {
    switch (severity) {
      case 'LOW': return 1;
      case 'MEDIUM': return 2;
      case 'HIGH': return 3;
      case 'CRITICAL': return 4;
      default: return 1;
    }
  }

  /**
   * Update security metrics
   */
  private static updateMetrics(incident: SecurityIncident): void {
    this.metrics.totalIncidents++;
    this.metrics.incidentsByType[incident.type] = (this.metrics.incidentsByType[incident.type] || 0) + 1;
    this.metrics.incidentsBySeverity[incident.severity] = (this.metrics.incidentsBySeverity[incident.severity] || 0) + 1;

    if (incident.status === 'CONTAINED') {
      this.metrics.blockedAttacks++;
    }
  }

  /**
   * Trigger automated response
   */
  private static triggerAutomatedResponse(incident: SecurityIncident): void {
    if (!this.config.autoContainmentEnabled) return;

    const actions: string[] = [];

    switch (incident.severity) {
      case 'CRITICAL':
        actions.push('IMMEDIATE_CONTAINMENT');
        actions.push('ALERT_SECURITY_TEAM');
        actions.push('BLOCK_SOURCE_IP');
        break;
      case 'HIGH':
        actions.push('RATE_LIMIT_SOURCE');
        actions.push('ALERT_SECURITY_TEAM');
        break;
      case 'MEDIUM':
        actions.push('LOG_AND_MONITOR');
        break;
    }

    incident.response.automaticActions = actions;
    this.executeAutomaticActions(actions, incident);
  }

  /**
   * Execute automatic response actions
   */
  private static executeAutomaticActions(actions: string[], incident: SecurityIncident): void {
    for (const action of actions) {
      switch (action) {
        case 'IMMEDIATE_CONTAINMENT':
          this.executeContainment(incident);
          break;
        case 'ALERT_SECURITY_TEAM':
          this.alertSecurityTeam(incident);
          break;
        case 'BLOCK_SOURCE_IP':
          this.blockSourceIP(incident.source);
          break;
        case 'RATE_LIMIT_SOURCE':
          this.rateLimitSource(incident.source);
          break;
        case 'LOG_AND_MONITOR':
          this.enhanceMonitoring(incident.source);
          break;
      }
    }
  }

  /**
   * Check alert thresholds
   */
  private static checkAlertThresholds(type: string, severity: string): void {
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000;

    let alertData = this.alertCounts.get(type);
    if (!alertData || now - alertData.windowStart > hourWindow) {
      alertData = { count: 0, windowStart: now };
    }

    alertData.count++;
    this.alertCounts.set(type, alertData);

    const threshold = this.config.alertThresholds[type as keyof typeof this.config.alertThresholds] || 10;

    if (alertData.count >= threshold) {
      this.reportIncident(
        'SYSTEM_COMPROMISE',
        'HIGH',
        `Alert threshold exceeded for ${type}: ${alertData.count} incidents in 1 hour`,
        'MONITORING_SYSTEM',
        [],
        { originalType: type, threshold, actualCount: alertData.count }
      );
    }
  }

  /**
   * Calculate current threat level
   */
  private static calculateThreatLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const recentIncidents = Array.from(this.incidents.values())
      .filter(i => Date.now() - new Date(i.timestamp).getTime() < 24 * 60 * 60 * 1000);

    const criticalCount = recentIncidents.filter(i => i.severity === 'CRITICAL').length;
    const highCount = recentIncidents.filter(i => i.severity === 'HIGH').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 2) return 'HIGH';
    if (recentIncidents.length > 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate security recommendations
   */
  private static generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const { patterns } = this.analyzeThreatPatterns();

    if (patterns.length > 0) {
      recommendations.push('Review and strengthen input validation');
    }

    if (this.metrics.incidentsBySeverity.CRITICAL > 0) {
      recommendations.push('Implement immediate security hardening');
    }

    if (this.metrics.blockedAttacks / this.metrics.totalIncidents < 0.5) {
      recommendations.push('Improve automated threat response');
    }

    recommendations.push('Regular security assessment and penetration testing');
    recommendations.push('Update security training for development team');

    return recommendations;
  }

  /**
   * Placeholder methods for actual response actions
   */
  private static executeContainment(incident: SecurityIncident): void {
    console.warn(`🔒 CONTAINMENT: ${incident.id}`);
  }

  private static alertSecurityTeam(incident: SecurityIncident): void {
    console.warn(`📧 SECURITY ALERT: ${incident.id}`);
  }

  private static blockSourceIP(source: string): void {
    console.warn(`🚫 BLOCKING IP: ${source}`);
  }

  private static rateLimitSource(source: string): void {
    console.warn(`⏱️ RATE LIMITING: ${source}`);
  }

  private static enhanceMonitoring(source: string): void {
    console.warn(`👁️ ENHANCED MONITORING: ${source}`);
  }

  private static generateResponseActions(anomalies: Anomaly[], riskScore: number): string[] {
    const actions: string[] = [];

    if (riskScore > 80) {
      actions.push('IMMEDIATE_INVESTIGATION');
    }
    if (riskScore > 60) {
      actions.push('ENHANCED_MONITORING');
    }
    if (anomalies.some(a => a.type === 'HIGH_FREQUENCY')) {
      actions.push('IMPLEMENT_RATE_LIMITING');
    }

    return actions;
  }

  private static logIncident(incident: SecurityIncident): void {
    // Safe logging without sensitive data
    console.warn('🚨 Security Incident:', {
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      timestamp: incident.timestamp,
      source: incident.source,
      description: incident.description
    });
  }

  private static hashData(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}

// Types for threat analysis
interface ThreatPattern {
  type: string;
  confidence: number;
  description: string;
  indicators: string[];
  recommendation: string;
}

interface UserBehavior {
  requestsPerMinute: number;
  averagePromptLength: number;
  locationChanges: number;
  offHoursActivity: number;
}

interface Anomaly {
  type: string;
  severity: string;
  description: string;
  confidence: number;
}

export {
  SecurityMonitoringService,
  type SecurityIncident,
  type SecurityMetrics,
  type MonitoringConfig,
  type ThreatPattern,
  type UserBehavior,
  type Anomaly
};