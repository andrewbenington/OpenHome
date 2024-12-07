import lodash from "lodash";
import { COLOPKM, PK3, XDPKM } from "pokemon-files";
import { PKMInterface } from "../types/interfaces";
import { Styles } from "../types/types";
import { getPublicImageURL } from "../images/images";

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  starRow: {
    backgroundColor: "#666",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
  },
  star: {
    height: 30,
    objectFit: "contain",
  },
} as Styles;

interface SheenStarsProps {
  mon: PKMInterface;
}

const getSheenStars = (mon: PKMInterface) => {
  if (!mon.contest) {
    return 0;
  }
  if (mon instanceof PK3 || mon instanceof COLOPKM || mon instanceof XDPKM) {
    return mon.contest.sheen === 255
      ? 10
      : Math.floor(mon.contest.sheen / 29) + 1;
  }
  if (mon.contest.sheen < 22) {
    return 0;
  }
  if (mon.contest.sheen < 43) {
    return 1;
  }
  if (mon.contest.sheen < 64) {
    return 2;
  }
  if (mon.contest.sheen < 86) {
    return 3;
  }
  if (mon.contest.sheen < 107) {
    return 4;
  }
  if (mon.contest.sheen < 128) {
    return 5;
  }
  if (mon.contest.sheen < 150) {
    return 6;
  }
  if (mon.contest.sheen < 171) {
    return 7;
  }
  if (mon.contest.sheen < 192) {
    return 8;
  }
  if (mon.contest.sheen < 214) {
    return 9;
  }
  if (mon.contest.sheen < 235) {
    return 10;
  }
  if (mon.contest.sheen < 255) {
    return 11;
  }
  return 12;
};

const SheenStars = (props: SheenStarsProps) => {
  const { mon } = props;

  return (
    <div style={styles.container}>
      <div>Sheen:</div>
      <div
        style={{
          ...styles.starRow,
          width:
            mon instanceof PK3 || mon instanceof COLOPKM || mon instanceof XDPKM
              ? 300
              : 360,
        }}
      >
        {lodash.range(getSheenStars(mon)).map((level: number) => (
          <img
            key={`sheen_star_${level}`}
            alt={`sheen star ${level}`}
            src={getPublicImageURL("icons/Sheen.gif")}
            style={styles.star}
          />
        ))}
      </div>
      <div>({mon.contest?.sheen ?? "--"})</div>
    </div>
  );
};

export default SheenStars;
