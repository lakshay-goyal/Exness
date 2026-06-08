import { Loader2Icon } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';

const Spinner = ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )

export { Spinner };
