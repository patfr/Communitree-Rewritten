/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createReset, trackResetTime } from "features/reset";
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
import { createHotkey } from "features/hotkey";
import { globalBus } from "game/events";

const id = "j";
const layer = createLayer(id, () => {
    const name = "Jacorb";
    const color = "#8932DA";
    const points = createResource<DecimalSource>(0, "Jacorb points");

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode,
        onClick() {
            globalBus.emit("reset", reset);
        }
    }));

    const Beginning = createUpgrade(() => ({
        display: {
            title: "Beginning.",
            description: "Gain 1 point per second."
        },
        cost: 1,
        resource: points
    }));

    const InitEffect = computed(() => {
        return Decimal.add(points.value, 2).log2().add(1);
    });

    const Init = createUpgrade(() => ({
        display: {
            title: "Init.",
            description: "Jacorb points boost point gain.",
            effectDisplay: jsx(() => <>x{format(InitEffect.value)}</>)
        },
        visibility: computed(() => {
            return Beginning.bought.value ? Visibility.Visible : Visibility.None;
        }),
        cost: 1,
        resource: points
    }));

    const ProEffect = computed(() => {
        return Decimal.add(main.points.value, 5).log(5);
    });

    const Pro = createUpgrade(() => ({
        display: {
            title: "Programming.",
            description: "Points boost point gain.",
            effectDisplay: jsx(() => <>x{format(ProEffect.value)}</>)
        },
        visibility: computed(() => {
            return Init.bought.value ? Visibility.Visible : Visibility.None;
        }),
        cost: 3,
        resource: points
    }));

    const Release = createUpgrade(() => ({
        display: {
            title: "Release.",
            description: "Unlock something new."
        },
        visibility: computed(() => {
            return Pro.bought.value ? Visibility.Visible : Visibility.None;
        }),
        cost: 5,
        resource: points
    }));

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(10, 0.5),
        baseResource: main.points,
        gainResource: points,
        roundUpCost: true
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset,
        glowColor() {
            if (Beginning.canPurchase.value) return "red";
            if (Init.canPurchase.value) return "red";
            if (Pro.canPurchase.value) return "red";
            if (Release.canPurchase.value) return "red";
            if (Decimal.gt(conversion.currentGain.value, points.value)) return "#afafaf";
            return "";
        }
    }));

    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    const hotkeyJ = createHotkey(() => ({
        key: "j",
        description: "Reset for Jacorb points",
        onPress() {
            if (!resetButton.canClick.value) return;
            resetButton.conversion.convert();
            globalBus.emit("reset", reset);
            resetButton.tree.reset(treeNode);
        }
    }));

    const upgrades = { Beginning, Init, Pro, Release };
    const upgradeEffects = { InitEffect, ProEffect };

    return {
        name,
        color,
        points,
        upgrades,
        upgradeEffects,
        hotkeyJ,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}
                <Spacer height={"30px"} />
                {renderRow(upgrades.Beginning, upgrades.Init, upgrades.Pro, upgrades.Release)}
            </>
        )),
        treeNode
    };
});

export default layer;
