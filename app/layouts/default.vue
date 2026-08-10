<template>
  <div class="site">
    <header class="site-header">
      <NuxtLink to="/" class="brand">The Lionhearts</NuxtLink>
      <nav class="nav">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/roster">Roster</NuxtLink>
        <NuxtLink to="/news">News</NuxtLink>
      </nav>
    </header>

    <slot />

    <footer class="site-footer">
      <p>The Lionhearts — Darkmoon Faire (EU)</p>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #222;
  flex-wrap: wrap;
}

.brand {
  color: #c8a96e;
  text-decoration: none;
  letter-spacing: 0.08em;
  font-size: 1.1rem;
}

.nav {
  display: flex;
  gap: 1.25rem;
}

.nav a {
  color: #888;
  text-decoration: none;
  letter-spacing: 0.05em;
}

.nav a:hover,
.nav a.router-link-active {
  color: #c8a96e;
}

.site > :slotted(*) {
  flex: 1;
}

.site-footer {
  border-top: 1px solid #222;
  padding: 1.5rem;
  text-align: center;
  color: #555;
  font-size: 0.85rem;
}
</style>
