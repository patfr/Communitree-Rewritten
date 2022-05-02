/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
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

const id = "p";
const layer = createLayer(id, () => {
    const name = "Tree";
    const color = "#79B5ED";

    const pres = createResource<DecimalSource>(0, "Prestige", 0);

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color
    }));

    addTooltip(treeNode, {
        display: "The Prestige Tree",
        pinnable: true
    });

    const prestigeBase = computed(() => {
        return new Decimal(20);
    });

    const prestigeExponent = computed(() => {
        return new Decimal(0.5);
    });

    const prestigeEffect = computed(() => {
        return Decimal.add(pres.value, 1).pow(0.75);
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
            if (Decimal.gte(prestigeScale.currentGain.value, 1)) {
                pres.value = Decimal.add(pres.value, prestigeScale.currentGain.value);
                jacorb.points.value = new Decimal(0);
                main.points.value = new Decimal(0);
                console.log(format(pres.value));
            }
        },
        canClick: true,
        canPurchase: computed(() => Decimal.gte(prestigeScale.currentGain.value, 1)),
        style: { width: "250px", height: "150px" }
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
                /*if (
                ) return "blue";*/
                return "";
            }
        })
    });

    const buyables = { prestige };
    const buyableEffects = { prestigeEffect };

    return {
        name,
        color,
        pres,
        tabs,
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
