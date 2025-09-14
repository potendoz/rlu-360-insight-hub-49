import { useState, useEffect } from "react";
import { Calendar, Users, AlertTriangle, CheckCircle2, Clock, Target, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PDFExport } from "@/components/PDFExport";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";

interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  department: string;
  rlu_score: number;
  lp_ratio: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
  estimated_cost: number;
  cost_savings: number;
  total_tests: number;
  total_patients: number;
}

interface RCAAnalysis {
  kpi: string;
  description: string;
  currentValue: number;
  targetValue: number;
  variance: number;
  impact: 'High' | 'Medium' | 'Low';
  rootCauses: {
    people: string[];
    process: string[];
    technology: string[];
    policy: string[];
    environment: string[];
    measurement: string[];
  };
  fiveWhys: string[];
  primaryRootCause: string;
  actionableInsights: string[];
  actionPlan: {
    shortTerm: { action: string; timeline: string; owner: string }[];
    mediumTerm: { action: string; timeline: string; owner: string }[];
  };
}

export const RCAReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [doctorsData, setDoctorsData] = useState<DoctorData[]>([]);
  const [doctors, setDoctors] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [rcaAnalyses, setRcaAnalyses] = useState<RCAAnalysis[]>([]);

  const months = [
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" }
  ];

  const years = ["2025", "2024", "2023", "2022"];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('doctor_monthly_data')
        .select(`
          *,
          doctors!inner(id, name, specialty, department)
        `)
        .eq('month', selectedMonth)
        .eq('year', parseInt(selectedYear));

      if (selectedDoctor !== "all") {
        query = query.eq('doctor_id', selectedDoctor);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedData = (data || []).map((item: any) => ({
        id: item.doctor_id,
        name: item.doctors.name,
        specialty: item.doctors.specialty,
        department: item.doctors.department,
        rlu_score: item.rlu_score || 0,
        lp_ratio: item.lp_ratio || 0,
        cpg_mismatch_percentage: item.cpg_mismatch_percentage || 0,
        duplicate_order_rate: item.duplicate_order_rate || 0,
        estimated_cost: item.estimated_cost || 0,
        cost_savings: item.cost_savings || 0,
        total_tests: item.total_tests || 0,
        total_patients: item.total_patients || 0,
      }));

      setDoctorsData(processedData);
      generateRCAAnalyses(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRCAAnalyses = (data: DoctorData[]) => {
    if (data.length === 0) {
      setRcaAnalyses([]);
      return;
    }

    const avgRLU = data.reduce((sum, d) => sum + d.rlu_score, 0) / data.length;
    const avgLPRatio = data.reduce((sum, d) => sum + d.lp_ratio, 0) / data.length;
    const avgCPGMismatch = data.reduce((sum, d) => sum + d.cpg_mismatch_percentage, 0) / data.length;
    const avgDuplicateRate = data.reduce((sum, d) => sum + d.duplicate_order_rate, 0) / data.length;
    const totalCost = data.reduce((sum, d) => sum + d.estimated_cost, 0);
    const totalPatients = data.reduce((sum, d) => sum + d.total_patients, 0);
    const totalTests = data.reduce((sum, d) => sum + d.total_tests, 0);

    console.log('RCA Analysis Data:', {
      doctorCount: data.length,
      avgRLU,
      avgLPRatio,
      avgCPGMismatch,
      avgDuplicateRate,
      totalCost,
      totalPatients,
      totalTests
    });

    // Determine impact levels based on actual data
    const getImpactLevel = (kpi: string, value: number) => {
      switch (kpi) {
        case 'RLU Score':
          return value < 60 ? 'High' : value < 75 ? 'Medium' : 'Low';
        case 'L/P Ratio':
          return value > 4.5 ? 'High' : value > 3.5 ? 'Medium' : 'Low';
        case 'CPG Mismatch Rate':
          return value > 20 ? 'High' : value > 10 ? 'Medium' : 'Low';
        case 'Duplicate Order Rate':
          return value > 15 ? 'High' : value > 8 ? 'Medium' : 'Low';
        default:
          return 'Low';
      }
    };

    // Generate dynamic root causes and action plans based on impact level
    const generateRootCauseAnalysis = (kpi: string, impactLevel: string) => {
      const baseAnalysis = {
        'RLU Score': {
          Low: {
            primaryRootCause: "Minor gaps in RLU guideline implementation with satisfactory overall compliance",
            actionableInsights: [
              "Fine-tune existing RLU protocols for optimal performance",
              "Maintain current training effectiveness",
              "Enhance peer recognition programs"
            ],
            shortTerm: [
              { action: "Conduct quarterly RLU refresher sessions", timeline: "Week 2-4", owner: "Medical Education" },
              { action: "Update best practice documentation", timeline: "Week 1-2", owner: "Quality Team" }
            ],
            mediumTerm: [
              { action: "Implement advanced analytics dashboard", timeline: "Month 2-3", owner: "IT Department" },
              { action: "Establish center of excellence program", timeline: "Month 1-3", owner: "Medical Staff" }
            ]
          },
          Medium: {
            primaryRootCause: "Inconsistent RLU guideline adherence requiring targeted intervention and process improvement",
            actionableInsights: [
              "Strengthen clinical decision support systems",
              "Enhance physician education and feedback mechanisms",
              "Improve workflow integration of RLU guidelines",
              "Establish performance monitoring and accountability"
            ],
            shortTerm: [
              { action: "Deploy enhanced decision support alerts", timeline: "Week 1-3", owner: "IT Department" },
              { action: "Launch targeted training for low performers", timeline: "Week 2-4", owner: "Medical Education" },
              { action: "Implement weekly performance feedback", timeline: "Week 1", owner: "Quality Team" }
            ],
            mediumTerm: [
              { action: "Integrate RLU metrics into performance reviews", timeline: "Month 1-2", owner: "Medical Affairs" },
              { action: "Establish physician champion network", timeline: "Month 2-3", owner: "Medical Staff" },
              { action: "Deploy comprehensive workflow optimization", timeline: "Month 2-3", owner: "Process Improvement" }
            ]
          },
          High: {
            primaryRootCause: "Fundamental breakdown in RLU implementation requiring immediate organizational intervention and systematic restructuring",
            actionableInsights: [
              "Implement emergency RLU compliance intervention program",
              "Conduct comprehensive system redesign and training overhaul",
              "Establish strict monitoring and accountability measures",
              "Deploy intensive clinical decision support",
              "Initiate organizational culture change program"
            ],
            shortTerm: [
              { action: "Emergency RLU compliance task force formation", timeline: "Week 1", owner: "Chief Medical Officer" },
              { action: "Mandatory intensive RLU training for all staff", timeline: "Week 1-2", owner: "Medical Education" },
              { action: "Deploy strict decision support enforcement", timeline: "Week 1", owner: "IT Department" }
            ],
            mediumTerm: [
              { action: "Complete RLU system redesign and implementation", timeline: "Month 1-3", owner: "Executive Team" },
              { action: "Establish mandatory peer review program", timeline: "Month 1-2", owner: "Medical Staff" },
              { action: "Implement comprehensive culture change initiative", timeline: "Month 1-3", owner: "Organizational Development" }
            ]
          }
        },
        'L/P Ratio': {
          Low: {
            primaryRootCause: "Optimal test ordering patterns with minimal over-utilization requiring maintenance of current standards",
            actionableInsights: [
              "Maintain current efficient testing protocols",
              "Continue evidence-based ordering practices",
              "Sustain cost-effective care delivery"
            ],
            shortTerm: [
              { action: "Monitor and maintain current protocols", timeline: "Week 1-4", owner: "Quality Team" },
              { action: "Share best practices across departments", timeline: "Week 2-3", owner: "Medical Staff" }
            ],
            mediumTerm: [
              { action: "Establish testing efficiency center of excellence", timeline: "Month 2-3", owner: "Medical Affairs" },
              { action: "Develop mentorship program for new physicians", timeline: "Month 1-2", owner: "Medical Education" }
            ]
          },
          Medium: {
            primaryRootCause: "Moderate over-testing patterns requiring targeted optimization of ordering practices and workflow improvements",
            actionableInsights: [
              "Optimize test ordering protocols and guidelines",
              "Enhance clinical decision support for appropriate testing",
              "Improve physician education on cost-effective testing",
              "Implement systematic duplicate test prevention"
            ],
            shortTerm: [
              { action: "Deploy intelligent order sets", timeline: "Week 1-3", owner: "Clinical Informatics" },
              { action: "Implement duplicate test prevention alerts", timeline: "Week 1-2", owner: "IT Department" },
              { action: "Launch targeted education on appropriate testing", timeline: "Week 2-4", owner: "Medical Education" }
            ],
            mediumTerm: [
              { action: "Comprehensive testing protocol optimization", timeline: "Month 1-3", owner: "Clinical Committees" },
              { action: "Establish cost-awareness education program", timeline: "Month 2-3", owner: "Finance & Medical Education" },
              { action: "Implement advanced decision support analytics", timeline: "Month 2-3", owner: "IT & Analytics" }
            ]
          },
          High: {
            primaryRootCause: "Significant over-testing crisis requiring immediate intervention to control costs and improve patient care efficiency",
            actionableInsights: [
              "Implement emergency over-testing reduction program",
              "Establish strict test ordering oversight and approval processes",
              "Deploy comprehensive physician re-education initiative",
              "Implement mandatory cost-benefit analysis for high-volume orders",
              "Create immediate feedback and accountability systems"
            ],
            shortTerm: [
              { action: "Emergency test ordering restriction implementation", timeline: "Week 1", owner: "Chief Medical Officer" },
              { action: "Mandatory ordering oversight for high L/P ratios", timeline: "Week 1", owner: "Department Chiefs" },
              { action: "Immediate duplicate test blocking system", timeline: "Week 1", owner: "IT Department" }
            ],
            mediumTerm: [
              { action: "Complete testing protocol overhaul", timeline: "Month 1-3", owner: "Executive Team" },
              { action: "Mandatory cost-effectiveness training", timeline: "Month 1-2", owner: "Medical Education" },
              { action: "Implement peer review and approval systems", timeline: "Month 1-2", owner: "Medical Staff" }
            ]
          }
        },
        'CPG Mismatch Rate': {
          Low: {
            primaryRootCause: "Excellent guideline adherence with minimal deviations indicating effective clinical governance",
            actionableInsights: [
              "Maintain high standards of guideline compliance",
              "Continue effective clinical decision support",
              "Sustain evidence-based practice culture"
            ],
            shortTerm: [
              { action: "Continue current guideline monitoring", timeline: "Week 1-4", owner: "Quality Team" },
              { action: "Recognize and reward compliance excellence", timeline: "Week 2", owner: "Medical Affairs" }
            ],
            mediumTerm: [
              { action: "Establish guideline compliance mentoring program", timeline: "Month 1-2", owner: "Medical Education" },
              { action: "Develop advanced guideline integration features", timeline: "Month 2-3", owner: "Clinical Informatics" }
            ]
          },
          Medium: {
            primaryRootCause: "Moderate guideline adherence gaps requiring focused education and system improvements for better compliance",
            actionableInsights: [
              "Enhance guideline accessibility and integration into workflows",
              "Strengthen physician education on current evidence-based practices",
              "Improve real-time clinical decision support",
              "Establish regular guideline update and training cycles"
            ],
            shortTerm: [
              { action: "Deploy enhanced guideline decision support", timeline: "Week 1-3", owner: "Clinical Informatics" },
              { action: "Launch guideline compliance education series", timeline: "Week 2-4", owner: "Medical Education" },
              { action: "Implement compliance feedback dashboard", timeline: "Week 1-2", owner: "Quality Team" }
            ],
            mediumTerm: [
              { action: "Comprehensive guideline workflow integration", timeline: "Month 1-3", owner: "IT & Clinical Teams" },
              { action: "Establish peer review program for deviations", timeline: "Month 2", owner: "Medical Staff" },
              { action: "Implement automated guideline update system", timeline: "Month 2-3", owner: "Medical Library" }
            ]
          },
          High: {
            primaryRootCause: "Critical breakdown in evidence-based practice requiring immediate systematic intervention and compliance enforcement",
            actionableInsights: [
              "Implement emergency guideline compliance intervention",
              "Establish mandatory compliance monitoring and enforcement",
              "Deploy comprehensive re-education and training programs",
              "Implement strict oversight and approval processes for deviations",
              "Create immediate accountability and corrective action systems"
            ],
            shortTerm: [
              { action: "Emergency compliance task force activation", timeline: "Week 1", owner: "Chief Medical Officer" },
              { action: "Mandatory guideline compliance training", timeline: "Week 1-2", owner: "Medical Education" },
              { action: "Implement strict deviation approval process", timeline: "Week 1", owner: "Department Chiefs" }
            ],
            mediumTerm: [
              { action: "Complete clinical governance system overhaul", timeline: "Month 1-3", owner: "Executive Team" },
              { action: "Mandatory peer review for all deviations", timeline: "Month 1", owner: "Medical Staff" },
              { action: "Implement comprehensive compliance monitoring", timeline: "Month 1-2", owner: "Quality & IT" }
            ]
          }
        },
        'Duplicate Order Rate': {
          Low: {
            primaryRootCause: "Efficient test ordering with minimal duplication indicating good clinical coordination",
            actionableInsights: [
              "Maintain current effective coordination systems",
              "Continue optimal communication practices",
              "Sustain efficient workflow management"
            ],
            shortTerm: [
              { action: "Monitor and maintain current systems", timeline: "Week 1-4", owner: "Quality Team" },
              { action: "Document and share best practices", timeline: "Week 2-3", owner: "Process Improvement" }
            ],
            mediumTerm: [
              { action: "Establish efficiency recognition program", timeline: "Month 1-2", owner: "Medical Affairs" },
              { action: "Develop advanced coordination analytics", timeline: "Month 2-3", owner: "IT Department" }
            ]
          },
          Medium: {
            primaryRootCause: "Moderate duplication issues requiring improved communication and system coordination mechanisms",
            actionableInsights: [
              "Enhance inter-departmental communication systems",
              "Improve test result sharing and accessibility",
              "Implement better duplicate detection and prevention",
              "Strengthen care coordination protocols"
            ],
            shortTerm: [
              { action: "Deploy enhanced duplicate detection alerts", timeline: "Week 1-2", owner: "IT Department" },
              { action: "Improve test result notification systems", timeline: "Week 1-3", owner: "Laboratory" },
              { action: "Launch communication improvement training", timeline: "Week 2-4", owner: "Quality Team" }
            ],
            mediumTerm: [
              { action: "Implement comprehensive care coordination system", timeline: "Month 1-3", owner: "Clinical Operations" },
              { action: "Establish standardized handoff protocols", timeline: "Month 1-2", owner: "Medical Staff" },
              { action: "Deploy advanced test tracking analytics", timeline: "Month 2-3", owner: "IT & Analytics" }
            ]
          },
          High: {
            primaryRootCause: "Severe coordination breakdown with excessive duplicate testing requiring immediate system-wide intervention",
            actionableInsights: [
              "Implement emergency duplicate prevention measures",
              "Establish mandatory test ordering oversight",
              "Deploy comprehensive communication system overhaul",
              "Implement real-time coordination monitoring",
              "Create immediate feedback and correction systems"
            ],
            shortTerm: [
              { action: "Emergency duplicate blocking system", timeline: "Week 1", owner: "IT Department" },
              { action: "Mandatory test ordering approval process", timeline: "Week 1", owner: "Department Chiefs" },
              { action: "Immediate communication protocol enforcement", timeline: "Week 1", owner: "Chief Medical Officer" }
            ],
            mediumTerm: [
              { action: "Complete care coordination system redesign", timeline: "Month 1-3", owner: "Executive Team" },
              { action: "Implement comprehensive tracking and oversight", timeline: "Month 1-2", owner: "Quality & IT" },
              { action: "Establish mandatory coordination training", timeline: "Month 1-2", owner: "Medical Education" }
            ]
          }
        }
      };

      const kpiKey = kpi as 'RLU Score' | 'L/P Ratio' | 'CPG Mismatch Rate' | 'Duplicate Order Rate';
      const impactKey = impactLevel as 'Low' | 'Medium' | 'High';
      const analysis = baseAnalysis[kpiKey]?.[impactKey] || baseAnalysis['RLU Score']['Low'];
      return {
        primaryRootCause: analysis.primaryRootCause,
        actionableInsights: analysis.actionableInsights,
        actionPlan: {
          shortTerm: analysis.shortTerm,
          mediumTerm: analysis.mediumTerm
        }
      };
    };

    const analyses: RCAAnalysis[] = [
      {
        kpi: "RLU Score",
        description: "Rational Laboratory Use compliance score",
        currentValue: avgRLU,
        targetValue: 85,
        variance: avgRLU - 85,
        impact: getImpactLevel('RLU Score', avgRLU) as 'High' | 'Medium' | 'Low',
        rootCauses: {
          people: [
            "Insufficient training on RLU guidelines",
            "Lack of awareness of test appropriateness criteria",
            "Resistance to change from traditional ordering patterns"
          ],
          process: [
            "Inadequate clinical decision support systems",
            "Complex ordering workflows",
            "Lack of standardized test ordering protocols"
          ],
          technology: [
            "Limited integration between EMR and laboratory systems",
            "Absence of real-time clinical decision support",
            "Poor user interface design in ordering systems"
          ],
          policy: [
            "Unclear RLU implementation guidelines",
            "Inconsistent enforcement of ordering policies",
            "Lack of quality metrics and accountability"
          ],
          environment: [
            "High workload pressure affecting decision quality",
            "Limited time for careful test selection",
            "Cultural resistance to guideline adherence"
          ],
          measurement: [
            "Inadequate feedback mechanisms",
            "Delayed reporting of performance metrics",
            "Lack of benchmarking against best practices"
          ]
        },
        fiveWhys: [
          "Why is RLU score low? - Physicians are not following guidelines consistently",
          "Why are guidelines not followed? - Lack of awareness and training",
          "Why is there lack of awareness? - Insufficient communication and education programs",
          "Why are education programs insufficient? - Limited resources allocated to training",
          "Why are resources limited? - RLU implementation not prioritized at organizational level"
        ],
        ...generateRootCauseAnalysis('RLU Score', getImpactLevel('RLU Score', avgRLU))
      },
      {
        kpi: "L/P Ratio",
        description: "Laboratory tests per patient ratio",
        currentValue: avgLPRatio,
        targetValue: 2.5,
        variance: avgLPRatio - 2.5,
        impact: getImpactLevel('L/P Ratio', avgLPRatio) as 'High' | 'Medium' | 'Low',
        rootCauses: {
          people: [
            "Defensive medicine practices",
            "Inadequate clinical assessment skills",
            "Over-reliance on laboratory confirmation"
          ],
          process: [
            "Lack of test bundling protocols",
            "Inefficient ordering workflows encouraging over-testing",
            "Missing care pathway standardization"
          ],
          technology: [
            "Absence of intelligent order sets",
            "No duplicate test prevention mechanisms",
            "Poor integration of patient history in ordering systems"
          ],
          policy: [
            "Unclear test ordering guidelines",
            "No limits on test frequency",
            "Lack of cost-awareness policies"
          ],
          environment: [
            "Emergency department pressures",
            "Patient expectations for extensive testing",
            "Insurance coverage encouraging over-testing"
          ],
          measurement: [
            "No real-time monitoring of L/P ratios",
            "Inadequate trending analysis",
            "Missing comparative benchmarking"
          ]
        },
        fiveWhys: [
          "Why is L/P ratio high? - Physicians order more tests than clinically necessary",
          "Why do they order excessive tests? - Fear of missing diagnoses and defensive medicine",
          "Why do they practice defensive medicine? - Lack of confidence in clinical judgment",
          "Why is there lack of confidence? - Insufficient training in evidence-based testing",
          "Why is training insufficient? - No systematic competency development program"
        ],
        ...generateRootCauseAnalysis('L/P Ratio', getImpactLevel('L/P Ratio', avgLPRatio))
      },
      {
        kpi: "CPG Mismatch Rate",
        description: "Clinical Practice Guidelines mismatch percentage",
        currentValue: avgCPGMismatch,
        targetValue: 5,
        variance: avgCPGMismatch - 5,
        impact: getImpactLevel('CPG Mismatch Rate', avgCPGMismatch) as 'High' | 'Medium' | 'Low',
        rootCauses: {
          people: [
            "Unfamiliarity with current CPG recommendations",
            "Preference for personal experience over guidelines",
            "Skepticism about guideline applicability"
          ],
          process: [
            "Complex guideline access and implementation",
            "Lack of integration into clinical workflows",
            "No systematic guideline update process"
          ],
          technology: [
            "No real-time CPG integration in EMR",
            "Difficult access to current guidelines",
            "Missing clinical decision support for CPG compliance"
          ],
          policy: [
            "Outdated institutional protocols",
            "Inconsistent guideline adoption process",
            "No accountability for CPG compliance"
          ],
          environment: [
            "Time pressures limiting guideline consultation",
            "Complex patient cases requiring guideline adaptation",
            "Lack of organizational support for guideline adherence"
          ],
          measurement: [
            "No real-time CPG compliance monitoring",
            "Delayed feedback on mismatch rates",
            "Inadequate outcome tracking related to guideline adherence"
          ]
        },
        fiveWhys: [
          "Why is CPG mismatch high? - Physicians don't consistently follow clinical guidelines",
          "Why don't they follow guidelines? - Guidelines are not easily accessible during patient care",
          "Why are guidelines not accessible? - No integration into electronic health records",
          "Why is there no integration? - IT systems not designed with clinical workflow in mind",
          "Why weren't they designed properly? - Insufficient clinical input during system development"
        ],
        ...generateRootCauseAnalysis('CPG Mismatch Rate', getImpactLevel('CPG Mismatch Rate', avgCPGMismatch))
      },
      {
        kpi: "Duplicate Order Rate",
        description: "Percentage of duplicate laboratory test orders",
        currentValue: avgDuplicateRate,
        targetValue: 5,
        variance: avgDuplicateRate - 5,
        impact: getImpactLevel('Duplicate Order Rate', avgDuplicateRate) as 'High' | 'Medium' | 'Low',
        rootCauses: {
          people: [
            "Poor communication between healthcare providers",
            "Lack of awareness of recent test orders",
            "Inadequate handoff protocols during shift changes"
          ],
          process: [
            "Inefficient test result tracking systems",
            "Missing standardized communication protocols",
            "Lack of care coordination workflows"
          ],
          technology: [
            "No real-time test order visibility across departments",
            "Inadequate EMR integration and alerts",
            "Missing duplicate detection algorithms"
          ],
          policy: [
            "No clear policies on test order verification",
            "Lack of accountability for duplicate orders",
            "Missing guidelines for inter-departmental coordination"
          ],
          environment: [
            "High patient turnover and complex care teams",
            "Emergency situations requiring rapid decisions",
            "Multiple providers caring for same patient"
          ],
          measurement: [
            "No real-time duplicate order monitoring",
            "Inadequate tracking of coordination effectiveness",
            "Missing metrics on communication quality"
          ]
        },
        fiveWhys: [
          "Why are there duplicate orders? - Multiple providers order same tests without coordination",
          "Why is there lack of coordination? - Poor communication systems between departments",
          "Why are communication systems poor? - No integrated tracking of test orders",
          "Why is there no integrated tracking? - Technology systems not designed for coordination",
          "Why weren't systems designed for coordination? - Coordination needs not prioritized in system design"
        ],
        ...generateRootCauseAnalysis('Duplicate Order Rate', getImpactLevel('Duplicate Order Rate', avgDuplicateRate))
      }
    ];

    setRcaAnalyses(analyses);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-destructive text-destructive-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'Low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVarianceIcon = (variance: number) => {
    return variance < 0 ? (
      <AlertTriangle className="h-4 w-4 text-destructive" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-success" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing root causes and generating insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Root Cause Analysis (RCA) Report</h2>
            <p className="text-muted-foreground">Comprehensive analysis using 6M framework and 5 Whys methodology</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <PDFExport title="RCA Report" targetElementId="rca-report-content" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="rca-report-content" className="space-y-6">
        {/* Executive Summary */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              RCA Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rcaAnalyses.map((analysis, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{analysis.kpi}</h3>
                    <Badge className={getImpactColor(analysis.impact)}>
                      {analysis.impact} Impact
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getVarianceIcon(analysis.variance)}
                    <span>
                      Current: {analysis.currentValue.toFixed(1)} | Target: {analysis.targetValue}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">{analysis.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed RCA Analysis for each KPI */}
        {rcaAnalyses.map((analysis, index) => (
          <Card key={index} className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  {analysis.kpi} - Root Cause Analysis
                </span>
                <Badge className={getImpactColor(analysis.impact)}>
                  {analysis.impact} Impact
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              {/* 6M Framework Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">6M Framework Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysis.rootCauses).map(([category, causes]) => (
                    <div key={category} className="p-4 border rounded-lg">
                      <h4 className="font-medium capitalize mb-2 text-primary">{category}</h4>
                      <ul className="space-y-1">
                        {causes.map((cause, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 Whys Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">5 Whys Analysis</h3>
                <div className="space-y-3">
                  {analysis.fiveWhys.map((why, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="min-w-fit">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm">{why}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Root Cause */}
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-destructive">Primary Root Cause</h3>
                <p className="text-sm">{analysis.primaryRootCause}</p>
              </div>

              {/* Actionable Insights */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Actionable Insights</h3>
                <div className="grid grid-cols-1 gap-3">
                  {analysis.actionableInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-fit">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plan */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Action Plan</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Short Term */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Short Term (1 Month)
                    </h4>
                    <div className="space-y-3">
                      {analysis.actionPlan.shortTerm.map((action, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{action.action}</p>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Timeline: {action.timeline}</span>
                            <span>Owner: {action.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medium Term */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Medium Term (1-3 Months)
                    </h4>
                    <div className="space-y-3">
                      {analysis.actionPlan.mediumTerm.map((action, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{action.action}</p>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Timeline: {action.timeline}</span>
                            <span>Owner: {action.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};