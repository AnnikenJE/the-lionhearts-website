<template>
  <div class="site">
    <header class="site-header">
      <div class="header-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-mark" aria-hidden="true">◆</span>
          The Lionhearts
        </NuxtLink>
        <nav class="nav" aria-label="Primary">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/roster">Roster</NuxtLink>
          <NuxtLink to="/news">News</NuxtLink>
        </nav>
      </div>
    </header>

    <slot />

    <footer class="site-footer">
      <div class="footer-inner">
        <p class="footer-heading">Quick links</p>
        <LinkGrid />
        <p class="colophon">
          The Lionhearts <span aria-hidden="true">·</span> Darkmoon Faire (EU)
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site > :slotted(*) {
  flex: 1;
}

/* Sticky, faintly translucent header so content scrolls under it. */
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 15, 15, 0.82);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--gold);
  text-decoration: none;
  letter-spacing: 0.1em;
  font-size: 1.15rem;
}

.brand-mark {
  color: var(--gold-deep);
  font-size: 0.7rem;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.nav a {
  position: relative;
  color: var(--text-muted);
  text-decoration: none;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.82rem;
  padding: 0.2rem 0;
  transition: color 0.15s ease;
}

/* Animated gold underline that grows from the centre on hover/active. */
.nav a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background: var(--gold);
  transform: scaleX(0);
  transition: transform 0.18s ease;
}

.nav a:hover,
.nav a.router-link-active {
  color: var(--gold);
}

.nav a.router-link-active::after,
.nav a:hover::after {
  transform: scaleX(1);
}

.site-footer {
  border-top: 1px solid var(--border);
  margin-top: 3rem;
  padding: 2.5rem 1.5rem;
  background: rgba(0, 0, 0, 0.25);
}

.footer-inner {
  max-width: var(--maxw);
  margin: 0 auto;
  text-align: center;
}

.footer-heading {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.75rem;
  margin-bottom: 1.1rem;
}

.colophon {
  margin-top: 1.6rem;
  color: var(--text-dim);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}
</style>
