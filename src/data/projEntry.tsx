import Spacer from "components/layout/Spacer.vue";
import { jsx, Visibility } from "features/feature";
import { trackResetTime } from "features/reset";
import { createResource, trackBest, trackOOMPS, trackTotal } from "features/resources/resource";
import { branchedResetPropagation, createTree, GenericTree } from "features/trees/tree";
import { globalBus } from "game/events";
import { createLayer, GenericLayer } from "game/layers";
import { Persistent } from "game/persistence";
import player, { PlayerData } from "game/player";
import Decimal, { DecimalSource, format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, ComputedRef, toRaw } from "vue";
import jacorb from "./layers/jacorb";
import prestree from "./layers/tree";

/**
 * @hidden
 */
export const main = createLayer("main", () => {
    const points = createResource<DecimalSource>(10, "", 2);
    const best = trackBest(points);
    const total = trackTotal(points);

    const jacorbTime = trackResetTime(jacorb, jacorb.treeNode.reset);

    const pointGain = computed(() => {
        // eslint-disable-next-line prefer-const
        let gain = new Decimal(0);
        if (jacorb.upgrades.Beginning.bought.value) gain = new Decimal(1);
        if (jacorb.upgrades.Init.bought.value)
            gain = gain.mul(jacorb.upgradeEffects.InitEffect.value);
        if (jacorb.upgrades.Pro.bought.value)
            gain = gain.mul(jacorb.upgradeEffects.ProEffect.value);
        gain = gain.mul(prestree.buyableEffects.prestigeEffect.value);
        gain = gain.mul(prestree.buyableEffects.boosterEffect.value);
        gain = gain.mul(prestree.buyableEffects.generatorEffect.value);
        return gain;
    });
    globalBus.on("update", diff => {
        points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
    });
    const oomps = trackOOMPS(points, pointGain);

    const tree = createTree(() => ({
        nodes: [[jacorb.treeNode, prestree.treeNode]],
        /*branches() {
            return  [prestree.treeNode.visibility.value === Visibility.None ? { startNode: jacorb.treeNode, endNode: jacorb.treeNode, "stroke-width": 0 } : { startNode: jacorb.treeNode, endNode: prestree.treeNode, "stroke-width": 25 }]
        },*/
        onReset() {
            points.value = toRaw(this.resettingNode.value) === toRaw(jacorb.treeNode) ? 0 : 10;
            best.value = points.value;
            total.value = points.value;
        },
        resetPropagation: branchedResetPropagation
    })) as GenericTree;

    return {
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
                {player.devSpeed === 0 ? <div>Game Paused</div> : null}
                {player.devSpeed && player.devSpeed !== 1 ? (
                    <div>Dev Speed: {format(player.devSpeed)}x</div>
                ) : null}
                {player.offlineTime ? (
                    <div>Offline Time: {formatTime(player.offlineTime)}</div>
                ) : null}
                <div>
                    {Decimal.lt(points.value, "1e1000") ? <span>You have </span> : null}
                    <h2>{format(points.value)}</h2>
                    {Decimal.lt(points.value, "1e1e6") ? <span> points</span> : null}
                </div>
                {Decimal.gt(pointGain.value, 0) ? <div>({oomps.value})</div> : null}
                (Original game in Info)
                <Spacer />
                {render(tree)}
            </>
        )),
        jacorbTime,
        points,
        best,
        total,
        oomps,
        tree
    };
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [main, jacorb, prestree];

export const hasWon = computed(() => {
    if (Decimal.gte(prestree.boost.value, 2) && Decimal.gte(prestree.gens.value, 2)) return true;
    return false;
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
