import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Nešto je pošlo po krivu
            </h2>
            <p className="text-sm text-muted-foreground">
              Došlo je do neočekivane greške. Pokušajte osvježiti stranicu.
            </p>
          </div>

          {isDev && this.state.error && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
              <p className="text-xs font-mono text-destructive break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Osvježi stranicu
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Povratak na početnu
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
