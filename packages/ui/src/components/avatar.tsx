'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@repo/ui/lib/utils';

const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>): React.ReactElement => (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );

const AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>): React.ReactElement => (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );

const AvatarFallback = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>): React.ReactElement => (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  );

export { Avatar, AvatarImage, AvatarFallback };
