import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Activity, 
  Award, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";
import heroImage from "@/assets/hero-rlu-platform.jpg";
import rluLogo from "@/assets/rlu-360-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { isAuthenticated, getDefaultRoute } = useAuth();

  // Redirect authenticated users to their default route
  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  const achievements = [
    { title: "Cost Reduction", description: "Up to ฿175,000 annually", icon: TrendingUp },
    { title: "Physician Engagement", description: "Real-time performance tracking", icon: Users },
    { title: "Quality Improvement", description: "Evidence-based decision making", icon: Target },
    { title: "Award Recognition", description: "Province-level validated", icon: Award }
  ];

  const successStories = [
    { 
      hospital: "30-Bed Community Hospital",
      results: ["฿175k annual cost reduction", "11 physicians enrolled", "Province RLU Award 2025"],
      type: "Small Hospital"
    },
    { 
      hospital: "Your Hospital",
      results: ["Scalable implementation", "Customizable KPIs", "AI-powered insights"],
      type: "Any Size"
    }
  ];

  const keyFeatures = [
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Monitor KPIs, track CPG compliance, and visualize lab utilization patterns"
    },
    {
      icon: Users,
      title: "Physician Performance",
      description: "Individual scorecards with improvement tracking and feedback systems"
    },
    {
      icon: Activity,
      title: "AI-Powered Insights",
      description: "GPT-4 driven analysis for root cause identification and recommendations"
    },
    {
      icon: Target,
      title: "RLU Transformation",
      description: "Complete 360° model implementation with measurable outcomes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={rluLogo} alt="RLU 360" className="h-10 w-10 animate-pulse-glow" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">RLU 360</span>
              <span className="text-xs text-muted-foreground">Transformation Model</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden md:flex">
              <Award className="w-3 h-3 mr-1" />
              Province Award Submission
            </Badge>
            <Link to="/login">
              <Button className="btn-hero">
                Launch Platform
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <div className="animate-fade-in">
              <Badge variant="secondary" className="mb-6 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                <Star className="w-3 h-3 mr-1" />
                Province Award Validated Solution
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                RLU 360 Transformation Model
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
                Scalable AI-Powered Platform for Rational Laboratory Use in Any Hospital
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 animate-fade-in">
              Proven Impact for Healthcare Excellence
            </h2>
            <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Scalable solution delivering measurable results for hospitals of all sizes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card 
                  key={achievement.title} 
                  className="p-6 text-center shadow-card hover:shadow-elegant transition-smooth animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                >
                  <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Proven Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Real results from real implementations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {successStories.map((story, index) => (
              <Card 
                key={story.hospital}
                className="p-8 shadow-card hover:shadow-elegant transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <Badge className="mb-4">{story.type}</Badge>
                <h3 className="text-xl font-bold text-foreground mb-4">{story.hospital}</h3>
                <div className="space-y-2">
                  {story.results.map((result, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">{result}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Platform Capabilities
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive tools for RLU implementation and monitoring
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center group animate-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Implement RLU 360 in Your Hospital?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Join the healthcare transformation with our proven, scalable platform. Suitable for hospitals of all sizes.
            </p>
            <div className="flex justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Activity className="w-5 h-5 mr-2" />
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={rluLogo} alt="RLU 360" className="h-8 w-8" />
            <span className="text-lg font-bold text-primary">RLU 360 Transformation Model</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Scalable Rational Laboratory Use Platform • Province Award Validated • Healthcare Excellence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
