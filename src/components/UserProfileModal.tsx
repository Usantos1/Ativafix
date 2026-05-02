import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserProfileContent } from '@/pages/UserProfile';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-hidden rounded-[28px] p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e configurações.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(90dvh-88px)] overflow-y-auto px-5 py-4 scrollbar-thin">
          <UserProfileContent compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
