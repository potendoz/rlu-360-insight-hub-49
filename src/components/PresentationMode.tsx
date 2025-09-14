import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Presentation, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Settings,
  Clock,
  BarChart3,
  Users,
  Brain,
  TrendingUp,
  Activity,
  Target,
  Heart,
  Stethoscope,
  FileText,
  Award,
  Zap,
  Shield,
  Globe
} from "lucide-react";
import { KPIChart } from "@/components/charts/KPIChart";
import { DepartmentChart } from "@/components/charts/DepartmentChart";
import { AIInsights } from "@/components/AIInsights";
import { useI18n } from "@/hooks/useI18n";

interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  bgGradient?: string;
  speakerNotes?: string;
}

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationMode = ({ isOpen, onClose }: PresentationModeProps) => {
  const { t } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [slideTimer, setSlideTimer] = useState(0);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(60000); // 1 minute per slide for academic presentation
  const [showSettings, setShowSettings] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mockKpiData = [
    { month: 'Baseline', value: 35.2, target: 10.0 },
    { month: 'Month 1', value: 28.4, target: 10.0 },
    { month: 'Month 2', value: 22.1, target: 10.0 },
    { month: 'Month 3', value: 18.7, target: 10.0 },
    { month: 'Month 4', value: 15.3, target: 10.0 },
    { month: 'Month 5', value: 12.8, target: 10.0 },
  ];

  const mockDepartmentData = [
    { department: 'Internal Medicine', savings: 52, reduction: 28 },
    { department: 'Cardiology', savings: 45, reduction: 32 },
    { department: 'Emergency', savings: 29, reduction: 18 },
    { department: 'Endocrinology', savings: 38, reduction: 25 },
  ];

  const slides: PresentationSlide[] = [
    // Slide 1: Title Slide
    {
      id: 'title',
      title: 'RLU 360 Transformation Model',
      subtitle: 'A Data-Driven System for Rational Laboratory Use',
      icon: <Activity className="h-12 w-12" />,
      bgGradient: 'from-slate-700/20 via-blue-600/10 to-background',
      speakerNotes: `
        Good morning distinguished colleagues and healthcare professionals. I am Dr. Siriporn Thanakit, presenting our groundbreaking research on the RLU 360 Transformation Model - a comprehensive data-driven system designed to optimize rational laboratory use in healthcare settings. 

        This presentation will demonstrate how our evidence-based approach at Noen Maprang Hospital has successfully addressed critical challenges in laboratory utilization while maintaining the highest standards of patient care. Our model represents a paradigm shift from reactive to proactive healthcare management, utilizing advanced analytics and behavioral science to drive sustainable improvements in clinical practice guideline adherence.

        The research spans 18 months of intensive data collection and analysis, involving 12 physicians, 4 departments, and over 2,500 patient cases. We will explore the theoretical framework, implementation methodology, and measurable outcomes that position this model as a scalable solution for healthcare institutions across Thailand and beyond.
      `,
      component: (
        <div className="text-center space-y-12 py-16">
          <div className="space-y-8">
            <div className="mx-auto w-40 h-40 bg-gradient-to-br from-blue-600/20 to-slate-600/20 rounded-full flex items-center justify-center border-4 border-blue-600/30">
              <Activity className="h-20 w-20 text-blue-600" />
            </div>
            <div className="space-y-6">
              <h1 className="text-7xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                RLU 360 Transformation Model
              </h1>
              <h2 className="text-4xl font-medium text-blue-600 leading-relaxed">
                A Data-Driven System for Rational Laboratory Use
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-slate-600 mx-auto rounded-full"></div>
            </div>
          </div>
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Noen Maprang Hospital</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Healthcare Innovation Center for Rural Communities
              </p>
            </div>
            <div className="text-lg text-slate-600 dark:text-slate-400 space-y-2">
              <p><strong>Presenter:</strong> Dr. Siriporn Thanakit, MD, PhD</p>
              <p><strong>Department:</strong> Quality Management & Clinical Excellence</p>
              <p><strong>Date:</strong> National Healthcare Innovation Conference 2024</p>
            </div>
          </div>
          <div className="absolute bottom-8 right-8 opacity-60">
            <div className="text-sm text-slate-500 dark:text-slate-400 text-right">
              <p>Academic Research Presentation</p>
              <p>Evidence-Based Healthcare Innovation</p>
            </div>
          </div>
        </div>
      )
    },

    // Slide 2: Problem Statement
    {
      id: 'problem',
      title: 'Problem Statement / Clinical Context',
      subtitle: 'Healthcare Challenges in Laboratory Utilization',
      icon: <TrendingUp className="h-8 w-8" />,
      bgGradient: 'from-red-500/20 via-red-500/10 to-background',
      speakerNotes: `
        The healthcare industry faces a critical challenge in laboratory utilization optimization. Our systematic review of literature and empirical data analysis reveals alarming patterns of inappropriate laboratory use that significantly impact both clinical outcomes and healthcare economics.

        The problem manifests in three primary dimensions: Laboratory overuse, where 25-30% of orders are inappropriate with 45% redundancy rates; CPG mismatch, showing 35% non-compliance with established guidelines; and substantial cost inefficiencies resulting in 15-20% increased healthcare expenditure.

        These challenges are not merely statistical abstractions but represent real barriers to optimal patient care. The consequences include delayed diagnoses, increased patient anxiety, healthcare provider burnout, and unsustainable resource allocation. Our research demonstrates that without systematic intervention, these patterns perpetuate and worsen over time, creating a cascade of negative outcomes throughout the healthcare ecosystem.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Problem Statement</h2>
            <h3 className="text-3xl font-medium text-red-600 mb-6">Clinical Context & Healthcare Challenges</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Suboptimal laboratory utilization and non-adherence to Clinical Practice Guidelines (CPG) 
              significantly impact healthcare quality, patient outcomes, and healthcare system sustainability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 dark:border-red-800/30">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">Laboratory Overuse</h3>
                <div className="space-y-3 text-lg text-slate-700 dark:text-slate-300">
                  <p><strong>25-30%</strong> inappropriate lab orders</p>
                  <p><strong>45%</strong> redundant testing</p>
                  <p><strong>60%</strong> lack of evidence-based protocols</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 dark:border-orange-800/30">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">CPG Mismatch</h3>
                <div className="space-y-3 text-lg text-slate-700 dark:text-slate-300">
                  <p><strong>35%</strong> non-compliance rate</p>
                  <p><strong>50%</strong> clinical variation</p>
                  <p><strong>40%</strong> delayed diagnosis</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 dark:border-blue-800/30">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Cost & Efficiency</h3>
                <div className="space-y-3 text-lg text-slate-700 dark:text-slate-300">
                  <p><strong>15-20%</strong> increased costs</p>
                  <p><strong>30%</strong> resource waste</p>
                  <p><strong>25%</strong> staff burden increase</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">Critical Gap Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Current State Issues:</h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <span>Lack of real-time monitoring systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <span>Inconsistent CPG implementation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <span>Limited feedback mechanisms</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Urgency Factors:</h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                    <span>Rising healthcare costs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                    <span>Quality assurance demands</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                    <span>Patient safety concerns</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 3: Key Insights from Local Data
    {
      id: 'insights',
      title: 'Key Insights from Local Data',
      subtitle: 'Evidence-Based Findings from Noen Maprang Hospital',
      icon: <Brain className="h-8 w-8" />,
      bgGradient: 'from-blue-500/20 via-blue-500/10 to-background',
      speakerNotes: `
        Our comprehensive data analysis at Noen Maprang Hospital reveals critical insights into physician behavior patterns and laboratory utilization practices. This empirical foundation forms the cornerstone of our intervention design.

        Key findings include a 68% mismatch rate between ICD-10 diagnostic codes and corresponding laboratory orders, indicating significant gaps in evidence-based decision-making. Among 12 active physicians studied, performance varies dramatically: 3 high performers achieve 85-92% CPG compliance, while 3 physicians require immediate intervention with compliance rates below 65%.

        The economic impact is substantial - we identified 2.4 million Thai Baht in annual waste from inappropriate laboratory utilization, with an average 2.3-day delay in appropriate treatment initiation. Perhaps most concerning is our finding that 75% of physicians lack structured training in evidence-based laboratory utilization, highlighting a critical educational gap that our model addresses systematically.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Key Insights from Local Data</h2>
            <h3 className="text-3xl font-medium text-blue-600 mb-6">Real-Life Behavior Patterns from Noen Maprang Hospital</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Comprehensive analysis of diagnostic-laboratory code inconsistencies and physician behavior patterns 
              revealing critical opportunities for systematic improvement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-6 text-center">Diagnostic Patterns</h3>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">68%</div>
                  <p className="text-slate-600 dark:text-slate-400">ICD-10 to Lab Code Mismatch</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">142</div>
                    <p className="text-sm text-slate-500">Diagnostic Codes</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">89</div>
                    <p className="text-sm text-slate-500">Lab Procedures</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Appropriate Orders:</span>
                    <span className="font-semibold text-green-600">32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Over-ordering:</span>
                    <span className="font-semibold text-red-600">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Under-ordering:</span>
                    <span className="font-semibold text-orange-600">23%</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Physician Behavior</h3>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">12</div>
                  <p className="text-slate-600 dark:text-slate-400">Active Physicians Analyzed</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">High Performers (3 physicians)</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">CPG Compliance: 85-92%</p>
                  </div>
                  <div className="bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Moderate Performers (6 physicians)</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">CPG Compliance: 65-84%</p>
                  </div>
                  <div className="bg-red-50/50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Improvement Needed (3 physicians)</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">CPG Compliance: 45-64%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">Critical Findings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">Resource Waste</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Estimated 2.4M THB annual waste from inappropriate lab utilization</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">Delayed Care</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Average 2.3 days delay in appropriate treatment initiation</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">Training Gap</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">75% of physicians lack structured CPG training in lab utilization</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 4: Conceptual Framework
    {
      id: 'framework',
      title: 'Conceptual Framework',
      subtitle: 'RLU 360 Model Logic & Theoretical Foundation',
      icon: <Target className="h-8 w-8" />,
      bgGradient: 'from-purple-500/20 via-purple-500/10 to-background',
      speakerNotes: `
        The RLU 360 Transformation Model is grounded in established behavioral science theories and systems thinking principles. Our framework integrates four core theoretical foundations: Behavioral Economics, recognizing that physician decision-making is influenced by cognitive biases and environmental factors; Systems Theory, acknowledging that healthcare operates as a complex adaptive system; Social Cognitive Theory, emphasizing the role of observational learning and self-efficacy; and Implementation Science, focusing on evidence-based strategies for sustainable change.

        The model operates on the principle that sustainable behavior change requires simultaneous intervention at multiple levels: individual physician behavior, organizational systems, and cultural norms. Our 360-degree approach ensures comprehensive coverage of all factors influencing laboratory utilization decisions, creating a synergistic effect that amplifies individual interventions.

        The theoretical underpinning emphasizes four key mechanisms: Behavior modification through real-time feedback and peer comparison; System optimization through workflow integration and decision support; Motivation enhancement through gamification and recognition; and Outcome measurement through continuous monitoring and adaptive improvement.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Conceptual Framework</h2>
            <h3 className="text-3xl font-medium text-purple-600 mb-6">RLU 360 Model Logic & Theoretical Foundation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              A comprehensive theoretical framework integrating behavioral science, systems thinking, 
              and implementation science to drive sustainable healthcare transformation.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-blue-100/20 rounded-3xl"></div>
            <div className="relative p-12">
              <div className="text-center mb-12">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-purple-600/30">
                  <Target className="h-16 w-16 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">RLU 360° Model</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400">Comprehensive Healthcare Transformation</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">Behavioral Mechanism</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cognitive bias mitigation, decision support, peer learning</p>
                </Card>
                
                <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">System Design</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Workflow integration, real-time monitoring, automated alerts</p>
                </Card>
                
                <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">Engagement & Motivation</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Gamification, recognition, continuous feedback</p>
                </Card>
                
                <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3">Evaluation & Impact</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Continuous measurement, adaptive improvement</p>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Theoretical Foundations</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Behavioral Economics</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Cognitive bias recognition and mitigation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Systems Theory</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Complex adaptive system optimization</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Social Cognitive Theory</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Observational learning and self-efficacy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Implementation Science</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Evidence-based change strategies</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <h3 className="text-2xl font-bold text-primary mb-6">Core Principles</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Multi-level Intervention</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Individual, organizational, and cultural change</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Real-time Feedback</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Immediate performance insights and guidance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Continuous Adaptation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Dynamic system learning and improvement</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Evidence-based Design</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Data-driven decision making and validation</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },

    // Slide 5: Study Site
    {
      id: 'study-site',
      title: 'Study Site: Noen Maprang Hospital',
      subtitle: 'Role Model for Healthcare Transformation',
      icon: <Heart className="h-8 w-8" />,
      bgGradient: 'from-green-500/20 via-green-500/10 to-background',
      speakerNotes: `
        Noen Maprang Hospital was strategically selected as our implementation site due to its unique characteristics that make it an ideal testbed for healthcare transformation initiatives. As a 120-bed community hospital serving a rural population of 85,000, it represents the backbone of Thailand's healthcare system - community hospitals that provide essential care to underserved populations.

        The hospital's leadership demonstrated exceptional commitment to quality improvement, with Dr. Prasert Wongchai, the Medical Director, championing evidence-based practice initiatives. The institution's existing quality management infrastructure, including ISO 9001:2015 certification and active participation in national quality improvement programs, provided a solid foundation for our intervention.

        Key selection criteria included: manageable scale for comprehensive monitoring (12 physicians, 4 departments), diverse case mix representative of rural healthcare challenges, existing electronic health record system enabling data collection, and strong leadership support for innovation. The hospital's limitations - limited resources, staff constraints, and technology gaps - actually strengthened our model by forcing us to develop cost-effective, scalable solutions applicable to similar institutions nationwide.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Study Site: Noen Maprang Hospital</h2>
            <h3 className="text-3xl font-medium text-green-600 mb-6">Role Model for Healthcare Transformation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Strategic selection of an ideal implementation site representing Thailand's community hospital network 
              with unique characteristics enabling comprehensive transformation research.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">Hospital Profile</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>120</strong> beds</p>
                <p><strong>85,000</strong> population served</p>
                <p><strong>Community</strong> hospital level</p>
                <p><strong>Rural</strong> healthcare setting</p>
              </div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">Medical Staff</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>12</strong> physicians</p>
                <p><strong>4</strong> departments</p>
                <p><strong>45</strong> nurses</p>
                <p><strong>8</strong> lab technicians</p>
              </div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4">Quality Standards</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>ISO 9001:2015</strong> certified</p>
                <p><strong>HA</strong> accredited</p>
                <p><strong>National QI</strong> participant</p>
                <p><strong>EHR</strong> system active</p>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6">Why Noen Maprang?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Representative Scale</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Manageable size for comprehensive monitoring and analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Leadership Commitment</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Strong support for innovation and quality improvement</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Existing Infrastructure</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">EHR system and quality management processes in place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Diverse Case Mix</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Representative of rural healthcare challenges and opportunities</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-6">Transformation Potential</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Resource Optimization</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Limited resources driving innovative, cost-effective solutions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Scalability Testing</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Model validation for nationwide implementation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Cultural Adaptation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Rural healthcare culture and practice patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Impact Measurement</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Clear baseline and outcome measurement capabilities</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">Hospital Leadership Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Dr. Prasert Wongchai</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Medical Director & Project Champion</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Ms. Siriwan Thepsiri</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quality Management Director</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Mr. Somchai Rattana</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">IT & Data Analytics Manager</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 6: 4D Cluster Model
    {
      id: '4d-model',
      title: '4D Cluster Model: Core Components',
      subtitle: 'Comprehensive Framework for Healthcare Transformation',
      icon: <Shield className="h-8 w-8" />,
      bgGradient: 'from-indigo-500/20 via-indigo-500/10 to-background',
      speakerNotes: `
        The 4D Cluster Model represents the operational heart of our RLU 360 Transformation system. Each dimension addresses critical aspects of healthcare behavior change, working synergistically to create sustainable improvements in laboratory utilization practices.

        The Behavioral Mechanism dimension focuses on understanding and modifying physician decision-making processes through cognitive bias recognition, peer learning facilitation, and evidence-based decision support. Our research identified 12 key cognitive biases affecting laboratory ordering decisions, including anchoring bias, availability heuristic, and confirmation bias.

        System Design encompasses the technological and workflow infrastructure necessary for seamless integration into existing hospital operations. This includes real-time monitoring dashboards, automated alert systems, and workflow optimization tools that reduce friction while enhancing decision quality.

        Engagement & Motivation leverages gamification principles, peer recognition systems, and continuous feedback mechanisms to maintain physician participation and enthusiasm. Our approach recognizes that sustainable change requires intrinsic motivation, not just external compliance.

        Evaluation & Impact provides the measurement framework for continuous improvement, utilizing both quantitative metrics and qualitative feedback to adapt and optimize the system over time.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">4D Cluster Model</h2>
            <h3 className="text-3xl font-medium text-indigo-600 mb-6">Core Components for Healthcare Transformation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Four interconnected dimensions working synergistically to create sustainable improvements 
              in laboratory utilization and clinical practice guideline adherence.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-purple-100/20 rounded-3xl"></div>
            <div className="relative p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">1. Behavioral Mechanism</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Cognitive Bias Mitigation</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Recognition and correction of 12 key decision-making biases</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Peer Learning Networks</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Collaborative knowledge sharing and best practice dissemination</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Decision Support Systems</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Evidence-based recommendations at point of care</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">2. System Design</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Real-time Monitoring</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Continuous tracking of laboratory utilization patterns</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Workflow Integration</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Seamless embedding into existing clinical workflows</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Automated Alerts</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Intelligent notifications for CPG deviations</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-10 w-10 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">3. Engagement & Motivation</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Gamification Elements</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Achievement badges, leaderboards, and progress tracking</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Recognition Systems</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Peer acknowledgment and institutional awards</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Continuous Feedback</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Real-time performance insights and improvement suggestions</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">4. Evaluation & Impact</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Continuous Measurement</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive KPI tracking and trend analysis</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Adaptive Improvement</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Dynamic system optimization based on outcomes</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Impact Assessment</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Quantitative and qualitative outcome evaluation</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">Synergistic Integration</h3>
            <div className="text-center mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-4xl mx-auto">
                The four dimensions work together to create a comprehensive transformation ecosystem, 
                where each component amplifies the effectiveness of the others.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">85%</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Behavioral Change Success Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-2">92%</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">System Integration Efficiency</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 mb-2">78%</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Physician Engagement Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-2">94%</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Outcome Measurement Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 7: Innovation Tools & Methodology
    {
      id: 'methodology',
      title: 'Innovation Tools & Methodology',
      subtitle: 'Technology-Enabled Healthcare Transformation',
      icon: <Globe className="h-8 w-8" />,
      bgGradient: 'from-cyan-500/20 via-cyan-500/10 to-background',
      speakerNotes: `
        Our methodology leverages cutting-edge technology solutions while maintaining cost-effectiveness and scalability for resource-constrained healthcare environments. The technology stack was deliberately chosen to balance sophistication with accessibility, ensuring that our model can be replicated across diverse healthcare settings.

        The data collection framework captures over 150 variables per patient encounter, including diagnostic codes, laboratory orders, timing patterns, physician characteristics, and patient outcomes. This comprehensive dataset enables sophisticated analysis while maintaining patient privacy through advanced anonymization techniques.

        Our dashboard solution, built on Google Sheets and Apps Script, represents an innovative approach to healthcare analytics. While enterprise solutions exist, our choice of widely accessible tools ensures that any hospital can implement and maintain the system without significant IT infrastructure investment. The dashboard provides real-time visualization of CPG compliance, cost analysis, and individual physician performance metrics.

        The feedback loop mechanism is perhaps our most critical innovation - creating a closed-loop system where data analysis directly informs clinical decision-making, which in turn generates new data for continuous system improvement. This creates a self-reinforcing cycle of improvement that becomes more effective over time.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Innovation Tools & Methodology</h2>
            <h3 className="text-3xl font-medium text-cyan-600 mb-6">Technology-Enabled Healthcare Transformation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Comprehensive technology framework combining advanced analytics with accessible tools 
              to enable sustainable healthcare improvement in resource-constrained environments.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 text-center bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 border-cyan-200 dark:border-cyan-800/30">
              <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-10 w-10 text-cyan-600" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-4">Data Collection</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>150+</strong> variables per encounter</p>
                <p><strong>Real-time</strong> data capture</p>
                <p><strong>Privacy-protected</strong> analytics</p>
                <p><strong>Multi-source</strong> integration</p>
              </div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">Dashboard Platform</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Google Sheets</strong> foundation</p>
                <p><strong>Apps Script</strong> automation</p>
                <p><strong>Real-time</strong> visualization</p>
                <p><strong>Cost-effective</strong> solution</p>
              </div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4">Feedback Loop</h3>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Closed-loop</strong> system</p>
                <p><strong>Root Cause</strong> analysis</p>
                <p><strong>Continuous</strong> improvement</p>
                <p><strong>Self-reinforcing</strong> cycle</p>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Technology Stack</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Data Layer</h4>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Hospital Information System (HIS)</span>
                      <span className="text-green-600">✓ Integrated</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Laboratory Information System (LIS)</span>
                      <span className="text-green-600">✓ Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electronic Health Records (EHR)</span>
                      <span className="text-green-600">✓ Synchronized</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Analytics Layer</h4>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Google Apps Script</span>
                      <span className="text-blue-600">Processing</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statistical Analysis</span>
                      <span className="text-blue-600">R Integration</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Machine Learning</span>
                      <span className="text-blue-600">Python Models</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Presentation Layer</h4>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Google Sheets Dashboard</span>
                      <span className="text-purple-600">Interactive</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile Responsive</span>
                      <span className="text-purple-600">Accessible</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real-time Updates</span>
                      <span className="text-purple-600">Live Data</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <h3 className="text-2xl font-bold text-primary mb-6">Implementation Methodology</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Data Integration</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Establish secure connections to existing hospital systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Dashboard Development</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Create customized analytics and visualization tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Workflow Integration</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Embed tools into existing clinical workflows</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Training & Support</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive staff education and ongoing assistance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">5</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Continuous Monitoring</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Ongoing performance tracking and system optimization</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-2xl p-10 border border-cyan-200 dark:border-cyan-800/30">
            <h3 className="text-3xl font-bold text-center text-cyan-800 dark:text-cyan-200 mb-8">Root Cause Analysis Framework</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-cyan-600">Why</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Identify</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">CPG deviation patterns and frequency</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-cyan-600">What</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Analyze</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Contributing factors and root causes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-cyan-600">How</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Intervene</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Targeted improvement strategies</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-cyan-600">Track</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Monitor</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Outcome measurement and adjustment</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 8: 9-Step Key Action Process
    {
      id: '9-step-process',
      title: '9-Step Key Action Process',
      subtitle: 'Systematic Methodology for Behavior Transformation',
      icon: <FileText className="h-8 w-8" />,
      bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-background',
      speakerNotes: `
        The 9-Step Key Action Process represents the operational blueprint for implementing sustainable behavior change in healthcare settings. This methodology was developed through iterative testing and refinement over 18 months, incorporating feedback from physicians, administrators, and quality improvement specialists.

        Each step is designed to build upon the previous one, creating a comprehensive transformation pathway that addresses both individual and systemic factors. The process begins with comprehensive baseline assessment, establishing clear metrics and understanding current state challenges. Data collection and analysis phases utilize our advanced analytics platform to identify patterns and opportunities.

        The feedback and engagement phases are critical for physician buy-in and sustained participation. Our research demonstrates that physicians respond most positively to peer-based feedback rather than administrative directives. The intervention design phase customizes solutions to specific physician needs and practice patterns.

        Implementation and monitoring phases ensure that changes are effectively integrated into daily practice, while evaluation and scaling phases prepare for broader organizational adoption. The final step, continuous improvement, establishes the foundation for long-term sustainability and adaptation to changing healthcare environments.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">9-Step Key Action Process</h2>
            <h3 className="text-3xl font-medium text-emerald-600 mb-6">Systematic Methodology for Behavior Transformation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Comprehensive step-by-step methodology for implementing sustainable healthcare behavior change, 
              from initial assessment through continuous improvement and scaling.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Steps 1-3 */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">Baseline Assessment</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive evaluation of current CPG compliance, laboratory utilization patterns, and physician behavior baselines.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">Data Collection</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Systematic gathering of clinical, administrative, and behavioral data using automated collection systems.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-2">Pattern Analysis</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Advanced analytics to identify trends, outliers, and opportunities for improvement using AI-powered insights.</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Steps 4-6 */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-2">Feedback Design</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Creation of personalized, actionable feedback reports tailored to individual physician practice patterns.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 border-cyan-200 dark:border-cyan-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-700 dark:text-cyan-400 mb-2">Physician Engagement</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Structured engagement sessions, peer discussions, and collaborative improvement planning.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">6</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Intervention Design</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Development of targeted interventions based on root cause analysis and physician-specific needs.</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Steps 7-9 */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-200 dark:border-indigo-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">7</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Implementation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Systematic rollout of interventions with continuous support and real-time monitoring.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10 border-teal-200 dark:border-teal-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">8</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-2">Outcome Evaluation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive assessment of intervention effectiveness and impact measurement.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">9</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Continuous Improvement</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Ongoing refinement, scaling preparation, and sustainable practice integration.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">Process Flow & Timeline</h3>
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600"></div>
              <div className="grid grid-cols-3 gap-8 relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Assessment Phase</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Steps 1-3: Data collection and analysis</p>
                  <div className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded mt-2">
                    Weeks 1-4
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Engagement Phase</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Steps 4-6: Feedback and intervention design</p>
                  <div className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded mt-2">
                    Weeks 5-8
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Implementation Phase</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Steps 7-9: Execution and continuous improvement</p>
                  <div className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded mt-2">
                    Weeks 9-24
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <h3 className="text-2xl font-bold text-primary mb-6">Success Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Process Completion Rate</span>
                  <span className="font-bold text-primary">94%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Physician Engagement</span>
                  <span className="font-bold text-primary">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Intervention Effectiveness</span>
                  <span className="font-bold text-primary">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Sustainability Rate</span>
                  <span className="font-bold text-primary">82%</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/30">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6">Key Learnings</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Physician engagement is critical in steps 4-6</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Real-time feedback accelerates behavior change</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Continuous improvement ensures sustainability</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Leadership support is essential for success</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },

    // Slide 9: KPI and Evaluation Metrics
    {
      id: 'kpi-metrics',
      title: 'KPI and Evaluation Metrics',
      subtitle: 'Comprehensive Performance Measurement Framework',
      icon: <BarChart3 className="h-8 w-8" />,
      bgGradient: 'from-blue-500/20 via-blue-500/10 to-background',
      speakerNotes: `
        Our comprehensive KPI framework encompasses four critical dimensions of healthcare performance: clinical quality, operational efficiency, financial impact, and physician engagement. This multi-dimensional approach ensures that improvements in laboratory utilization do not come at the expense of other important healthcare outcomes.

        The primary metric, CPG Mismatch Rate, has shown remarkable improvement from a baseline of 35.2% to the current level of 12.8%, representing a 64% reduction in inappropriate laboratory utilization. This improvement translates directly to enhanced patient care quality and reduced healthcare costs.

        Laboratory overuse rate measurement captures both over-ordering and under-ordering patterns, providing a balanced view of physician behavior. Our data shows that while over-ordering decreased by 45%, under-ordering also decreased by 23%, indicating improved overall clinical decision-making rather than simple cost-cutting.

        Physician engagement metrics are particularly important for sustainability. Our feedback rate of 89% and active participation rate of 87% demonstrate strong physician buy-in, which is essential for long-term success. The doctor engagement score, measured through surveys and behavioral analytics, shows consistent improvement over the implementation period.
      `,
      component: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">ตัวชี้วัดความสำเร็จของโครงการ</h2>
            <p className="text-lg text-muted-foreground">ผลลัพธ์จากการใช้ระบบ RLU 360 ในการปรับปรุงการปฏิบัติตาม CPG</p>
          </div>
          <div className="grid grid-cols-4 gap-6 mb-12">
            <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <div className="text-4xl font-bold text-primary mb-2">12.8%</div>
              <div className="text-sm text-muted-foreground">CPG Mismatch ปัจจุบัน</div>
              <div className="text-xs text-primary mt-1">เป้าหมาย &lt; 10%</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/30">
              <div className="text-4xl font-bold text-green-600 mb-2">-64%</div>
              <div className="text-sm text-muted-foreground">การปรับปรุงจากเริ่มต้น</div>
              <div className="text-xs text-green-600 mt-1">ลดลงอย่างต่อเนื่อง</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/30">
              <div className="text-4xl font-bold text-orange-600 mb-2">2.4M</div>
              <div className="text-sm text-muted-foreground">ประหยัดต้นทุน (บาท)</div>
              <div className="text-xs text-orange-600 mt-1">ต่อปี</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/30">
              <div className="text-4xl font-bold text-purple-600 mb-2">87%</div>
              <div className="text-sm text-muted-foreground">การมีส่วนร่วมของแพทย์</div>
              <div className="text-xs text-purple-600 mt-1">เป้าหมาย 90%</div>
            </Card>
          </div>
          <KPIChart 
            title="แนวโน้มการปรับปรุง CPG Mismatch (%)" 
            data={mockKpiData}
            color="hsl(var(--primary))"
            formatValue={(v) => `${v}%`}
          />
          <div className="grid grid-cols-3 gap-6 mt-8">
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-green-600">ความสำเร็จ</h3>
              <p className="text-2xl font-bold">75%</p>
              <p className="text-sm text-muted-foreground">แผนกที่ลด Mismatch &gt; 50%</p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-blue-600">กำลังปรับปรุง</h3>
              <p className="text-2xl font-bold">20%</p>
              <p className="text-sm text-muted-foreground">แผนกที่ลด Mismatch 25-50%</p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2 text-orange-600">ต้องพัฒนา</h3>
              <p className="text-2xl font-bold">5%</p>
              <p className="text-sm text-muted-foreground">แผนกที่ลด Mismatch &lt; 25%</p>
            </Card>
          </div>
        </div>
      )
    },

    // Slide 10: Outcomes & Impact
    {
      id: 'outcomes',
      title: 'Outcomes & Impact',
      subtitle: 'Measurable Results and Healthcare Transformation',
      icon: <TrendingUp className="h-8 w-8" />,
      bgGradient: 'from-green-500/20 via-green-500/10 to-background',
      speakerNotes: `
        The outcomes of our RLU 360 Transformation Model demonstrate significant and sustained improvements across all measured dimensions. The before-after comparison reveals not just statistical improvements, but meaningful changes in healthcare delivery quality and efficiency.

        Clinical outcomes show a 64% reduction in CPG mismatch rates, translating to more appropriate patient care and improved clinical decision-making. Laboratory overuse decreased by 45%, while under-ordering decreased by 23%, indicating balanced improvement rather than simple cost reduction.

        Financial impact is substantial, with estimated annual savings of 2.4 million Thai Baht from reduced inappropriate laboratory utilization. This represents approximately 15% of the hospital's annual laboratory budget, funds that can be redirected to other critical healthcare needs.

        Perhaps most importantly, physician satisfaction and engagement have increased significantly. Our surveys show 78% of physicians report feeling more confident in their laboratory ordering decisions, and 82% express satisfaction with the feedback and support provided by the system. This positive reception is crucial for long-term sustainability and potential scaling to other institutions.

        The behavior change visualization demonstrates clear patterns of improvement, with most physicians showing consistent progress over the implementation period. The few outliers have been identified for additional support and targeted interventions.
      `,
      component: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">การเปรียบเทียบประสิทธิภาพแผนก</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              การวิเคราะห์ประสิทธิภาพของแต่ละแผนกในการปฏิบัติตาม Clinical Practice Guidelines และการประหยัดต้นทุน
            </p>
          </div>
          <DepartmentChart data={mockDepartmentData} />
          <div className="grid grid-cols-2 gap-8 mt-12">
            <Card className="p-8 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/30">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Top Performers
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <span className="font-semibold">Internal Medicine</span>
                    <div className="text-sm text-muted-foreground">อายุรกรรม</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600 text-lg">52%</span>
                    <div className="text-sm text-muted-foreground">ประหยัด</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <span className="font-semibold">Cardiology</span>
                    <div className="text-sm text-muted-foreground">หัวใจ</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600 text-lg">45%</span>
                    <div className="text-sm text-muted-foreground">ประหยัด</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <span className="font-semibold">Endocrinology</span>
                    <div className="text-sm text-muted-foreground">ต่อมไร้ท่อ</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 text-lg">38%</span>
                    <div className="text-sm text-muted-foreground">ประหยัด</div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/30">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Activity className="h-6 w-6 text-orange-600" />
                Improvement Areas
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div>
                    <span className="font-semibold">Emergency</span>
                    <div className="text-sm text-muted-foreground">ฉุกเฉิน</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-orange-600">ต้องพัฒนา</span>
                    <div className="text-sm text-muted-foreground">29% ประหยัด</div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">แผนการปรับปรุง</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• อบรมเพิ่มเติมเรื่อง CPG</li>
                    <li>• ระบบแจ้งเตือนแบบเรียลไทม์</li>
                    <li>• การติดตามผลอย่างใกล้ชิด</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          <div className="bg-primary/5 rounded-xl p-8 border border-primary/20">
            <h3 className="text-xl font-bold text-center mb-6 text-primary">Overall Impact</h3>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">↑64%</div>
                <div className="text-sm text-muted-foreground">CPG Compliance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">↓45%</div>
                <div className="text-sm text-muted-foreground">Lab Overuse</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">↑78%</div>
                <div className="text-sm text-muted-foreground">Physician Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">2.4M</div>
                <div className="text-sm text-muted-foreground">THB Savings</div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 11: Key Success Factors
    {
      id: 'success-factors',
      title: 'Key Success Factors',
      subtitle: 'Critical Elements for Sustainable Healthcare Transformation',
      icon: <Award className="h-8 w-8" />,
      bgGradient: 'from-yellow-500/20 via-yellow-500/10 to-background',
      speakerNotes: `
        Through our comprehensive analysis of the RLU 360 implementation, we have identified four critical success factors that determine the effectiveness and sustainability of healthcare transformation initiatives. These factors emerged from both quantitative analysis of our outcomes and qualitative feedback from stakeholders.

        Leadership commitment proved to be the most crucial factor, with strong correlation between leadership engagement and implementation success. Hospitals with active leadership participation showed 73% better outcomes compared to those with passive support. This includes not just administrative support, but active participation in feedback sessions and visible commitment to change.

        Team engagement encompasses both physician participation and broader healthcare team involvement. Our data shows that departments with high engagement rates (>80%) achieved 2.3 times better CPG compliance improvements compared to low-engagement departments. The key is creating a culture of collaborative improvement rather than top-down mandates.

        Technology adoption success depends not just on system functionality, but on user experience and workflow integration. Our Google Sheets-based approach succeeded because it leveraged familiar tools while providing sophisticated analytics. The 94% user adoption rate demonstrates the importance of balancing capability with usability.

        Feedback culture development is perhaps the most challenging but essential factor. Creating an environment where performance feedback is viewed as supportive rather than punitive requires careful change management and consistent messaging from leadership.
      `,
      component: (
        <div className="space-y-12 py-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-slate-100">Key Success Factors</h2>
            <h3 className="text-3xl font-medium text-yellow-600 mb-6">Critical Elements for Sustainable Healthcare Transformation</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              Four fundamental factors that determine the effectiveness and long-term sustainability 
              of healthcare transformation initiatives, derived from comprehensive implementation analysis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Leadership Commitment</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Active Participation</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Leaders actively engage in feedback sessions and improvement planning</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Resource Allocation</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Adequate time, staff, and financial resources dedicated to transformation</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Visible Support</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Consistent messaging and public commitment to change initiatives</p>
                </div>
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">73%</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Better outcomes with active leadership</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800/30">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Team Engagement</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Collaborative Culture</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Fostering teamwork and shared responsibility for improvement</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Physician Buy-in</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active participation in feedback sessions and improvement planning</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Continuous Learning</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ongoing education and skill development opportunities</p>
                </div>
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">2.3x</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Better results with high engagement</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">Technology Adoption</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">User-Friendly Design</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Intuitive interfaces that integrate seamlessly with existing workflows</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Reliable Performance</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Consistent system availability and accurate data processing</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Comprehensive Training</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Thorough education and ongoing technical support</p>
                </div>
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">User adoption rate achieved</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">Feedback Culture</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Supportive Environment</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Performance feedback viewed as developmental rather than punitive</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Regular Communication</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Consistent, timely feedback and recognition of improvements</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Peer Learning</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Opportunities for knowledge sharing and collaborative problem-solving</p>
                </div>
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">89%</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Positive feedback reception rate</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-10 border border-slate-200 dark:border-slate-600">
            <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">Success Factor Integration</h3>
            <div className="text-center mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-4xl mx-auto">
                These four factors work synergistically - success requires strength in all areas, 
                as weakness in any single factor can undermine the entire transformation effort.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Leadership</h4>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">92% effectiveness</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Team</h4>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '87%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">87% engagement</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Technology</h4>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">94% adoption</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Feedback</h4>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{width: '89%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">89% positive</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 12: Conclusion & Q&A
    {
      id: 'conclusion',
      title: 'Conclusion & Q&A',
      subtitle: 'RLU 360 Transformation - A Scalable Model for Healthcare Excellence',
      icon: <Award className="h-8 w-8" />,
      bgGradient: 'from-gradient-start to-gradient-end',
      speakerNotes: `
        In conclusion, the RLU 360 Transformation Model represents a significant advancement in healthcare quality improvement methodology. Our comprehensive approach, combining behavioral science, advanced analytics, and systematic implementation, has demonstrated measurable and sustainable improvements in clinical practice guideline adherence.

        The key achievements include a 64% reduction in CPG mismatch rates, 2.4 million Thai Baht in annual cost savings, and 87% physician engagement rate. These results validate our theoretical framework and implementation methodology, positioning the model for broader adoption across Thailand's healthcare system.

        The scalability of our approach is evidenced by our choice of accessible technology platforms and systematic implementation methodology. The Google Sheets-based dashboard and 9-step implementation process can be replicated in resource-constrained environments, making this solution applicable to the majority of Thailand's community hospitals.

        Future research directions include expanding to additional clinical domains beyond laboratory utilization, developing AI-powered predictive models for proactive intervention, and conducting multi-site implementation studies to validate scalability assumptions.

        I welcome your questions and look forward to discussing potential collaborations for implementing the RLU 360 model in your institutions. Together, we can transform healthcare delivery through evidence-based, data-driven approaches that prioritize both quality and sustainability.
      `,
      component: (
        <div className="space-y-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              RLU 360 Transformation Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              A Scalable Model for Healthcare Excellence Through Evidence-Based Innovation
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Key Achievements</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">64% Reduction in CPG Mismatch</h4>
                    <p className="text-muted-foreground">Significant improvement in clinical practice guideline adherence, enhancing patient care quality and safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">2.4M THB Annual Cost Savings</h4>
                    <p className="text-muted-foreground">Substantial financial impact through optimized resource utilization and reduced inappropriate testing.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">87% Physician Engagement Rate</h4>
                    <p className="text-muted-foreground">High level of healthcare provider participation ensuring sustainable transformation.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Future Directions</h3>
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
                  <h4 className="font-semibold mb-3 text-lg">1. Multi-Domain Expansion</h4>
                  <p className="text-muted-foreground mb-3">Extend methodology to medication management, diagnostic imaging, and treatment protocols.</p>
                  <div className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                    Q2 2024
                  </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/30">
                  <h4 className="font-semibold mb-3 text-lg">2. AI-Powered Predictive Models</h4>
                  <p className="text-muted-foreground mb-3">Develop machine learning algorithms for proactive intervention and risk prediction.</p>
                  <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded-full inline-block">
                    Q3 2024
                  </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/30">
                  <h4 className="font-semibold mb-3 text-lg">3. National Implementation Study</h4>
                  <p className="text-muted-foreground mb-3">Multi-site validation across diverse healthcare settings throughout Thailand.</p>
                  <div className="text-sm text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full inline-block">
                    2025
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold text-center mb-8 text-primary">Research Impact Summary</h3>
            <div className="grid grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-green-600">64%</div>
                <div className="text-sm text-muted-foreground">CPG Mismatch Reduction</div>
                <div className="text-xs text-green-600">Baseline: 35.2% → Current: 12.8%</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-blue-600">2.4M</div>
                <div className="text-sm text-muted-foreground">THB Annual Savings</div>
                <div className="text-xs text-blue-600">15% of lab budget</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-purple-600">87%</div>
                <div className="text-sm text-muted-foreground">Physician Engagement</div>
                <div className="text-xs text-purple-600">Sustained participation</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-orange-600">12</div>
                <div className="text-sm text-muted-foreground">Months Implementation</div>
                <div className="text-xs text-orange-600">Rapid deployment</div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-primary/20">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-primary">Questions & Discussion</h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Thank you for your attention. I welcome your questions about the RLU 360 Transformation Model 
                and look forward to discussing potential collaborations for implementing evidence-based healthcare 
                improvements in your institutions.
              </p>
              <div className="flex justify-center items-center gap-6 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                  <div className="font-semibold text-lg">Dr. Siriporn Thanakit</div>
                  <div className="text-muted-foreground">siriporn.t@noenmaprng.go.th</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <div className="font-semibold text-lg">RLU 360 Project</div>
                  <div className="text-muted-foreground">www.rlu360.healthcare.th</div>
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
                <h4 className="font-semibold mb-3">Contact for Collaboration:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Implementation support and training</p>
                  <p>• Technology transfer and customization</p>
                  <p>• Research collaboration opportunities</p>
                  <p>• Multi-site validation studies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlay && isOpen) {
      interval = setInterval(() => {
        setSlideTimer((prev) => {
          if (prev >= 100) {
            setCurrentSlide((current) => 
              current < slides.length - 1 ? current + 1 : current
            );
            return 0;
          }
          return prev + (100 / (autoPlaySpeed / 100));
        });
      }, 100);
    } else {
      setSlideTimer(0);
    }
    return () => clearInterval(interval);
  }, [isAutoPlay, isOpen, autoPlaySpeed, slides.length]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(currentSlide + 1);
          setSlideTimer(0);
        }
        break;
      case 'ArrowLeft':
        if (currentSlide > 0) {
          setCurrentSlide(currentSlide - 1);
          setSlideTimer(0);
        }
        break;
      case 'Escape':
        onClose();
        break;
      case 'f':
      case 'F':
        toggleFullScreen();
        break;
      case 'p':
      case 'P':
        setIsAutoPlay(!isAutoPlay);
        break;
      case 'r':
      case 'R':
        setCurrentSlide(0);
        setSlideTimer(0);
        break;
      case 'n':
      case 'N':
        setShowSpeakerNotes(!showSpeakerNotes);
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, currentSlide, isAutoPlay, showSpeakerNotes]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-white dark:bg-slate-900 ${isFullScreen ? 'p-0' : 'p-4'}`}
    >
      <div className="h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentSlideData.icon}
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentSlideData.title}
                </h3>
                {currentSlideData.subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentSlideData.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className="text-slate-600 dark:text-slate-400"
            >
              <FileText className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="text-slate-600 dark:text-slate-400"
            >
              {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="text-slate-600 dark:text-slate-400"
            >
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-600 dark:text-slate-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isAutoPlay && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <Progress value={slideTimer} className="h-1" />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Slide Content */}
          <div className={`${showSpeakerNotes ? 'w-2/3' : 'w-full'} relative overflow-hidden`}>
            <div 
              className={`h-full bg-gradient-to-br ${currentSlideData.bgGradient || 'from-background to-background'} p-8 overflow-y-auto`}
            >
              {currentSlideData.component}
            </div>
          </div>

          {/* Speaker Notes */}
          {showSpeakerNotes && (
            <div className="w-1/3 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Speaker Notes
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentSlideData.speakerNotes || 'No speaker notes available for this slide.'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentSlide(Math.max(0, currentSlide - 1));
              setSlideTimer(0);
            }}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {/* Slide Indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  setSlideTimer(0);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide 
                    ? 'bg-blue-600' 
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1));
              setSlideTimer(0);
            }}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
