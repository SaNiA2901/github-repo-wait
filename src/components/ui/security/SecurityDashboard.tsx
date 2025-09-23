/**
 * Security Dashboard Component
 * Displays security audit results and recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { SecurityAuditService, SecurityAuditReport, SecurityIssue } from '@/services/security/SecurityAuditService';

export const SecurityDashboard: React.FC = () => {
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    loadLatestReport();
  }, []);

  const loadLatestReport = async () => {
    const service = SecurityAuditService.getInstance();
    const latest = await service.getLatestReport();
    setAuditReport(latest);
  };

  const runSecurityAudit = async () => {
    setIsLoading(true);
    try {
      const service = SecurityAuditService.getInstance();
      const report = await service.performFullAudit();
      setAuditReport(report);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-muted-foreground" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getSeverityColor = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getRiskScore = () => {
    if (!auditReport) return 0;
    
    const weights = { critical: 100, high: 50, medium: 20, low: 5 };
    const totalWeight = 
      auditReport.criticalIssues * weights.critical +
      auditReport.highIssues * weights.high +
      auditReport.mediumIssues * weights.medium +
      auditReport.lowIssues * weights.low;
    
    return Math.min(100, totalWeight);
  };

  const getSecurityScore = () => Math.max(0, 100 - getRiskScore());

  const filteredIssues = auditReport?.issues.filter(issue => 
    selectedSeverity === 'all' || issue.severity === selectedSeverity
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage application security</p>
          </div>
        </div>
        <Button 
          onClick={runSecurityAudit} 
          disabled={isLoading}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          {isLoading ? 'Running Audit...' : 'Run Security Audit'}
        </Button>
      </div>

      {auditReport && (
        <>
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {getSecurityScore()}/100
                </div>
                <Progress value={getSecurityScore()} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditReport.totalIssues}</div>
                <p className="text-sm text-muted-foreground">
                  Last scan: {auditReport.timestamp.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {auditReport.criticalIssues}
                </div>
                <p className="text-sm text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getSeverityColor(auditReport.overallRisk as any)}>
                  {auditReport.overallRisk.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Risk assessment level
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Critical</span>
                </div>
                <div className="text-2xl font-bold mt-2">{auditReport.criticalIssues}</div>
              </CardContent>
            </Card>

            <Card className="border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="font-medium">High</span>
                </div>
                <div className="text-2xl font-bold mt-2">{auditReport.highIssues}</div>
              </CardContent>
            </Card>

            <Card className="border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="font-medium">Medium</span>
                </div>
                <div className="text-2xl font-bold mt-2">{auditReport.mediumIssues}</div>
              </CardContent>
            </Card>

            <Card className="border-muted/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Low</span>
                </div>
                <div className="text-2xl font-bold mt-2">{auditReport.lowIssues}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Tabs defaultValue="issues" className="space-y-4">
            <TabsList>
              <TabsTrigger value="issues">Security Issues</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={selectedSeverity === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('all')}
                >
                  All ({auditReport.totalIssues})
                </Button>
                <Button
                  variant={selectedSeverity === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('critical')}
                >
                  Critical ({auditReport.criticalIssues})
                </Button>
                <Button
                  variant={selectedSeverity === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('high')}
                >
                  High ({auditReport.highIssues})
                </Button>
                <Button
                  variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('medium')}
                >
                  Medium ({auditReport.mediumIssues})
                </Button>
                <Button
                  variant={selectedSeverity === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('low')}
                >
                  Low ({auditReport.lowIssues})
                </Button>
              </div>

              <div className="space-y-4">
                {filteredIssues.map((issue, index) => (
                  <Card key={issue.id || index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div>
                            <CardTitle className="text-lg">{issue.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getSeverityColor(issue.severity)}>
                                {issue.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{issue.category}</Badge>
                              {issue.cvss && (
                                <Badge variant="secondary">
                                  CVSS: {issue.cvss}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">{issue.description}</p>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Location: </span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {issue.location}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Recommendation: </span>
                          <span className="text-muted-foreground">{issue.recommendation}</span>
                        </div>
                        {issue.cwe && (
                          <div>
                            <span className="font-medium">CWE: </span>
                            <Badge variant="outline">{issue.cwe}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Security Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditReport.recommendations.map((recommendation, index) => (
                      <Alert key={index}>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{recommendation}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!auditReport && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Security Audit Available</h3>
            <p className="text-muted-foreground mb-4">
              Run a security audit to identify potential vulnerabilities and get recommendations.
            </p>
            <Button onClick={runSecurityAudit}>
              Run First Security Audit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};