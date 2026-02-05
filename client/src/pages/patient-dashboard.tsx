import { Link, useLocation } from "wouter";
import { WebLayout } from "@/components/web-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Eye,
  Download,
  Activity,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ScanEye,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getScans, getMyDoctor } from "@/lib/api";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function PatientDashboard() {
  const [, setLocation] = useLocation();
  
  const { data: myDoctorData, isLoading: loadingDoctor } = useQuery({
    queryKey: ["my-doctor"],
    queryFn: getMyDoctor,
  });

  const { data: scans, isLoading: loadingScans } = useQuery({
    queryKey: ["scans"],
    queryFn: getScans,
    enabled: !!myDoctorData?.doctor, // Only fetch scans if patient has a doctor
  });

  // Redirect to doctor selection if no doctor assigned
  useEffect(() => {
    if (!loadingDoctor && !myDoctorData?.doctor) {
      setLocation("/select-doctor");
    }
  }, [loadingDoctor, myDoctorData, setLocation]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe": return "bg-red-100 text-red-700 border-red-200";
      case "moderate": return "bg-orange-100 text-orange-700 border-orange-200";
      case "mild": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "severe": return <XCircle className="h-4 w-4" />;
      case "moderate": return <AlertTriangle className="h-4 w-4" />;
      case "mild": return <Activity className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const latestScan = scans?.[0];
  const totalScans = scans?.length ?? 0;
  const myDoctor = myDoctorData?.doctor;
  const isLoading = loadingDoctor || loadingScans;

  // Show loading while checking doctor status
  if (loadingDoctor) {
    return (
      <WebLayout title="My Health">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout title="Patient Dashboard">
      <div className="space-y-8 max-w-7xl">
        {/* Header with greeting */}
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Track your diabetic retinopathy screening results
          </p>
        </div>

        {/* Your Doctor Card */}
        {myDoctor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-50 dark:from-primary/20 dark:to-slate-800 border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Your Doctor</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">Dr. {myDoctor.name}</p>
                    {myDoctor.specialty && (
                      <p className="text-sm text-slate-500">{myDoctor.specialty}</p>
                    )}
                  </div>
                </div>
                <Link href="/select-doctor">
                  <Button variant="outline" className="gap-2">
                    Change Doctor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalScans}</p>
                  <p className="text-sm text-slate-500">Total Reports</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-slate-800 border-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Heart className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {latestScan?.confidence ?? "--"}%
                  </p>
                  <p className="text-sm text-slate-500">Last Confidence</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-slate-800 border-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white capitalize">
                    {latestScan?.severity ?? "N/A"}
                  </p>
                  <p className="text-sm text-slate-500">Latest Status</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Latest Result Summary */}
        {latestScan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ScanEye className="h-6 w-6 text-primary" />
                    <span className="text-lg font-medium">Latest Screening</span>
                  </div>
                  <Badge className={`${getSeverityColor(latestScan.severity)}`}>
                    {getSeverityIcon(latestScan.severity)}
                    <span className="ml-2 capitalize">{latestScan.severity}</span>
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2">{latestScan.diagnosis}</h3>
                <div className="flex items-center gap-6 text-slate-300">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(latestScan.timestamp), "MMM dd, yyyy")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(new Date(latestScan.timestamp), "h:mm a")}
                  </span>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-slate-400" />
                    <span className="text-base text-slate-600 dark:text-slate-400">AI Confidence</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {latestScan.confidence}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${latestScan.confidence}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <Link href={`/results/${latestScan.id}`} className="flex-1">
                    <Button className="w-full gap-2" size="lg">
                      <Eye className="h-5 w-5" />
                      View Full Details
                    </Button>
                  </Link>
                  <Link href={`/results/${latestScan.id}`}>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Download className="h-5 w-5" />
                      Download PDF
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Report History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Report History</h2>
            <Badge variant="secondary">{totalScans} reports</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : scans && scans.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {scans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-5 hover:shadow-lg transition-all border-slate-200/60 hover:border-primary/30">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        scan.severity === "severe" ? "bg-red-100" :
                        scan.severity === "moderate" ? "bg-orange-100" :
                        scan.severity === "mild" ? "bg-yellow-100" : "bg-emerald-100"
                      }`}>
                        {getSeverityIcon(scan.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base text-slate-900 dark:text-white truncate">
                            {scan.diagnosis}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(scan.timestamp), "MMM dd, yyyy")}
                          </span>
                          <Badge className={`text-xs ${getSeverityColor(scan.severity)}`}>
                            {scan.severity}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/results/${scan.id}`}>
                        <Button size="default" variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-2">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <ScanEye className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Reports Yet</h3>
              <p className="text-base text-slate-500 max-w-md mx-auto">
                Your diabetic retinopathy screening reports will appear here after your doctor uploads them.
              </p>
            </Card>
          )}
        </div>
      </div>
    </WebLayout>
  );
}
