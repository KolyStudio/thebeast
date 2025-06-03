<script>
  import "../app.css";
  import "@fontsource/saira-semi-condensed";
  import "@fontsource-variable/onest";
  import "@fontsource-variable/reddit-sans";
  import "@fontsource-variable/inter";
  import Sidebar from "../components/sidebar.svelte";
</script>

<svelte:head>
  <title>Beast.</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<div class="flex h-screen">
  <!-- Menu latéral -->
  <Sidebar />

  <!-- Zone de contenu principal -->
  <div class="flex-1 bg-[#f7f8fa] m-2.5 rounded-xl shadow p-3">
    <slot />
  </div>
</div>
