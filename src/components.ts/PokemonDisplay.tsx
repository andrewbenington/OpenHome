import { Box, Card, Tab, Tabs } from "@mui/material";
import _ from "lodash";
import { useEffect, useState } from "react";
import { MONS_LIST } from "../consts/Mons";
import Types from "../consts/Types";
import { pkm } from "../pkm/pkm";
import { getTypeColor } from "../util/utils";
import AttributeRow from "./AttributeRow";
import AttributeTag from "./AttributeTag";
import PokemonWithItem from "./PokemonWithItem";
import RibbonsDisplay from "./RibbonsDisplay";
import StatsDisplay from "./StatsDisplay";
import SummaryDisplay from "./SummaryDisplay";

const getTypes = (mon: pkm) => {
  let types = MONS_LIST[mon.dexNum].formes[mon.formNum]?.types;
  if (mon.format === "pk1" && (mon.dexNum === 81 || mon.dexNum === 82)) {
    types = ["Electric"]
  } else if (
    ["pk1", "pk2", "pk3", "colopkm", "xdpkm", "pk4", "pk5"].includes(mon.format)
  ) {
    if (types.includes("Fairy")) {
      if (types.length === 1 || types.includes("Flying")) {
        types = types.map((type) => (type === "Fairy" ? "Normal" : type));
      } else if (types[0] === "Fairy") {
        return [types[1]];
      } else {
        return [types[0]];
      }
    }
  }
  return types;
};

const PokemonDislay = (props: { mon: pkm; propTab: string }) => {
  const { mon, propTab } = props;
  const [tab, setTab] = useState("summary");
  useEffect(() => {
    setTab(propTab);
  }, [propTab]);
  return (
    <Card style={{ display: "flex", flexDirection: "row", padding: 20 }}>
      <PokemonWithItem mon={mon} format={mon.format} />
      <div style={{ textAlign: "left", width: "30%" }}>
        <AttributeRow
          label="Name"
          value={`${MONS_LIST[mon.dexNum]?.formes[mon.formNum]?.formeName}`}
        />
        <AttributeRow label="Dex No." value={`${mon.dexNum}`} />
        <AttributeRow label="Type">
          {getTypes(mon)?.map((type) => (
            <img
              style={{ height: 24, width: 24, marginRight: 5 }}
              src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${type.toLocaleLowerCase()}.png`}
            />
          ))}
        </AttributeRow>
        {mon.teraTypeOriginal && mon.teraTypeOverride && (
          <AttributeRow label="Tera Type">
            <img
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
                  style={{ height: 24, width: 24, marginRight: 5 }}
                  src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${Types[
                    mon.teraTypeOriginal
                  ]?.toLocaleLowerCase()}.png`}
                />
                <p>)</p>
              </>
            )}
          </AttributeRow>
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
        {mon.dynamaxLevel != undefined && (
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

      <Card style={{ width: "50%", marginLeft: 10 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tab}>
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
          </div>
        )}
      </Card>
    </Card>
  );
};

export default PokemonDislay;
