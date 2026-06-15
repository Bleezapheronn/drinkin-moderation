import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import type { PrimaryDrinkType } from "../context/session";

type BeerLayerAssets = {
  foam?: ImageSourcePropType;
  glass?: ImageSourcePropType;
  liquid?: ImageSourcePropType;
  mug?: ImageSourcePropType;
};

const beerLayerAssets: BeerLayerAssets = {
  foam: require("../assets/illustrations/beer-foam-top.png"),
  liquid: require("../assets/illustrations/beer-liquid-fill.png"),
  mug: require("../assets/illustrations/beer-mug-empty.png"),
};

const beerCanvas = {
  height: 190,
  innerHeight: 134,
  innerWidth: 112,
  innerX: 30,
  innerY: 41,
  width: 176,
};

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
        <ProgressHalo clampedFill={clampedFill} />
        {drinkType === "Beer" ? (
          <LayeredBeerVisual clampedFill={clampedFill} fillHeight={fillHeight} />
        ) : (
          <NativeDrinkVisual fillHeight={fillHeight} shape={shape} />
        )}
      </View>
    </View>
  );
}

type ProgressHaloProps = {
  clampedFill: number;
};

function ProgressHalo({ clampedFill }: ProgressHaloProps) {
  return (
    <View style={styles.progressHalo}>
      {Array.from({ length: 34 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.haloTick,
            {
              opacity: index / 33 <= clampedFill ? 0.92 : 0.18,
              transform: [{ rotate: `${index * 7.5 - 126}deg` }, { translateY: -91 }],
            },
          ]}
        />
      ))}
    </View>
  );
}

type NativeDrinkVisualProps = {
  fillHeight: Animated.AnimatedInterpolation<string | number>;
  shape: DrinkShape;
};

type LayeredBeerVisualProps = Pick<NativeDrinkVisualProps, "fillHeight"> & {
  clampedFill: number;
};

function LayeredBeerVisual({ clampedFill, fillHeight }: LayeredBeerVisualProps) {
  if (beerLayerAssets.mug && beerLayerAssets.liquid && beerLayerAssets.foam) {
    return <AssetBeerVisual clampedFill={clampedFill} fillHeight={fillHeight} />;
  }

  return <NativeLayeredBeerVisual fillHeight={fillHeight} />;
}

function AssetBeerVisual({ clampedFill, fillHeight }: LayeredBeerVisualProps) {
  const foamTranslateY = fillHeight.interpolate({
    inputRange: [0, beerCanvas.innerHeight],
    outputRange: [beerCanvas.innerHeight, 0],
  });

  return (
    <>
      <View style={styles.vesselShadow} />
      <View style={styles.assetBeerStage}>
        <View style={styles.assetBeerLiquidViewport}>
          <Animated.View style={[styles.assetBeerFillStack, { height: fillHeight }]}>
            <Image
              accessibilityIgnoresInvertColors
              source={beerLayerAssets.liquid}
              style={styles.assetBeerLiquid}
            />
          </Animated.View>
        </View>
        <Animated.View
          style={[
            styles.assetBeerFoamLayer,
            {
              opacity: clampedFill <= 0.04 ? 0 : 1,
              transform: [{ translateY: foamTranslateY }],
            },
          ]}
        >
          <Image accessibilityIgnoresInvertColors source={beerLayerAssets.foam} style={styles.assetBeerFoam} />
        </Animated.View>
        <Image
          accessibilityIgnoresInvertColors
          source={beerLayerAssets.mug}
          style={styles.assetBeerMug}
        />
        {beerLayerAssets.glass ? (
          <Image
            accessibilityIgnoresInvertColors
            source={beerLayerAssets.glass}
            style={styles.layeredBeerGlassAsset}
          />
        ) : null}
      </View>
    </>
  );
}

function NativeLayeredBeerVisual({ fillHeight }: Pick<NativeDrinkVisualProps, "fillHeight">) {
  return (
    <>
      <View style={styles.vesselShadow} />
      <View style={styles.beerHandleBack}>
        <View style={styles.beerHandleCutout} />
        <View style={styles.beerHandleHighlight} />
      </View>
      <View style={styles.layeredBeerMug}>
        <View style={styles.layeredBeerBackTint} />
        <Animated.View style={[styles.layeredBeerLiquidClip, { height: fillHeight }]}>
          {beerLayerAssets.foam ? (
            <Image
              accessibilityIgnoresInvertColors
              source={beerLayerAssets.foam}
              style={styles.layeredBeerFoamAsset}
            />
          ) : (
            <View style={styles.layeredBeerFoam}>
            <View style={styles.foamCrownLarge} />
            <View style={styles.foamCrownMedium} />
            <View style={styles.foamCrownSmall} />
            <View style={styles.foamCrownWide} />
            </View>
          )}
          <View style={styles.layeredBeerLiquid}>
            <View style={[styles.bubble, styles.bubbleOne]} />
            <View style={[styles.bubble, styles.bubbleTwo]} />
            <View style={[styles.bubble, styles.bubbleThree]} />
            <View style={[styles.bubble, styles.bubbleFour]} />
            <View style={[styles.bubble, styles.bubbleFive]} />
          </View>
        </Animated.View>
        <View style={styles.layeredBeerRim} />
        <View style={styles.layeredBeerLeftWall} />
        <View style={styles.layeredBeerRightWall} />
        <View style={styles.layeredBeerBase} />
        <View style={styles.layeredBeerMainHighlight} />
        <View style={styles.layeredBeerSideHighlight} />
        {beerLayerAssets.glass ? (
          <Image
            accessibilityIgnoresInvertColors
            source={beerLayerAssets.glass}
            style={styles.layeredBeerGlassAsset}
          />
        ) : null}
      </View>
    </>
  );
}

function NativeDrinkVisual({ fillHeight, shape }: NativeDrinkVisualProps) {
  return (
    <>
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
    </>
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
    minHeight: 246,
  },
  visualStage: {
    alignItems: "center",
    height: 238,
    justifyContent: "flex-end",
    width: 252,
  },
  progressHalo: {
    position: "absolute",
    top: 6,
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  haloTick: {
    position: "absolute",
    top: 99,
    left: 103,
    width: 3,
    height: 16,
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
  assetBeerStage: {
    alignItems: "center",
    height: beerCanvas.height,
    justifyContent: "flex-end",
    width: beerCanvas.width,
  },
  assetBeerMug: {
    position: "absolute",
    bottom: 0,
    width: beerCanvas.width,
    height: beerCanvas.height,
    resizeMode: "contain",
    zIndex: 6,
  },
  assetBeerLiquidViewport: {
    position: "absolute",
    left: beerCanvas.innerX,
    top: beerCanvas.innerY,
    width: beerCanvas.innerWidth,
    height: beerCanvas.innerHeight,
    overflow: "hidden",
    zIndex: 2,
  },
  assetBeerFillStack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  assetBeerLiquid: {
    position: "absolute",
    left: -beerCanvas.innerX,
    bottom: -(beerCanvas.height - beerCanvas.innerY - beerCanvas.innerHeight),
    width: beerCanvas.width,
    height: beerCanvas.height,
    resizeMode: "contain",
  },
  assetBeerFoamLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: beerCanvas.width,
    height: beerCanvas.height,
    zIndex: 4,
  },
  assetBeerFoam: {
    width: beerCanvas.width,
    height: beerCanvas.height,
    resizeMode: "contain",
  },
  hiddenLayer: {
    opacity: 0,
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
  layeredBeerMug: {
    width: 116,
    height: 144,
    overflow: "hidden",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    borderColor: "rgba(64, 43, 31, 0.72)",
    borderWidth: 3,
    backgroundColor: "rgba(255, 250, 240, 0.42)",
  },
  layeredBeerBackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 248, 235, 0.34)",
  },
  layeredBeerLiquidClip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  layeredBeerLiquid: {
    ...StyleSheet.absoluteFillObject,
    top: 12,
    backgroundColor: "#d88b08",
  },
  layeredBeerFoam: {
    position: "absolute",
    top: -1,
    left: 6,
    right: 6,
    height: 26,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  layeredBeerFoamAsset: {
    position: "absolute",
    top: -3,
    left: 4,
    right: 4,
    height: 30,
    resizeMode: "contain",
    zIndex: 3,
  },
  layeredBeerGlassAsset: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "contain",
    zIndex: 8,
  },
  foamCrownLarge: {
    width: 32,
    height: 20,
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: "#fff4d2",
  },
  foamCrownMedium: {
    width: 26,
    height: 17,
    marginLeft: -5,
    borderRadius: 16,
    backgroundColor: "#fff8e5",
  },
  foamCrownSmall: {
    width: 20,
    height: 14,
    marginLeft: -4,
    marginTop: 3,
    borderRadius: 14,
    backgroundColor: "#fff2cf",
  },
  foamCrownWide: {
    flex: 1,
    height: 18,
    marginLeft: -6,
    marginTop: 5,
    borderRadius: 18,
    backgroundColor: "#fff7df",
  },
  layeredBeerRim: {
    position: "absolute",
    top: 7,
    left: 8,
    right: 8,
    height: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.54)",
    zIndex: 5,
  },
  layeredBeerLeftWall: {
    position: "absolute",
    top: 12,
    bottom: 10,
    left: 7,
    width: 9,
    borderRadius: 8,
    backgroundColor: "rgba(55, 35, 22, 0.18)",
    zIndex: 4,
  },
  layeredBeerRightWall: {
    position: "absolute",
    top: 12,
    bottom: 10,
    right: 7,
    width: 9,
    borderRadius: 8,
    backgroundColor: "rgba(55, 35, 22, 0.15)",
    zIndex: 4,
  },
  layeredBeerBase: {
    position: "absolute",
    left: 11,
    right: 11,
    bottom: 8,
    height: 16,
    borderRadius: 14,
    backgroundColor: "rgba(47, 6, 18, 0.16)",
    zIndex: 5,
  },
  layeredBeerMainHighlight: {
    position: "absolute",
    top: 20,
    bottom: 21,
    left: 24,
    width: 13,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    zIndex: 6,
  },
  layeredBeerSideHighlight: {
    position: "absolute",
    top: 25,
    bottom: 28,
    right: 20,
    width: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 6,
  },
  beerHandleBack: {
    position: "absolute",
    right: 30,
    bottom: 47,
    width: 63,
    height: 94,
    borderRadius: 34,
    borderColor: "rgba(64, 43, 31, 0.58)",
    borderWidth: 5,
    backgroundColor: "rgba(255, 250, 240, 0.36)",
  },
  beerHandleCutout: {
    position: "absolute",
    top: 15,
    left: 13,
    right: 13,
    bottom: 15,
    borderRadius: 26,
    backgroundColor: "#fff8eb",
  },
  beerHandleHighlight: {
    position: "absolute",
    top: 12,
    right: 8,
    width: 9,
    height: 58,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.32)",
  },
  bubble: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 226, 146, 0.64)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  bubbleOne: {
    left: 25,
    top: 24,
  },
  bubbleTwo: {
    right: 30,
    top: 36,
    width: 5,
    height: 5,
  },
  bubbleThree: {
    left: 55,
    top: 58,
  },
  bubbleFour: {
    right: 42,
    bottom: 30,
  },
  bubbleFive: {
    left: 38,
    bottom: 46,
    width: 5,
    height: 5,
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
