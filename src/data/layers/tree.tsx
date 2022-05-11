/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import {
    createCumulativeConversion,
    createIndependentConversion,
    createPolynomialScaling
} from "features/conversion";
import { jsx, showIf, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createUpgrade } from "features/upgrades/upgrade";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "util/bignum";
import { render, renderRow } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { computed } from "vue";
import { format } from "util/break_eternity";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import { createBuyable } from "features/buyable";
import jacorb from "./jacorb";
import { createHotkey } from "features/hotkey";
import { globalBus } from "game/events";

const id = "p";
const layer = createLayer(id, () => {
    const name = "Tree";
    const color = "#79B5ED";

    const pres = createResource<DecimalSource>(0, "Prestige", 0);
    const boost = createResource<DecimalSource>(0, "Boosters", 0);
    const gens = createResource<DecimalSource>(0, "Generators", 0);

    const boosterBase = computed(() => {
        return new Decimal(10);
    });

    const boosterExponent = computed(() => {
        return new Decimal(0.75);
    });

    const boosterEffect = computed(() => {
        return Decimal.pow(2, boost.value);
    });

    const boosterScale = createIndependentConversion(() => ({
        scaling: createPolynomialScaling(boosterBase, boosterExponent),
        baseResource: pres,
        gainResource: boost,
        roundUpCost: true,
        buyMax: false
    }));

    const boosterCanPurchase = computed(() => {
        return Decimal.gte(boosterScale.actualGain.value, 1);
    });

    const booster = createBuyable(() => ({
        display: jsx(function () {
            return (
                <>
                    <h2>Boosters</h2>
                    <br />
                    Amount: {format(boost.value, 0)}
                    <br />
                    Boost point gain: x{format(boosterEffect.value)}
                    <br />
                    <br />
                    Next at: {format(boosterScale.nextAt.value)}
                    <br />
                    Reset for: {format(boosterScale.actualGain.value)}
                </>
            );
        }),
        onClick() {
            boosterScale.convert();
            globalBus.emit("reset", jacorb.treeNode.reset);
            jacorb.points.value = new Decimal(0);
            main.points.value = new Decimal(0);
            pres.value = new Decimal(0);
        },
        canPurchase: boosterCanPurchase,
        style() {
            return {
                width: "250px",
                height: "150px",
                background: boosterCanPurchase.value ? "#6e64c4" : ""
            };
        }
    }));

    const generatorBase = computed(() => {
        return new Decimal(10);
    });

    const generatorExponent = computed(() => {
        return new Decimal(0.75);
    });

    const generatorEffect = computed(() => {
        const base = Decimal.pow(2, gens.value).div(2);
        let multiplier = Decimal.add(main.jacorbTime.value, 10).log10();
        if (Decimal.lt(gens.value, 1)) multiplier = new Decimal(1);
        return base.mul(multiplier).max(1);
    });

    const generatorScale = createIndependentConversion(() => ({
        scaling: createPolynomialScaling(generatorBase, generatorExponent),
        baseResource: pres,
        gainResource: gens,
        roundUpCost: true,
        buyMax: false
    }));

    const generatorCanPurchase = computed(() => {
        return Decimal.gte(generatorScale.actualGain.value, 1);
    });

    const generator = createBuyable(() => ({
        display: jsx(function () {
            return (
                <>
                    <h2>Generators</h2>
                    <br />
                    Amount: {format(gens.value, 0)}
                    <br />
                    Boost point gain based on time in this Jacorb reset: x
                    {format(generatorEffect.value)}
                    <br />
                    <br />
                    Next at: {format(generatorScale.nextAt.value)}
                    <br />
                    Reset for: {format(generatorScale.actualGain.value)}
                </>
            );
        }),
        onClick() {
            generatorScale.convert();
            globalBus.emit("reset", jacorb.treeNode.reset);
            jacorb.points.value = new Decimal(0);
            main.points.value = new Decimal(0);
            pres.value = new Decimal(0);
        },
        canPurchase: generatorCanPurchase,
        style() {
            return {
                width: "250px",
                height: "150px",
                background: generatorCanPurchase.value ? "#a3d9a5" : ""
            };
        }
    }));

    const prestigeBase = computed(() => {
        return new Decimal(10);
    });

    const prestigeExponent = computed(() => {
        return new Decimal(0.5);
    });

    const prestigeEffect = computed(() => {
        return Decimal.pow(pres.value, 0.95).add(1);
    });

    const prestigeScale = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(prestigeBase, prestigeExponent),
        baseResource: jacorb.points,
        gainResource: pres,
        roundUpCost: true
    }));

    const prestige = createBuyable(() => ({
        display: jsx(function () {
            return (
                <>
                    <h2>Prestige</h2>
                    <br />
                    Amount: {format(pres.value, 0)}
                    <br />
                    Boost point gain: x{format(prestigeEffect.value)}
                    <br />
                    <br />
                    Next at: {format(prestigeScale.nextAt.value)}
                    <br />
                    Reset for: {format(prestigeScale.currentGain.value)}
                </>
            );
        }),
        onClick() {
            prestigeScale.convert();
            globalBus.emit("reset", jacorb.treeNode.reset);
            jacorb.points.value = new Decimal(0);
            main.points.value = new Decimal(0);
        },
        canPurchase: computed(() => Decimal.gte(prestigeScale.currentGain.value, 1)),
        style: { width: "250px", height: "150px" }
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        glowColor() {
            if (booster.canPurchase.value) return "#6e64c4";
            if (generator.canPurchase.value) return "#a3d9a5";
            if (prestige.canPurchase.value) return color;
            return "";
        },
        visibility() {
            return jacorb.upgrades.Release.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    addTooltip(treeNode, {
        display: "The Prestige Tree",
        pinnable: true
    });

    const hotkeyP = createHotkey(() => ({
        key: "p",
        description: "Reset for Prestige points",
        enabled() {
            return jacorb.upgrades.Release.bought.value;
        },
        onPress() {
            if (!prestige.canPurchase.value) return;
            prestige.onClick();
        }
    }));

    const hotkeyB = createHotkey(() => ({
        key: "b",
        description: "Reset for Boosters",
        enabled() {
            return jacorb.upgrades.Release.bought.value;
        },
        onPress() {
            if (!booster.canPurchase.value) return;
            booster.onClick();
        }
    }));

    const hotkeyG = createHotkey(() => ({
        key: "g",
        description: "Reset for Generators",
        enabled() {
            return jacorb.upgrades.Release.bought.value;
        },
        onPress() {
            if (!generator.canPurchase.value) return;
            generator.onClick();
        }
    }));

    const tabs = createTabFamily({
        row1: () => ({
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <Spacer height={"30px"} />
                        {render(prestige)}
                        <Spacer height={"30px"} />
                    </>
                ))
            })),
            display: "Row 1",
            glowColor() {
                if (prestige.canPurchase.value) return color;
                return "";
            }
        }),
        row2: () => ({
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <Spacer height={"30px"} />
                        {renderRow(
                            booster,
                            jsx(() => (
                                <>
                                    <Spacer width={"30px"} />
                                </>
                            )),
                            generator
                        )}
                        <Spacer height={"30px"} />
                    </>
                ))
            })),
            display: "Row 2",
            glowColor() {
                if (booster.canPurchase.value) return "#6e64c4";
                if (generator.canPurchase.value) return "#a3d9a5";
                return "";
            }
        })
    });

    const buyables = { prestige, booster, generator };
    const buyableEffects = { prestigeEffect, boosterEffect, generatorEffect };

    return {
        name,
        color,
        pres,
        boost,
        gens,
        tabs,
        hotkeyP,
        hotkeyB,
        hotkeyG,
        buyables,
        buyableEffects,
        display: jsx(() => (
            <>
                <h2>The Prestige Tree</h2>
                {render(tabs)}
            </>
        )),
        treeNode
    };
});

export default layer;
