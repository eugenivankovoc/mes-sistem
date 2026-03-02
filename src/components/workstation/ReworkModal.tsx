import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  partId: string;
  orderId: string;
  orderNumber: string;
  onSubmit: (reason: string, photoUrl: string | null) => void;
  isPending: boolean;
}

export function ReworkModal({
  open,
  onOpenChange,
  partName,
  partId,
  orderId,
  orderNumber,
  onSubmit,
  isPending,
}: ReworkModalProps) {
  const [reason, setReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isValid = reason.trim().length >= 10;
  const charCount = reason.trim().length;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    let photoUrl: string | null = null;

    if (photo) {
      setUploading(true);
      const path = `${orderId}/${partId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("rework-photos")
        .upload(path, photo, { contentType: photo.type });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("rework-photos")
          .getPublicUrl(path);
        photoUrl = urlData?.publicUrl ?? null;
      }
      setUploading(false);
    }

    onSubmit(reason.trim(), photoUrl);
    resetForm();
  };

  const resetForm = () => {
    setReason("");
    removePhoto();
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]" style={{ borderRadius: 16, padding: 24 }}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Prijava dorade
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Part info – read-only */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">{partName}</p>
            <p className="text-xs text-muted-foreground">Nalog: {orderNumber}</p>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="rework-reason">
              Razlog dorade <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rework-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              placeholder="Opišite što nije u redu s ovim dijelom..."
              rows={5}
              className="text-[15px]"
              style={{ borderWidth: 1.5, borderRadius: 8 }}
              autoFocus
            />
            <div className="flex justify-between">
              {charCount > 0 && charCount < 10 && (
                <p className="text-xs text-destructive">
                  Minimalno 10 znakova ({charCount}/10)
                </p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">{charCount}/500 znakova</p>
            </div>
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Fotografija <span className="text-muted-foreground text-xs">(opcionalno)</span></Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {!photoPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-[120px] rounded-xl border-2 border-dashed border-input flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm">Dodajte fotografiju</span>
              </button>
            ) : (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Rework photo"
                  className="h-20 w-20 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isPending || uploading}
            className="w-full h-[52px] text-[15px] font-bold"
            style={{ borderRadius: 8 }}
          >
            {uploading ? "Učitavam..." : isPending ? "Šaljem..." : "Prijavi doradu"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending || uploading}
            className="w-full h-[52px]"
            style={{ borderRadius: 8 }}
          >
            Odustani
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
