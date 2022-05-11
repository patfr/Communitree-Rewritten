<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <h2>Changelog</h2>
        </template>
        <template v-slot:body>
            <details open>
                <summary>v0.3 Rows - <time>2022-11-02</time></summary>
                <ul>
                    <li class="feature">Added another tab</li>
                    <li class="feature">Added Boosters</li>
                    <li class="feature">Added Generators</li>
                    <li class="feature">Added glow to nodes</li>
                    <li class="feature">Added hotkeys</li>
                    <li class="feature">
                        Added a Changed & Deleted classes for the changelog because thepaperpilot
                        didn't
                    </li>
                    <li class="changed">Init & Programming effects</li>
                    <li class="changed">Release to be More?</li>
                    <li class="changed">Prestige effect & scaling</li>
                    <li class="changed">
                        The Prestige Tree layer now only shows if you have Release.
                    </li>
                    <li class="deleted">The More? upgrade</li>
                    <li class="deleted">The node branches</li>
                    <li class="balancing">Rebalanced the game</li>
                    <li class="balancing">Endgame: 2 Boosters & 2 Generators</li>
                </ul>
            </details>
            <details closed>
                <summary>v0.2 Tree - <time>2022-05-02</time></summary>
                <ul>
                    <li class="feature">Added The Prestige Tree layer</li>
                    <li class="feature">Added one upgrades</li>
                    <li class="balancing">Didn't care to find endgame sorry</li>
                </ul>
            </details>
            <details closed>
                <summary>v0.1 Initial release - <time>2022-05-01</time></summary>
                <ul>
                    <li class="feature">Added Jacorb layer</li>
                    <li class="feature">Added four upgrades</li>
                    <li class="balancing">Balanced till 100 Jacorb points</li>
                </ul>
            </details>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "components/Modal.vue";
import { ref } from "vue";

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});
</script>

<style scoped>
details {
    margin: 10px 0;
    padding-left: 18px;
}

summary {
    cursor: pointer;
    margin-bottom: 10px;
    margin-left: -18px;
}

ul {
    margin: var(--feature-margin) 0;
    background: var(--raised-background);
    border: 2px solid rgba(0, 0, 0, 0.125);
    padding: 5px 5px 5px 15px;
    list-style: inside;
}

li {
    margin: 8px 0;
}

li::before {
    padding: 2px 8px;
    margin-right: 8px;
    border-radius: var(--border-radius);
}

.feature::before {
    content: "Feature";
    background: var(--accent1);
}

.fix::before {
    content: "Fix";
    background: var(--accent2);
}

.balancing::before {
    content: "Balancing";
    background: var(--accent3);
}

.changed::before {
    content: "Changed";
    background: var(--accent4);
}

.deleted::before {
    content: "Deleted";
    background: var(--deleted);
}

.breaking::before {
    content: "Breaking";
    background: var(--danger);
}
</style>
