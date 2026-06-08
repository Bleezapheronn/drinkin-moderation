import { DimensionValue, StyleSheet, Text, View, ViewStyle } from "react-native";

import type { PrimaryDrinkType } from "../context/session";

type DrinkProgressVisualProps = {
  drinkType: PrimaryDrinkType;
  fillLevel: number;
};

export function DrinkProgressVisual({ drinkType, fillLevel }: DrinkProgressVisualProps) {
  const clampedFill = Math.max(0, Math.min(1, fillLevel));
  const emptyPercent = `${(1 - clampedFill) * 100}%` as DimensionValue;
  const shape = getDrinkShape(drinkType);

  return (
    <View style={styles.wrapper}>
      <View style={styles.visualStage}>
        <View style={[styles.vessel, shape.vesselStyle]}>
          <View style={[styles.fill, { backgroundColor: shape.fillColor }]} />
          <View style={[styles.emptyOverlay, { height: emptyPercent }]} />
          <View style={styles.gloss} />
        </View>
        {shape.stem ? <View style={styles.stem} /> : null}
        {shape.base ? <View style={styles.base} /> : null}
      </View>
      <Text style={styles.typeLabel}>{shape.label}</Text>
    </View>
  );
}

type DrinkShape = {
  base: boolean;
  fillColor: string;
  label: string;
  stem: boolean;
  vesselStyle: ViewStyle;
};

function getDrinkShape(drinkType: PrimaryDrinkType): DrinkShape {
  switch (drinkType) {
    case "Beer":
      return {
        base: false,
        fillColor: "#d79a32",
        label: "Beer",
        stem: false,
        vesselStyle: styles.beerVessel,
      };
    case "Wine":
      return {
        base: true,
        fillColor: "#8f3d54",
        label: "Wine",
        stem: true,
        vesselStyle: styles.wineVessel,
      };
    case "Spirits / liquor":
      return {
        base: false,
        fillColor: "#c77c42",
        label: "Spirits",
        stem: false,
        vesselStyle: styles.shortVessel,
      };
    case "Cocktails":
      return {
        base: true,
        fillColor: "#d96f6f",
        label: "Cocktails",
        stem: true,
        vesselStyle: styles.cocktailVessel,
      };
    case "Non-alcoholic / tracking only":
      return {
        base: false,
        fillColor: "#7fb7ad",
        label: "Tracking only",
        stem: false,
        vesselStyle: styles.tallVessel,
      };
    case "Mixed":
    default:
      return {
        base: false,
        fillColor: "#6f9f91",
        label: "Mixed",
        stem: false,
        vesselStyle: styles.tallVessel,
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 10,
    minHeight: 190,
  },
  visualStage: {
    alignItems: "center",
    height: 160,
    justifyContent: "flex-end",
    width: 150,
  },
  vessel: {
    overflow: "hidden",
    borderColor: "#1f2a2e",
    borderWidth: 3,
    backgroundColor: "#f4efe6",
  },
  tallVessel: {
    width: 86,
    height: 132,
    borderRadius: 8,
  },
  beerVessel: {
    width: 96,
    height: 130,
    borderRadius: 8,
  },
  shortVessel: {
    width: 104,
    height: 86,
    borderRadius: 8,
  },
  wineVessel: {
    width: 90,
    height: 112,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  cocktailVessel: {
    width: 118,
    height: 104,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyOverlay: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#e2dfd7",
  },
  gloss: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 10,
    height: 54,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  stem: {
    width: 5,
    height: 28,
    backgroundColor: "#1f2a2e",
  },
  base: {
    width: 62,
    height: 6,
    borderRadius: 8,
    backgroundColor: "#1f2a2e",
  },
  typeLabel: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
  },
});
