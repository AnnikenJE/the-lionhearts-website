<template>
  <main class="home">
    <h1>The Lionhearts</h1>
    <p class="server">Darkmoon Faire — EU</p>
    <p class="status">Website under construction</p>
    <NuxtLink to="/roster" class="roster-link">View roster →</NuxtLink>
  </main>
</template>

<style scoped>
/* Full-screen centered hero. Centering lives here (not on body) so other
   pages like the roster can lay out as normal top-aligned documents. */
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
