import { useState } from "react";

interface OpenHomeButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: any;
  children?: any;
}

const OpenHomeButton = (props: OpenHomeButtonProps) => {
  const { onClick, style, children } = props;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        border: "none",
        borderRadius: 3,
        backgroundColor: hovered ? "#6663" : "#0000",
        cursor: "pointer",
        ...style
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
};

export default OpenHomeButton;
