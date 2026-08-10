<script setup lang="ts">
// Guild + raid rules, adapted from the Discord server rules.
const guildRules = [
  'Use common sense.',
  'Do not be rude, mean or creepy towards others. If any member makes you feel uncomfortable, please contact a GM or Royal Advisor.',
  'No spam.',
  'No inappropriate images or videos. We have a NSFW channel, but please use your brain.',
  'Use text and voice channels for their intended purpose.',
  'No politics or controversial topics.',
]

const raidRules = [
  'Sign-up for raids is always in the calendar. Please sign up as tentative if you are uncertain.',
  'If you join the raid on a character that is locked to other raids, you will not be allowed to raid on that character.',
  'If you are uncertain about tactics, speak up — we would much rather go over tactics than wipe on bosses.',
  'You must be in voice chat if you are joining a raid. You may be muted if you do not want to speak.',
  'You are not allowed to stream the raid without speaking to a GM or Royal Advisor first.',
  'You are not allowed to raid while drunk or affected by any drugs.',
]
</script>

<template>
  <main class="rules">
    <header class="page-head">
      <p class="server">The Lionhearts</p>
      <h1>Guild Rules</h1>
    </header>

    <section class="block">
      <h2 class="section-title">Guild rules</h2>
      <ol class="rule-list">
        <li v-for="rule in guildRules" :key="rule">{{ rule }}</li>
      </ol>
    </section>

    <section class="block">
      <h2 class="section-title">Raid rules</h2>
      <ol class="rule-list">
        <li v-for="rule in raidRules" :key="rule">{{ rule }}</li>
      </ol>
    </section>

    <p class="warning" role="note">
      <span class="warn-mark" aria-hidden="true">‼️</span>
      Breaking the rules too many times will get you banned from the Discord and
      the guild. Breaking the raid rules will ban you from raiding.
    </p>

    <p class="questions">
      Got a question about the rules, or a suggestion for improving the Discord
      or the guild? Please tell us.
    </p>
  </main>
</template>

<style scoped>
.rules {
  max-width: 780px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 1rem;
}

.page-head {
  text-align: center;
  margin-bottom: 2.5rem;
}

.page-head .server {
  margin-bottom: 0.6rem;
}

.block {
  margin-top: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--gold);
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.section-title::before {
  content: "◆";
  color: var(--gold-deep);
  font-size: 0.6rem;
}

.rule-list {
  list-style: none;
  counter-reset: rule;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-list li {
  counter-increment: rule;
  position: relative;
  padding: 0.85rem 1rem 0.85rem 3rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Gold numbered marker in place of the default list number. */
.rule-list li::before {
  content: counter(rule);
  position: absolute;
  left: 0.85rem;
  top: 0.8rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gold-deep);
  border-radius: 50%;
  color: var(--gold);
  font-size: 0.85rem;
}

.warning {
  margin-top: 2.5rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--border-strong);
  border-left: 3px solid var(--gold);
  border-radius: var(--radius);
  background: rgba(200, 169, 110, 0.06);
  color: var(--text);
  line-height: 1.6;
}

.warn-mark {
  margin-right: 0.3rem;
}

.questions {
  margin-top: 1.5rem;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
