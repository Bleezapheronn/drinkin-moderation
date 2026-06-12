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
        <View style={styles.progressHalo}>
          {Array.from({ length: 26 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.haloTick,
                {
                  opacity: index / 25 <= clampedFill ? 0.9 : 0.18,
                  transform: [{ rotate: `${index * 10 - 130}deg` }, { translateY: -88 }],
                },
              ]}
            />
          ))}
        </View>
        {shape.garnish ? <Text style={styles.garnish}>{shape.garnish}</Text> : null}
        {shape.handle ? <View style={styles.beerHandle} /> : null}
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
  handle: boolean;
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
        handle: true,
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
        handle: false,
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
        handle: false,
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
        handle: false,
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
        handle: false,
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
        handle: false,
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
    minHeight: 222,
  },
  visualStage: {
    alignItems: "center",
    height: 214,
    justifyContent: "flex-end",
    width: 220,
  },
  progressHalo: {
    position: "absolute",
    top: 12,
    width: 188,
    height: 188,
    borderRadius: 94,
  },
  haloTick: {
    position: "absolute",
    top: 88,
    left: 92,
    width: 3,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#d49419",
  },
  vessel: {
    overflow: "hidden",
    borderColor: "rgba(54, 28, 18, 0.72)",
    borderWidth: 3,
    backgroundColor: "rgba(255, 250, 240, 0.62)",
    shadowColor: "#2c0710",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  beerVessel: {
    width: 104,
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
    backgroundColor: "rgba(255, 250, 240, 0.34)",
  },
  gloss: {
    position: "absolute",
    top: 18,
    left: 20,
    width: 12,
    height: 78,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.44)",
    zIndex: 3,
  },
  beerHandle: {
    position: "absolute",
    right: 36,
    bottom: 48,
    width: 52,
    height: 82,
    borderRadius: 26,
    borderColor: "rgba(54, 28, 18, 0.5)",
    borderWidth: 5,
    backgroundColor: "transparent",
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
    backgroundColor: "#2c0710",
  },
  base: {
    width: 62,
    height: 6,
    borderRadius: 8,
    backgroundColor: "#2c0710",
  },
});
