import { Box, Button, Card, Tab, Tabs } from "@mui/material";
import _ from "lodash";
import { useEffect, useState } from "react";
import { MONS_LIST } from "../../consts/Mons";
import Types from "../../consts/Types";
import { pkm } from "../../pkm/pkm";
import { writeIVsToBuffer } from "../../pkm/util";
import { getTypeColor } from "../util/PokemonSprite";
import AttributeRow from "./AttributeRow";
import AttributeTag from "./AttributeTag";
import PokemonWithItem from "./PokemonWithItem";
import RibbonsDisplay from "./RibbonsDisplay";
import StatsDisplay from "./StatsDisplay";
import SummaryDisplay from "./SummaryDisplay";

const getTypes = (mon: pkm) => {
  let types = MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.types;
  if (mon.format === "pk1" && (mon.dexNum === 81 || mon.dexNum === 82)) {
    types = ["Electric"];
  } else if (
    ["pk1", "pk2", "pk3", "colopkm", "xdpkm", "pk4", "pk5"].includes(mon.format)
  ) {
    if (types?.includes("Fairy")) {
      if (types.length === 1 || types.includes("Flying")) {
        types = types.map((type) => (type === "Fairy" ? "Normal" : type));
      } else if (types[0] === "Fairy") {
        return [types[1]];
      } else {
        return [types[0]];
      }
    }
  }
  return types ?? [];
};

const PokemonDisplay = (props: { mon: pkm; propTab?: string }) => {
  const { mon, propTab } = props;
  const [tab, setTab] = useState("summary");
  useEffect(() => {
    setTab(propTab ?? "summary");
  }, [propTab]);

  const getIVBytes = (): string => {
    let array = new Uint8Array(4);
    console.log(mon.ivs);
    if (!mon.ivs) {
      return "";
    }
    writeIVsToBuffer(mon.ivs, array, 0, false, false);
    let printedString = Array.from(array).map((byte: number) =>
      byte.toString(16)
    );
    return printedString.join(" ");
  };
  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      <PokemonWithItem mon={mon} format={mon.format} style={{ width: "20%" }} />
      <div style={{ textAlign: "left", width: "30%" }}>
        <AttributeRow
          label="Name"
          value={`${MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.formeName}`}
        />
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type, i) => (
            <img
              alt={`pokemon type ${i + 1}`}
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${type.toLocaleLowerCase()}.png`}
            />
          ))}
        </AttributeRow>
        {mon.teraTypeOriginal !== undefined &&
        mon.teraTypeOverride !== undefined ? (
          <AttributeRow label="Tera Type">
            <img
              alt="tera type"
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                mon.teraTypeOverride <= 18
                  ? mon.teraTypeOverride
                  : mon.teraTypeOriginal
              ]?.toLocaleLowerCase()}.png`}
            />
            {mon.teraTypeOverride <= 18 && (
              <>
                <p>(originally </p>
                <img
                  alt="tera type original"
                  style={{ height: 24, width: 24, marginRight: 5 }}
                  src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                    mon.teraTypeOriginal
                  ]?.toLocaleLowerCase()}.png`}
                />
                <p>)</p>
              </>
            )}
          </AttributeRow>
        ) : (
          <></>
        )}
        <AttributeRow
          label="OT"
          value={`${mon.trainerName} ${mon.trainerGender ? "♀" : "♂"}`}
        />
        <AttributeRow
          label="Trainer ID"
          value={`${mon.displayID
            .toString()
            .padStart(
              ["pk7", "pk8", "pa8", "pk9"].includes(mon.format) ? 6 : 5,
              "0"
            )}`}
        />
        <AttributeRow
          label="Ability"
          value={`${mon.ability} (${
            mon.abilityNum === 4 ? "HA" : mon.abilityNum
          })`}
        />
        {mon.dynamaxLevel !== undefined && (
          <AttributeRow label="Dynamax">
            <div style={{ display: "flex", flexDirection: "row" }}>
              {_.range(10).map((level: number) => (
                <div
                  style={{
                    backgroundColor:
                      level < (mon.dynamaxLevel ?? 0)
                        ? `#FF${(40 + ((mon.dynamaxLevel ?? 0) - level) * 20)
                            ?.toString(16)
                            .padStart(2, "0")}00`
                        : "grey",
                    height: 20,
                    width: 8,
                    marginRight: 4,
                  }}
                ></div>
              ))}
            </div>
          </AttributeRow>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {mon.canGigantamax && (
            <AttributeTag
              icon="/icons/gmax.png"
              color="white"
              backgroundColor="#e60040"
            />
          )}
          {mon.isAlpha && (
            <AttributeTag
              icon="/icons/alpha.png"
              color="white"
              backgroundColor="#f2352d"
            />
          )}
          {mon.isSquareShiny && (
            <AttributeTag
              label="SQUARE SHINY"
              color="white"
              backgroundColor="black"
            />
          )}
          {mon.isShadow && (
            <AttributeTag
              label="SHADOW"
              backgroundColor={getTypeColor("shadow")}
              color="white"
            />
          )}
        </div>
      </div>

      <Card style={{ width: "50%", marginLeft: 10, borderTopRightRadius: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tab} style={{ position: "relative" }}>
            <Tab
              style={{ marginLeft: 10 }}
              label="Summary"
              value="summary"
              onClick={() => setTab("summary")}
            />
            <Tab
              style={{ marginLeft: 10 }}
              label="Stats"
              value="stats"
              onClick={() => setTab("stats")}
            />
            <Tab
              style={{ marginLeft: 10 }}
              label="Ribbons"
              value="ribbons"
              onClick={() => setTab("ribbons")}
            />
            <Tab
              style={{ marginLeft: 10 }}
              label="Raw"
              value="raw"
              onClick={() => setTab("raw")}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: fileTypeColors[mon.format],
                color: "white",
                fontWeight: "bold",
                borderRadius: 0,
                fontSize: 20,
              }}
            >
              {mon.format}
            </div>
          </Tabs>
        </Box>
        {tab === "summary" ? (
          <SummaryDisplay mon={mon} />
        ) : tab === "stats" ? (
          <StatsDisplay mon={mon} />
        ) : tab === "ribbons" ? (
          <RibbonsDisplay mon={mon} />
        ) : (
          <div>
            {_.range(mon.bytes.length / 16).map((row: number) => {
              return (
                <div>
                  <code>{`0x${row.toString(16).padStart(3, "0")}0\t${_.range(16)
                    .map(
                      (byte: number) =>
                        mon.bytes[
                          Math.min(row * 16 + byte, mon.bytes.length - 1)
                        ]
                          .toString(16)
                          .padStart(2, "0") + (byte % 2 ? " " : "")
                    )
                    .join("")}`}</code>
                </div>
              );
            })}
            {mon.personalityValue}
            <p>{getIVBytes()}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

const fileTypeColors: { [key: string]: string } = {
  pk2: "#bbb",
  pk3: "#9b3",
  colopkm: "#93f",
  xdpkm: "#53b",
  pk4: "#f88",
  pk5: "#484",
  pk6: "blue",
  pk7: "orange",
  pb7: "#a75",
  pk8: "#6bf",
  pb8: "#6bf",
  pa8: "#8cc",
  pk9: "#f52",
};

export default PokemonDisplay;
