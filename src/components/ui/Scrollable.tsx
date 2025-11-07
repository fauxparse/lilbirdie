import { cn } from "@/lib/utils";

type ScrollableDirection = "vertical" | "horizontal";

type ScrollableProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  direction?: ScrollableDirection;
};

const overflowClasses: Record<ScrollableDirection, string> = {
  horizontal: "overflow-x-auto",
  vertical: "overflow-y-auto",
};

// Complete static class strings for Tailwind's static analysis
const gradientClasses: Record<ScrollableDirection, { before: string; after: string }> = {
  vertical: {
    before:
      "before:content-[''] before:block before:z-1 before:-mt-2 before:sticky before:top-0 before:h-2 before:bg-[linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] before:opacity-0",
    after:
      "after:content-[''] after:block after:z-1 after:-mt-2 after:sticky after:bottom-0 after:h-2 after:bg-[linear-gradient(to_top,var(--color-border)_1px,transparent_1px)] after:opacity-0",
  },
  horizontal: {
    before:
      "before:content-[''] before:block before:z-1 before:-ml-2 before:sticky before:left-0 before:w-2 before:bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px)] before:opacity-0",
    after:
      "after:content-[''] after:block after:z-1 after:-ml-2 after:sticky after:right-0 after:w-2 after:bg-[linear-gradient(to_left,var(--color-border)_1px,transparent_1px)] after:opacity-0",
  },
};

const edgeClasses: Record<ScrollableDirection, string> = {
  vertical: "absolute opacity-0 pointer-events-none left-0 right-0 h-4 first:top-0 last:bottom-0",
  horizontal: "absolute opacity-0 pointer-events-none top-0 bottom-0 w-4 first:left-0 last:right-0",
};

export function Scrollable({
  className,
  direction = "vertical",
  children,
  ...props
}: ScrollableProps) {
  const gradients = gradientClasses[direction];

  const setUpIntersectionObserver = (el: HTMLDivElement | null) => {
    if (!el) return;

    const scrollParent = el.firstElementChild as HTMLDivElement;
    if (!scrollParent) return;

    const edges = Array.from(scrollParent.childNodes).filter(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute("data-edge")
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const edge = (entry.target as HTMLElement).getAttribute("data-edge");
        el.setAttribute(`data-scrollable-${edge}`, (!entry.isIntersecting).toString());
      });
    });

    for (const edge of edges) {
      observer.observe(edge as HTMLElement);
    }

    return () => {
      observer.disconnect();
    };
  };

  return (
    <div
      ref={setUpIntersectionObserver}
      className={cn(
        overflowClasses[direction],
        gradients.before,
        gradients.after,
        "data-[scrollable-start=true]:before:opacity-100 data-[scrollable-end=true]:after:opacity-100",
        "before:transition-opacity after:transition-opacity",
        className
      )}
      {...props}
    >
      <div className="relative" data-scrollable-start={false} data-scrollable-end={false}>
        <div data-edge="start" className={edgeClasses[direction]} />
        {children}
        <div data-edge="end" className={edgeClasses[direction]} />
      </div>
    </div>
  );
}
