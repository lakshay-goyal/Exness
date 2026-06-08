import { cn } from '@repo/ui/lib/utils';

const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement => (
  <div
    data-slot="skeleton"
    className={cn('bg-accent animate-pulse rounded-md', className)}
    {...props}
  />
);

export { Skeleton };
