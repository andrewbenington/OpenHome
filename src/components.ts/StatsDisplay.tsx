import { Button, Card } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  Title,
  RadialLinearScale,
  Filler,
  Tooltip,
  ScriptableScalePointLabelContext,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { pkm } from "../pkm/pkm";
import { useState } from "react";
import { getNatureSummary } from "../consts/Natures";
import _ from "lodash";
import { pk3 } from "../pkm/pk3";
import { colopkm } from "../pkm/colopkm";

const getSheenStars = (mon: pkm) => {
  if (mon instanceof pk3 || mon instanceof colopkm) {
    return mon.contest.sheen === 255
      ? 10
      : Math.floor(mon.contest.sheen / 29) + 1;
  } else {
    if (mon.contest.sheen < 22) {
      return 0;
    } else if (mon.contest.sheen < 43) {
      return 1;
    } else if (mon.contest.sheen < 64) {
      return 2;
    } else if (mon.contest.sheen < 86) {
      return 3;
    } else if (mon.contest.sheen < 107) {
      return 4;
    } else if (mon.contest.sheen < 128) {
      return 5;
    } else if (mon.contest.sheen < 150) {
      return 6;
    } else if (mon.contest.sheen < 171) {
      return 7;
    } else if (mon.contest.sheen < 192) {
      return 8;
    } else if (mon.contest.sheen < 214) {
      return 9;
    } else if (mon.contest.sheen < 235) {
      return 10;
    } else if (mon.contest.sheen < 255) {
      return 11;
    } else {
      return 12;
    }
  }
};

const StatsDisplay = (props: { mon: pkm }) => {
  const { mon } = props;
  const [display, setDisplay] = useState("Stats");
  ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Filler,
    Tooltip
  );
  return (
    <div
      style={{
        marginLeft: 10,
        padding: 10,
        height: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div style={{ padding: 20, height: 280 }}>
        <Radar
          options={{
            plugins: {
              tooltip: {
                usePointStyle: true,
                callbacks: {
                  title: () => "",
                  label: (context) => {
                    return `${context.label}: ${context.raw}`;
                  },
                },
              },
            },
            scales: {
              r: {
                min: 0,
                max:
                  display === "IVs" ? 31 : display === "EVs" ? 252 : undefined,
                pointLabels: {
                  font: { size: 14, weight: "bold" },
                  color: (ctx: ScriptableScalePointLabelContext) => {
                    if (display === "Contest") {
                      return "white";
                    }
                    return ctx.label.includes("▲")
                      ? "#F58"
                      : ctx.label.includes("▼")
                      ? "#78F"
                      : "black";
                  },
                  backdropColor: (ctx: ScriptableScalePointLabelContext) => {
                    if (display !== "Contest") {
                      return undefined;
                    }
                    switch (ctx.label) {
                      case "Cool":
                        return "#F08030";
                      case "Beauty":
                        return "#6890F0";
                      case "Cute":
                        return "#F85888";
                      case "Smart":
                        return "#78C850";
                      case "Tough":
                        return "#F8D030";
                      default:
                        return undefined;
                    }
                  },
                  borderRadius: display === "Contest" ? 12 : 0,
                  backdropPadding: display === "Contest" ? 4 : 0,
                  callback: (value) => {
                    let natureSummary = getNatureSummary(
                      mon.statNature ?? mon.nature
                    );
                    if (natureSummary?.includes(`-${value}`)) {
                      return `${value}▼`;
                    } else if (natureSummary?.includes(`+${value}`)) {
                      return `${value}▲`;
                    } else {
                      return `${value}`;
                    }
                  },
                },
              },
            },
          }}
          data={{
            labels:
              display === "Contest"
                ? ["Cool", "Beauty", "Cute", "Smart", "Tough"]
                : ["HP", "Atk", "Def", "Spe", "SpD", "SpA"],
            datasets: [
              display === "Stats"
                ? {
                    label: "Stats",
                    data: [
                      mon.stats.hp,
                      mon.stats.atk,
                      mon.stats.def,
                      mon.stats.spe,
                      mon.stats.spd,
                      mon.stats.spa,
                    ],
                    fill: true,
                    backgroundColor: "rgba(132, 99, 255, 0.2)",
                    borderColor: "rgb(132, 99, 255)",
                    pointBackgroundColor: "rgb(132, 99, 255)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgb(132, 99, 255)",
                  }
                : display === "IVs"
                ? {
                    label: "IVs",
                    data: [
                      mon.ivs.hp,
                      mon.ivs.atk,
                      mon.ivs.def,
                      mon.ivs.spe,
                      mon.ivs.spd,
                      mon.ivs.spa,
                    ],
                    fill: true,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgb(255, 99, 132)",
                    pointBackgroundColor: "rgb(255, 99, 132)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgb(255, 99, 132)",
                  }
                : display === "EVs"
                ? {
                    label: "EVs",
                    data: [
                      mon.evs.hp,
                      mon.evs.atk,
                      mon.evs.def,
                      mon.evs.spe,
                      mon.evs.spd,
                      mon.evs.spa,
                    ],
                    fill: true,
                    backgroundColor: "rgba(132, 99, 255, 0.2)",
                    borderColor: "rgb(132, 99, 255)",
                    pointBackgroundColor: "rgb(132, 99, 255)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgb(132, 99, 255)",
                  }
                : {
                    label: "Contest",
                    data: [
                      mon.contest.cool,
                      mon.contest.beauty,
                      mon.contest.cute,
                      mon.contest.smart,
                      mon.contest.tough,
                    ],
                    fill: true,
                    backgroundColor: "rgba(132, 99, 255, 0.2)",
                    borderColor: "rgb(132, 99, 255)",
                    pointBackgroundColor: "rgb(132, 99, 255)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgb(132, 99, 255)",
                  },
            ],
          }}
        />
      </div>
      {display === "Contest" && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            height: 40,
          }}
        >
          <p>Sheen:</p>
          <div
            style={{
              backgroundColor: "#666",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              marginLeft: 10,
              marginRight: 10,
              width: mon instanceof pk3 || mon instanceof colopkm ? 300 : 360,
            }}
          >
            {_.range(getSheenStars(mon)).map((level: number) => (
              <img
                src={process.env.PUBLIC_URL + "/icons/sheen.gif"}
                style={{
                  height: 30,
                  objectFit: "contain",
                }}
              />
            ))}
          </div>
          ({mon.contest.sheen})
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "absolute",
          bottom: 10,
        }}
      >
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay("Stats")}
        >
          Stats
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay("EVs")}
        >
          EVs
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay("IVs")}
        >
          IVs
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          variant="outlined"
          size="small"
          onClick={() => setDisplay("Contest")}
        >
          Contest
        </Button>
      </div>
    </div>
  );
};

export default StatsDisplay;
