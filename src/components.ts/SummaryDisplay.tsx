import { Card } from "@mui/material";
import { Balls } from "../consts/Balls";
import { GameOfOrigin } from "../consts/GameOfOrigin";
import { MONS_LIST } from "../consts/Mons";
import MOVES from "../consts/Moves";
import { Natures } from "../consts/Natures";
import { pkm } from "../pkm/pkm";
import { getGameLogo, getTypeColor } from "../util/utils";

const SummaryDisplay = (props: { mon: pkm }) => {
  const { mon } = props;
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "fit-content",
          padding: 10,
          marginLeft: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <img
              style={{ width: 24, height: 24 }}
              src={`https://www.serebii.net/itemdex/sprites/${(
                Balls[mon.ball] ?? ""
              )
                .replace("é", "e")
                .replace(/\s/g, "")
                .replace("(", "")
                .replace(")", "")
                .toLocaleLowerCase()}.png`}
            />
            <p style={{ fontWeight: "bold" }}>{mon.nickname}</p>
            <Card style={{ padding: "5px 10px 5px 10px", marginLeft: 10 }}>
              {mon.language}
            </Card>
          </div>
          {mon.eggMonth ? (
            <p style={{ textAlign: "left" }}>{`Egg received ${
              mon.eggMonth
                ? `on ${mon.eggMonth}/${mon.eggDay}/${mon.eggYear}`
                : ""
            } ${mon.eggLocation}.`}</p>
          ) : (
            <></>
          )}
          <p style={{ textAlign: "left" }}>{`Met ${
            mon.metMonth
              ? `on ${mon.metMonth}/${mon.metDay}/${mon.metYear},`
              : ""
          } at level ${mon.metLevel} ${mon.metLocation}${
            mon.isFatefulEncounter
              ? ", where it met its trainer in a fateful encounter"
              : ""
          }.`}</p>

          <p style={{ textAlign: "left" }}>
            Has a
            <span>
              {["A", "E", "I", "O", "U"].includes(
                Natures[mon.statNature ?? mon.nature][0]
              )
                ? "n"
                : ""}
            </span>{" "}
            <span style={{ fontWeight: "bold" }}>
              {Natures[mon.statNature ?? mon.nature]}
            </span>{" "}
            nature{" "}
            <span>
              {mon.statNature && mon.statNature !== mon.nature
                ? `(originally ${Natures[mon.nature]})`
                : ""}
            </span>
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 100,
              height: 60,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={
                getGameLogo(
                  mon.gameOfOrigin,
                  mon.dexNum,
                  mon.ribbons.includes("National") || mon.isShadow
                ) ?? ""
              }
              style={{
                width: 100,
                height: 60,
                objectFit: "contain",
                position: "absolute",
                left: 0,
                right: 0,
                opacity: 0.6,
              }}
            />
            {GameOfOrigin[mon.gameOfOrigin]?.mark && (
              <img
                src={
                  process.env.PUBLIC_URL +
                  `/origin_marks/${
                    GameOfOrigin[mon.gameOfOrigin]?.mark ?? ""
                  }.png`
                }
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "contain",
                  zIndex: 2,
                  opacity: 0.8,
                }}
              />
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        {mon.moves
          .filter((move) => !!move)
          .map((move) => {
            return (
              <Card
                style={{
                  height: 70,
                  width: 120,
                  margin: 10,
                  backgroundColor: getTypeColor(MOVES[move]?.type),
                }}
              >
                <p
                  style={{
                    marginBottom: 8,
                    marginTop: 8,
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {MOVES[move]?.name}
                </p>
                <p
                  style={{
                    marginTop: 8,
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {MOVES[move]?.pp ?? "--"} PP
                </p>
              </Card>
            );
          })}
      </div>
    </div>
  );
};
export default SummaryDisplay;
