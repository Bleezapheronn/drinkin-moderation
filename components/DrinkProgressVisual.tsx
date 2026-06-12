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
        {shape.handle ? (
          <View style={styles.beerHandleOuter}>
            <View style={styles.beerHandleInner} />
          </View>
        ) : null}
        <View style={styles.vesselShadow} />
        <View style={[styles.vessel, shape.vesselStyle]}>
          <View style={styles.rim} />
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
                <View style={styles.foamBubbleWide} />
              </View>
            ) : null}
          </Animated.View>
          <View style={styles.gloss} />
          <View style={styles.sideGloss} />
          <View style={styles.baseGlass} />
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
        fillColor: "#d88b08",
        foam: true,
        garnish: null,
        handle: true,
        height: 134,
        stem: false,
        surfaceColor: "#f8d77b",
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
    top: 10,
    width: 192,
    height: 192,
    borderRadius: 96,
  },
  haloTick: {
    position: "absolute",
    top: 90,
    left: 94,
    width: 3,
    height: 17,
    borderRadius: 3,
    backgroundColor: "#d69a18",
  },
  vessel: {
    overflow: "hidden",
    borderColor: "rgba(65, 43, 31, 0.72)",
    borderWidth: 3,
    backgroundColor: "rgba(255, 249, 237, 0.7)",
  },
  beerVessel: {
    width: 108,
    height: 136,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
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
    height: 10,
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
    left: 18,
    width: 12,
    height: 82,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    zIndex: 3,
  },
  sideGloss: {
    position: "absolute",
    top: 18,
    right: 10,
    width: 8,
    height: 92,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    zIndex: 3,
  },
  baseGlass: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    height: 15,
    borderRadius: 12,
    backgroundColor: "rgba(47, 6, 18, 0.16)",
    zIndex: 3,
  },
  rim: {
    position: "absolute",
    top: 5,
    left: 8,
    right: 8,
    height: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    zIndex: 4,
  },
  vesselShadow: {
    position: "absolute",
    bottom: -4,
    width: 118,
    height: 18,
    borderRadius: 60,
    backgroundColor: "rgba(47, 6, 18, 0.16)",
  },
  beerHandleOuter: {
    position: "absolute",
    right: 28,
    bottom: 45,
    width: 58,
    height: 90,
    borderRadius: 30,
    borderColor: "rgba(65, 43, 31, 0.58)",
    borderWidth: 5,
    backgroundColor: "rgba(255, 249, 237, 0.46)",
  },
  beerHandleInner: {
    position: "absolute",
    top: 15,
    left: 12,
    right: 12,
    bottom: 15,
    borderRadius: 24,
    backgroundColor: "#fff8eb",
  },
  foam: {
    position: "absolute",
    top: 5,
    left: 7,
    right: 7,
    height: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  foamBubbleLarge: {
    width: 25,
    height: 16,
    borderRadius: 14,
    backgroundColor: "#fff3d3",
  },
  foamBubble: {
    width: 18,
    height: 13,
    borderRadius: 12,
    backgroundColor: "#fff7df",
  },
  foamBubbleSmall: {
    width: 13,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#fff3d3",
  },
  foamBubbleWide: {
    width: 28,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#fff7df",
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
