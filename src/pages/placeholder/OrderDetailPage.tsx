import { useParams, useNavigate } from "react-router-dom";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useOrderDetail, useOrderComments, useWorkstationProgress } from "@/hooks/useOrderDetail";
import { useIsTablet } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { OrderInfoCard } from "@/components/order-detail/OrderInfoCard";
import { OrderActionButtons } from "@/components/order-detail/OrderActionButtons";
import { OrderArticles } from "@/components/order-detail/OrderArticles";
import { OrderCommentsPanel } from "@/components/order-detail/OrderCommentsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isTablet = useIsTablet();
  const { user } = useAuth();
  const { data: order, isLoading, error, refetch: refetchOrder } = useOrderDetail(id);
  const { data: comments = [], refetch: refetchComments } = useOrderComments(id);
  const { data: workstationProgress = [] } = useWorkstationProgress(order);

  useSetPageTitle(order ? `Nalog: ${order.order_number}` : "Nalog");

  if (isLoading) {
    return <OrderDetailSkeleton isTablet={isTablet} />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Nalog nije pronađen.</p>
        <Link to="/orders" className="text-primary hover:underline text-sm">
          ← Upravljanje nalozima
        </Link>
      </div>
    );
  }

  const leftContent = (
    <>
      <OrderInfoCard order={order} workstationProgress={workstationProgress} />
      <OrderActionButtons order={order} />
    </>
  );
  const centerContent = <OrderArticles articles={order.articles} />;
  const rightContent = (
    <OrderCommentsPanel
      orderId={order.id}
      comments={comments}
      userId={user?.id ?? ""}
      onCommentAdded={refetchComments}
    />
  );

  if (isTablet) {
    return (
      <div className="p-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Upravljanje nalozima
        </Link>
        <Tabs defaultValue="dijelovi" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="nalog">Nalog</TabsTrigger>
            <TabsTrigger value="dijelovi">Dijelovi</TabsTrigger>
            <TabsTrigger value="komentari">Komentari</TabsTrigger>
          </TabsList>
          <TabsContent value="nalog">{leftContent}</TabsContent>
          <TabsContent value="dijelovi">{centerContent}</TabsContent>
          <TabsContent value="komentari">{rightContent}</TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex gap-5 min-h-[calc(100vh-80px)] p-5">
      {/* Left column */}
      <div className="w-[280px] shrink-0">
        <div className="sticky top-5">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Upravljanje nalozima
          </Link>
          {leftContent}
        </div>
      </div>

      {/* Center column */}
      <div className="flex-1 min-w-0">{centerContent}</div>

      {/* Right column */}
      <div className="w-[320px] shrink-0">
        <div className="sticky top-5">{rightContent}</div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton({ isTablet }: { isTablet: boolean }) {
  if (isTablet) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="flex gap-5 p-5">
      {/* Left – info fields */}
      <div className="w-[280px] shrink-0 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="rounded-lg border border-border p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4" style={{ width: `${50 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
      {/* Center – articles + parts */}
      <div className="flex-1 space-y-3">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 2 }).map((_, a) => (
          <div key={a} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            {Array.from({ length: 4 }).map((_, p) => (
              <div key={p} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" style={{ maxWidth: `${40 + Math.random() * 30}%` }} />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Right – comments */}
      <div className="w-[320px] shrink-0 space-y-3">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
