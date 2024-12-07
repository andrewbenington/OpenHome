<<<<<<< HEAD
import { MarkingColorValue, Markings } from 'pokemon-files'
import { CSSProperties } from 'react'
import { marking } from '../../types/types'

interface MarkingsProps {
  markings: Markings
}

const markingsContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  padding: 5,
  backgroundColor: '#666',
  marginTop: 10,
  borderRadius: 5,
} as CSSProperties

const getMarkingColorByNumber = (value: marking) => {
  return ['grey', 'blue', 'red'][value]
}

const getMarkingColor = (value: boolean | MarkingColorValue) => {
  if (!value) return 'grey'
  if (value === true) return 'blue'
  return value
}

const MarkingsDisplay = (props: MarkingsProps) => {
  const { markings } = props
  if (!('length' in markings)) {
    return (
      <div style={markingsContainerStyle}>
        <span className="No-Select" style={{ color: getMarkingColor(markings.circle) }}>
          ●
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.square) }}>
          ■
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.triangle) }}>
          ▲
        </span>
        <span className="No-Select" style={{ color: getMarkingColor(markings.heart) }}>
          ♥
        </span>
        {'star' in markings ? (
          <span className="No-Select" style={{ color: getMarkingColor(markings.star) }}>
=======
import { MarkingColorValue, Markings } from "pokemon-files";
import { CSSProperties } from "react";
import { marking } from "../types/types";

interface MarkingsProps {
  markings: Markings;
}

const markingsContainerStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  padding: 5,
  backgroundColor: "#666",
  marginTop: 10,
  borderRadius: 5,
} as CSSProperties;

const getMarkingColorByNumber = (value: marking) => {
  return ["grey", "blue", "red"][value];
};

const getMarkingColor = (value: boolean | MarkingColorValue) => {
  if (!value) return "grey";
  if (value === true) return "blue";
  return value;
};

const MarkingsDisplay = (props: MarkingsProps) => {
  const { markings } = props;
  if (!("length" in markings)) {
    return (
      <div style={markingsContainerStyle}>
        <span
          className="No-Select"
          style={{ color: getMarkingColor(markings.circle) }}
        >
          ●
        </span>
        <span
          className="No-Select"
          style={{ color: getMarkingColor(markings.square) }}
        >
          ■
        </span>
        <span
          className="No-Select"
          style={{ color: getMarkingColor(markings.triangle) }}
        >
          ▲
        </span>
        <span
          className="No-Select"
          style={{ color: getMarkingColor(markings.heart) }}
        >
          ♥
        </span>
        {"star" in markings ? (
          <span
            className="No-Select"
            style={{ color: getMarkingColor(markings.star) }}
          >
>>>>>>> tauri
            ★
          </span>
        ) : (
          <div />
        )}
<<<<<<< HEAD
        {'diamond' in markings ? (
          <span className="No-Select" style={{ color: getMarkingColor(markings.diamond) }}>
=======
        {"diamond" in markings ? (
          <span
            className="No-Select"
            style={{ color: getMarkingColor(markings.diamond) }}
          >
>>>>>>> tauri
            ◆
          </span>
        ) : (
          <div />
        )}
      </div>
<<<<<<< HEAD
    )
  }
  return (
    <div style={markingsContainerStyle}>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[0]) }}>
        ●
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[1]) }}>
        ■
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[2]) }}>
        ▲
      </span>
      <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[3]) }}>
        ♥
      </span>
      {markings[4] !== undefined ? (
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[4]) }}>
=======
    );
  }
  return (
    <div style={markingsContainerStyle}>
      <span
        className="No-Select"
        style={{ color: getMarkingColorByNumber(markings[0]) }}
      >
        ●
      </span>
      <span
        className="No-Select"
        style={{ color: getMarkingColorByNumber(markings[1]) }}
      >
        ■
      </span>
      <span
        className="No-Select"
        style={{ color: getMarkingColorByNumber(markings[2]) }}
      >
        ▲
      </span>
      <span
        className="No-Select"
        style={{ color: getMarkingColorByNumber(markings[3]) }}
      >
        ♥
      </span>
      {markings[4] !== undefined ? (
        <span
          className="No-Select"
          style={{ color: getMarkingColorByNumber(markings[4]) }}
        >
>>>>>>> tauri
          ★
        </span>
      ) : (
        <div />
      )}
      {markings[5] !== undefined ? (
<<<<<<< HEAD
        <span className="No-Select" style={{ color: getMarkingColorByNumber(markings[5]) }}>
=======
        <span
          className="No-Select"
          style={{ color: getMarkingColorByNumber(markings[5]) }}
        >
>>>>>>> tauri
          ◆
        </span>
      ) : (
        <div />
      )}
    </div>
<<<<<<< HEAD
  )
}

export default MarkingsDisplay
=======
  );
};

export default MarkingsDisplay;
>>>>>>> tauri
