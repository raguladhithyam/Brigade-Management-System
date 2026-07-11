import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { HomePopup } from '@/lib/popup';

interface PopupDialogProps {
  popup: HomePopup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Renders the announcement popup shown on the home page (and in the admin preview). */
export function PopupDialog({ popup, open, onOpenChange }: PopupDialogProps) {
  const hasButton = popup.buttonLabel.trim() && popup.buttonUrl.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        {popup.imageUrl.trim() && (
          <img
            src={popup.imageUrl}
            alt={popup.title || 'Announcement'}
            className="max-h-64 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="space-y-4 p-6">
          {popup.title.trim() && (
            <DialogHeader>
              <DialogTitle className="text-xl">{popup.title}</DialogTitle>
            </DialogHeader>
          )}
          {popup.message.trim() && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{popup.message}</p>
          )}
          {hasButton && (
            <Button asChild className="w-full">
              <a href={popup.buttonUrl} target="_blank" rel="noopener noreferrer">
                {popup.buttonLabel}
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
