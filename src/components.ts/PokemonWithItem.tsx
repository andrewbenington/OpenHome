import { pokemon } from "../types/types";
import { getItemSprite, getMonSprite } from "../util/utils";

const PokemonWithItem = (props: { mon: pokemon; format?: string }) => {
  const { mon, format } = props;
  return (
    <div style={{ padding: 10 }}>
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
        <p>{`Item:`}</p>
        {mon.heldItem !== "None" && (
          <img
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
