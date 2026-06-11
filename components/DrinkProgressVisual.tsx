import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, ViewStyle } from "react-native";

import type { PrimaryDrinkType } from "../context/session";

type DrinkProgressVisualProps = {
  drinkType: PrimaryDrinkType;
  fillLevel: number;
};

export function DrinkProgressVisual({ drinkType, fillLevel }: DrinkProgressVisualProps) {
  const clampedFill = Math.max(0, Math.min(1, fillLevel));
  const animatedFill = useRef(new Animated.Value(clampedFill)).current;
  const shape = getDrinkShape(drinkType);
  const fillHeight = animatedFill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shape.height],
  });

  useEffect(() => {
    Animated.timing(animatedFill, {
      duration: 750,
      toValue: clampedFill,
      useNativeDriver: false,
    }).start();
  }, [animatedFill, clampedFill]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.visualStage}>
        {shape.garnish ? <Text style={styles.garnish}>{shape.garnish}</Text> : null}
        <View style={[styles.vessel, shape.vesselStyle]}>
          <View style={styles.measureLines}>
            <View style={styles.measureLine} />
            <View style={styles.measureLine} />
          </View>
          <Animated.View
            style={[
              styles.liquid,
              {
                backgroundColor: shape.fillColor,
                height: fillHeight,
              },
            ]}
          >
            <View style={[styles.liquidSurface, { backgroundColor: shape.surfaceColor }]} />
            {shape.foam ? (
              <View style={styles.foam}>
                <View style={styles.foamBubbleLarge} />
                <View style={styles.foamBubble} />
                <View style={styles.foamBubbleSmall} />
              </View>
            ) : null}
          </Animated.View>
          <View style={styles.gloss} />
        </View>
        {shape.stem ? <View style={styles.stem} /> : null}
        {shape.base ? <View style={styles.base} /> : null}
      </View>
    </View>
  );
}

type DrinkShape = {
  base: boolean;
  fillColor: string;
  foam: boolean;
  garnish: string | null;
  height: number;
  stem: boolean;
  surfaceColor: string;
  vesselStyle: ViewStyle;
};

function getDrinkShape(drinkType: PrimaryDrinkType): DrinkShape {
  switch (drinkType) {
    case "Beer":
      return {
        base: false,
        fillColor: "#d99a32",
        foam: true,
        garnish: null,
        height: 134,
        stem: false,
        surfaceColor: "#f4e5b9",
        vesselStyle: styles.beerVessel,
      };
    case "Wine":
      return {
        base: true,
        fillColor: "#8f3d54",
        foam: false,
        garnish: null,
        height: 116,
        stem: true,
        surfaceColor: "#b65a72",
        vesselStyle: styles.wineVessel,
      };
    case "Spirits / liquor":
      return {
        base: false,
        fillColor: "#c77c42",
        foam: false,
        garnish: null,
        height: 88,
        stem: false,
        surfaceColor: "#dfac72",
        vesselStyle: styles.shortVessel,
      };
    case "Cocktails":
      return {
        base: true,
        fillColor: "#d96f6f",
        foam: false,
        garnish: "slice",
        height: 104,
        stem: true,
        surfaceColor: "#ee9a8f",
        vesselStyle: styles.cocktailVessel,
      };
    case "Non-alcoholic / tracking only":
      return {
        base: false,
        fillColor: "#6fb5c8",
        foam: false,
        garnish: null,
        height: 132,
        stem: false,
        surfaceColor: "#a9d7e3",
        vesselStyle: styles.waterVessel,
      };
    case "Mixed":
    default:
      return {
        base: false,
        fillColor: "#6f9f91",
        foam: false,
        garnish: null,
        height: 132,
        stem: false,
        surfaceColor: "#a6cdbf",
        vesselStyle: styles.soloCupVessel,
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    minHeight: 190,
  },
  visualStage: {
    alignItems: "center",
    height: 180,
    justifyContent: "flex-end",
    width: 160,
  },
  vessel: {
    overflow: "hidden",
    borderColor: "#1f2a2e",
    borderWidth: 3,
    backgroundColor: "#f4efe6",
  },
  beerVessel: {
    width: 98,
    height: 134,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  soloCupVessel: {
    width: 96,
    height: 132,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  waterVessel: {
    width: 88,
    height: 132,
    borderRadius: 8,
  },
  shortVessel: {
    width: 110,
    height: 88,
    borderRadius: 8,
  },
  wineVessel: {
    width: 92,
    height: 116,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  cocktailVessel: {
    width: 122,
    height: 104,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  liquid: {
    left: 0,
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  liquidSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  measureLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
    paddingLeft: 12,
    zIndex: 2,
  },
  measureLine: {
    width: 22,
    height: 2,
    borderRadius: 4,
    backgroundColor: "rgba(31, 42, 46, 0.16)",
  },
  gloss: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 10,
    height: 58,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.52)",
    zIndex: 3,
  },
  foam: {
    position: "absolute",
    top: 5,
    left: 10,
    right: 10,
    height: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  foamBubbleLarge: {
    width: 22,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#f7edcf",
  },
  foamBubble: {
    width: 16,
    height: 11,
    borderRadius: 12,
    backgroundColor: "#f7edcf",
  },
  foamBubbleSmall: {
    width: 12,
    height: 9,
    borderRadius: 10,
    backgroundColor: "#f7edcf",
  },
  garnish: {
    position: "absolute",
    top: 26,
    right: 22,
    zIndex: 4,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#e3c85f",
    color: "#7b6031",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 3,
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
});
