import * as React from "react";
import {
  ScrollArea as PrimitiveScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@radix-ui/react-scroll-area";

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof PrimitiveScrollArea> {
  children: React.ReactNode;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof PrimitiveScrollArea>,
  ScrollAreaProps
>(({ className, children, ...props }, ref) => (
  <PrimitiveScrollArea
    ref={ref}
    className={`relative ${className || ''}`}
    {...props}
  >
    <ScrollAreaViewport className="h-full w-full">
      {children}
    </ScrollAreaViewport>
    <ScrollAreaScrollbar className="h-full w-2" orientation="vertical">
      <ScrollAreaThumb className="bg-black/20 dark:bg-white/20 rounded-full hover:bg-black/30" />
    </ScrollAreaScrollbar>
  </PrimitiveScrollArea>
));
ScrollArea.displayName = PrimitiveScrollArea.displayName;

export { ScrollArea };
export type { ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb } from "@radix-ui/react-scroll-area";