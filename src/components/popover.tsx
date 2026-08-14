import { cn } from '@/lib/utils';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type Position = {
  xAlign: 'left' | 'center' | 'right';
  yAlign: 'top' | 'bottom' | 'center';
};

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

type PopoverContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  close: () => void;
  position: PopoverPosition;
  actualPlacement: Position;
  setActualPlacement: React.Dispatch<React.SetStateAction<Position>>;
  isPositioned: boolean;
  setIsPositioned: React.Dispatch<React.SetStateAction<boolean>>;
};

const PopoverContext = createContext<PopoverContextType | null>(null);

type PopoverProps = {
  children: ReactNode;
  className?: string;
  /** Controlled state. If not passed —, the component controls itself. */
  open?: boolean;
  /** Initial state for unmanaged mode. */
  defaultOpen?: boolean;
  /** Called whenever the opening state should change. */
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  position?: PopoverPosition;
};

export const Popover = ({
  children,
  className,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  position = 'bottom',
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(open);
  // Re-sync isOpen when the `open` prop itself changes, without an effect
  // (react.dev: "Adjusting state when a prop changes"). isOpen still
  // diverges from `open` in between via close()/PopoverTrigger clicks.
  const [prevOpenProp, setPrevOpenProp] = useState(open);
  if (open !== prevOpenProp) {
    setPrevOpenProp(open);
    setIsOpen(open);
  }

  const [isPositioned, setIsPositioned] = useState(false); // local state to track if the popover has been positioned
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [actualPlacement, setActualPlacement] = useState<Position>({
    xAlign: 'center',
    yAlign: position === 'top' ? 'top' : 'bottom',
  });

  // Handle external close function
  const close = useCallback(() => {
    setIsOpen(false);
    setIsPositioned(false);
    onClose?.();
  }, [onClose]);

  // Click outside the butt
  useEffect(() => {
    if (!closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event?.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnOutsideClick, close]);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, closeOnEsc, close]);

  return (
    <PopoverContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRef,
        close,
        position,
        actualPlacement,
        setActualPlacement,
        isPositioned,
        setIsPositioned,
      }}
    >
      <div
        className={`relative inline-block ${className || ''}`}
        ref={popoverRef}
      >
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const PopoverTrigger = ({
  children,
  className,
  asChild = false,
}: PopoverTriggerProps) => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverTrigger must be used within a Popover');
  }
  const { setIsOpen, triggerRef } = context;

  if (
    asChild &&
    React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
  ) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        setIsOpen((prev) => !prev);
        children.props.onClick?.(e as React.MouseEvent<HTMLElement>);
      },
      'aria-haspopup': 'true',
    });
  }

  return (
    <div
      className={`cursor-pointer ${className || ''}`}
      onClick={() => setIsOpen((prev) => !prev)}
      aria-haspopup="true"
      ref={triggerRef}
    >
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  position?: PopoverPosition;
  showArrow?: boolean;
  arrowClassName?: string;
  arrowSize?: number;
}

export const PopoverContent = ({
  children,
  className = '',
  sideOffset = 5,
  position = 'bottom',
  showArrow = true,
  arrowClassName = '',
  arrowSize = 8,
}: PopoverContentProps) => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverContent must be used within a Popover');
  }

  const { isOpen, triggerRef, isPositioned, setIsPositioned } = context;
  const [arrowDefaultClassName, setArrowDefaultClassName] =
    useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Position>({
    xAlign: 'center',
    yAlign: position === 'top' ? 'top' : 'bottom',
  });
  const [dynamicStyles, setDynamicStyles] = useState({
    transform: 'translate(0px, 0px)',
  });
  const [arrowStyles, setArrowStyles] = useState<React.CSSProperties>({});

  const getInitialPlacement = (pos: PopoverPosition): Position => {
    switch (pos) {
      case 'top':
        return { xAlign: 'center', yAlign: 'top' };
      case 'bottom':
        return { xAlign: 'center', yAlign: 'bottom' };
      case 'left':
        return { xAlign: 'left', yAlign: 'center' };
      case 'right':
        return { xAlign: 'right', yAlign: 'center' };
      default:
        return { xAlign: 'center', yAlign: 'bottom' };
    }
  };

  const getArrowPosition = (
    xAlign: string,
    yAlign: string,
    arrowSize: number
  ): React.CSSProperties => {
    const arrowOffset = arrowSize / 2;
    const position: React.CSSProperties = {};

    // Based on popover placement, determine arrow position and border styles
    if (yAlign === 'top') {
      position.bottom = `-${arrowOffset}px`;
      setArrowDefaultClassName(`border-r border-b border-border`);
    } else if (yAlign === 'bottom') {
      position.top = `-${arrowOffset}px`;
      setArrowDefaultClassName(`border-t border-l border-border`);
    }

    if ((yAlign === 'top' || yAlign === 'bottom') && xAlign === 'center') {
      position.left = '50%';
      position.marginLeft = `-${arrowOffset}px`;
    } else if ((yAlign === 'top' || yAlign === 'bottom') && xAlign === 'left') {
      position.left = '20px';
    } else if (
      (yAlign === 'top' || yAlign === 'bottom') &&
      xAlign === 'right'
    ) {
      position.right = '20px';
    }

    if (xAlign === 'left' && yAlign === 'center') {
      position.right = `-${arrowOffset}px`;
      setArrowDefaultClassName(`border-r border-b border-border`);
      position.top = '50%';
      position.marginTop = `-${arrowOffset}px`;
    } else if (xAlign === 'right' && yAlign === 'center') {
      position.left = `-${arrowOffset}px`;
      setArrowDefaultClassName(`border-l border-b border-border`);
      position.top = '50%';
      position.marginTop = `-${arrowOffset}px`;
    }

    return position;
  };

  // This function handles positioning the content relative to the trigger
  const updatePosition = useCallback(() => {
    if (!isOpen || !contentRef.current || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;

    const preferredPlacement = getInitialPlacement(position);

    let yAlign: Position['yAlign'] = preferredPlacement.yAlign;
    let xAlign: Position['xAlign'] = preferredPlacement.xAlign;

    if (position === 'left' || position === 'right') {
      if (position === 'left' && spaceLeft < contentRect.width) {
        if (spaceRight >= contentRect.width) {
          xAlign = 'right';
        } else {
          xAlign = spaceLeft >= spaceRight ? 'left' : 'right';
        }
      } else if (position === 'right' && spaceRight < contentRect.width) {
        if (spaceLeft >= contentRect.width) {
          xAlign = 'left';
        } else {
          xAlign = spaceRight >= spaceLeft ? 'right' : 'left';
        }
      }

      yAlign = 'center';
    } else {
      if (position === 'bottom' && spaceBelow < contentRect.height) {
        if (spaceAbove >= contentRect.height) {
          yAlign = 'top';
        } else {
          yAlign = spaceBelow >= spaceAbove ? 'bottom' : 'top';
        }
      } else if (position === 'top' && spaceAbove < contentRect.height) {
        if (spaceBelow >= contentRect.height) {
          yAlign = 'bottom';
        } else {
          yAlign = spaceAbove >= spaceBelow ? 'top' : 'bottom';
        }
      }

      const contentWidth = contentRect.width;
      const centerPos =
        triggerRect.left + triggerRect.width / 2 - contentWidth / 2;

      if (centerPos < 0) {
        xAlign = 'left';
      } else if (centerPos + contentWidth > viewportWidth) {
        xAlign = 'right';
      } else {
        xAlign = 'center';
      }
    }

    setPlacement({ xAlign, yAlign });

    let translateX = 0;
    let translateY = 0;

    if (yAlign === 'top') {
      translateY = -(contentRect.height + sideOffset);
    } else if (yAlign === 'bottom') {
      translateY = triggerRect.height + sideOffset;
    } else if (yAlign === 'center') {
      translateY = (triggerRect.height - contentRect.height) / 2;
    }

    if (xAlign === 'left') {
      translateX = position === 'left' ? -(contentRect.width + sideOffset) : 0;
    } else if (xAlign === 'right') {
      translateX =
        position === 'right'
          ? triggerRect.width + sideOffset
          : triggerRect.width - contentRect.width;
    } else if (xAlign === 'center') {
      translateX = (triggerRect.width - contentRect.width) / 2;
    }

    const arrowPosition = getArrowPosition(xAlign, yAlign, arrowSize);

    setDynamicStyles({
      transform: `translate(${translateX}px, ${translateY}px)`,
    });

    setArrowStyles(arrowPosition);
    setIsPositioned(true);
  }, [isOpen, triggerRef, position, sideOffset, arrowSize, setIsPositioned]);

  // Initialize position calculation in a layout effect to prevent flicker
  useEffect(() => {
    if (isOpen && contentRef.current && triggerRef.current) {
      updatePosition();
    }
    return undefined;
  }, [isOpen, triggerRef, updatePosition]);

  useEffect(() => {
    if (!isPositioned) return;

    const handlePositionChange = () => {
      window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handlePositionChange);
    window.addEventListener('scroll', handlePositionChange, true);

    return () => {
      window.removeEventListener('resize', handlePositionChange);
      window.removeEventListener('scroll', handlePositionChange, true);
    };
  }, [isPositioned, updatePosition]);

  useEffect(() => {
    if (!isPositioned) return;

    const observer = new MutationObserver(updatePosition);
    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [isPositioned, updatePosition]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 border rounded-lg shadow-sm bg-background border-border max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)] transition-opacity duration-200 ${isPositioned ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        top: 0,
        left: 0,
        ...dynamicStyles,
      }}
      role="dialog"
      data-placement={`${placement.yAlign}-${placement.xAlign}`}
    >
      {children}
      {showArrow && (
        <div
          className={cn(
            `absolute bg-background rotate-45 z-40`,
            arrowDefaultClassName,
            arrowClassName
          )}
          style={{
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            ...arrowStyles,
          }}
          data-popover-arrow
        />
      )}
    </div>
  );
};

interface PopoverCloseProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const PopoverClose = ({
  children,
  className,
  asChild = false,
  ...props
}: PopoverCloseProps) => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverClose must be used within a Popover');
  }
  const { close } = context;

  if (
    asChild &&
    React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
  ) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        close();
        children.props.onClick?.(e as React.MouseEvent<HTMLElement>);
      },
    });
  }

  return (
    <div
      className={`cursor-pointer ${className || ''}`}
      onClick={close}
      aria-label="Close"
      {...props}
    >
      {children}
    </div>
  );
};
