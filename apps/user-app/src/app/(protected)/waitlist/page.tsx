"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, RefreshCw, Star, Phone, Calendar, ArrowRight } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { api } from "@/lib/api";

type WaitlistEntry = {
  id: string;
  phone: string;
  serviceType: string;
  wantsFaster: boolean;
  createdAt: string;
};

export default function WaitlistDashboardPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWaitlist = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/waitlist");
      setEntries(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch waitlist entries. Ensure you are authorized.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Early Access Waitlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Track users who requested early access to launch services. Sorted by priority and sign-up time.
            </p>
          </div>
          <Button
            onClick={fetchWaitlist}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Loading waitlist entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-4xl mb-3 block">📋</span>
              <h3 className="font-bold text-lg text-foreground mb-1">Waitlist is empty</h3>
              <p className="text-sm">No phone numbers have been registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Requested Service
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Priority Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-muted/30 transition-colors ${entry.wantsFaster ? "bg-primary/[0.02]" : ""}`}
                    >
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Phone className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-foreground text-[15px]">
                            +91 {entry.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold capitalize bg-muted border border-border text-foreground">
                          {entry.serviceType.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {entry.wantsFaster ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 border border-amber-200 text-amber-800 shadow-sm animate-pulse">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Wants It Faster (ASAP)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                            Standard Access
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Calendar className="w-4 h-4 text-muted-foreground/60" />
                          {format(new Date(entry.createdAt), "PPP p")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
