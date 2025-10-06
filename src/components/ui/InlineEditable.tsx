import { Edit2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import sanitizeHtml from "sanitize-html";
import { Button } from "./Button";

export const InlineEditable = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const contentRef = useRef<HTMLElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      el.setAttribute("contenteditable", "plaintext-only");
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
  };

  const saveChanges = () => {
    setIsEditing(false);
    if (currentValue === value) {
      return;
    }
    onChange(currentValue);
  };

  const cancelChanges = () => {
    setIsEditing(false);
    setCurrentValue(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelChanges();
    }
  };

  return (
    <div className="group/editable relative">
      <ContentEditable
        innerRef={contentRef as React.RefObject<HTMLElement>}
        html={currentValue}
        onChange={(e) => setCurrentValue(sanitizeHtml(e.target.value.replace(/\n/g, "")))}
        disabled={!isEditing}
        onBlur={saveChanges}
        onKeyDown={onKeyDown}
        autoFocus={isEditing}
      />
      <span className="absolute top-[calc(0.5lh-0.5em)] right-[100%] pr-3 opacity-0 group-hover/editable:opacity-100">
        <Button
          variant="ghost"
          className="text-muted-foreground p-0 h-[1em] w-[1em] text-[1em]!"
          onClick={startEditing}
        >
          <Edit2 className="h-[1em] w-[1em]" />
        </Button>
      </span>
    </div>
  );
};
