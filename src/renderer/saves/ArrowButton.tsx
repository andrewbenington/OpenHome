import { useState } from "react";

interface OpenHomeButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: any;
  children?: any;
}

const ArrowButton = (props: OpenHomeButtonProps) => {
  const { onClick, style, children } = props;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        border: "none",
        background: 'none',
        color: hovered ? "#FFFF" : "#FFFB",
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

export default ArrowButton;
