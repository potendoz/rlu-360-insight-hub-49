import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Star, TrendingUp, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorData } from "@/utils/pdpaUtils";

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    department: string;
    avatar?: string;
    score: number;
    cpgMismatch: number;
    duplicateOrder: number;
    cpRatio: number;
    specialization: string;
    lastReview: string;
  };
  onViewDetails: (doctorId: string) => void;
}

export const DoctorCard = ({ doctor, onViewDetails }: DoctorCardProps) => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const anonymizedDoctor = anonymizeDoctorData(doctor, isJudge);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    return "destructive";
  };

  const scoreColor = getScoreColor(doctor.score);
  const scoreBadgeVariant = getScoreBadgeVariant(doctor.score);
  
  // Display RLU score with 2 decimal places
  const displayScore = doctor.score.toFixed(2);

  return (
    <Card className="kpi-card group">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          {doctor.avatar ? (
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-primary" />
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{anonymizedDoctor.name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.department}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
            </div>
            <Badge variant={scoreBadgeVariant} className="ml-2">
              <Star className="w-3 h-3 mr-1" />
              {displayScore}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${scoreColor}`}>
                {displayScore}
              </div>
              <div className="text-xs text-muted-foreground">RLU Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {doctor.cpgMismatch.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">CPG Mismatch (%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-destructive">
                {doctor.duplicateOrder.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Duplicate Order (%)</div>
            </div>
          </div>

          {/* C/P Ratio */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>C/P Ratio</span>
              <span>{doctor.cpRatio.toFixed(2)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-smooth"
                style={{ width: `${Math.min(doctor.cpRatio * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Last review: {doctor.lastReview}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(doctor.id)}
              className="ml-2"
            >
              <FileText className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};