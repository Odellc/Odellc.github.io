<script>
  import Navigation from "./Navigation.svelte";
  import router from "page";

  import Python from "./pages/Python.svelte";
  import Home from "./pages/Home.svelte";
  import Proficiencies from "./Proficiencies.svelte"

  let page;
  let pageInfo = {};

  $: console.log("Page", page);

  router("/", () => {
    page = Home;
    updatePageInfo("home", "/");
  });

  router("/python", () => {
    console.log("PYTHON PATH");
    page = Python;
    updatePageInfo("python","/python");
  });

  router("/proficiencies", () => {
    console.log("proficiencies PATH");
    page = Proficiencies;
    updatePageInfo("proficiencies","/proficiencies");
  });

  router("/*", () => {
    console.log("my page does not match");
  });

  router.start();

  function updatePageInfo(name, path) {
    pageInfo = {
      name: name,
      path: path
    };
  }


  
</script>

<main>
  <Navigation />
  <svelte:component this={page}></svelte:component>

</main>

<style>
 
</style>
