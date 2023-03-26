import { useState } from "react";

interface OpenHomeButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: any;
  children?: any;
  disabled?: any
}

const OpenHomeButton = (props: OpenHomeButtonProps) => {
  const { onClick, style, children, disabled } = props;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        border: "none",
        borderRadius: 3,
        cursor: "pointer",
        filter: hovered ? "brightness(90%)" : undefined,
        ...style
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default OpenHomeButton;
