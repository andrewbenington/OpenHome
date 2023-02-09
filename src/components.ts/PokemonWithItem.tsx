import { pkm } from "../pkm/pkm";
import { getMonSprite, getItemSprite } from "../util/PokemonSprite";

const PokemonWithItem = (props: { mon: pkm; format?: string; style: any }) => {
  const { mon, format, style } = props;
  return (
    <div style={{ padding: 10, ...style }}>
      <div
        style={{
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          alt="pokemon sprite"
          style={{
            maxWidth: 100,
            maxHeight: 100,
            transform: "scale(2)",
            imageRendering: "pixelated",
            objectFit: "contain",
          }}
          src={getMonSprite(mon, format ?? "pk9")}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p>{`Level ${mon.level}`}</p>
        <p>{mon.gender === 2 ? "" : mon.gender === 1 ? "♀" : "♂"}</p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p>{`${mon.exp} EXP`}</p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p>{`Item:`}</p>
        {mon.heldItem !== "None" && (
          <img
            alt="item icon"
            src={getItemSprite(mon.heldItem)}
            style={{ width: 24, height: 24 }}
          />
        )}
        <p>{mon.heldItem}</p>
      </div>
    </div>
  );
};
export default PokemonWithItem;
