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
      <div className="w-[280px] shrink-0 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="flex-1 space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="w-[320px] shrink-0 space-y-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
