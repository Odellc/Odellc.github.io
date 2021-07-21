<script>
  import Navigation from "./Navigation.svelte";
  import router from "page";

  import Template from "./pages/ProjectTemplate.svelte";
  import Home from "./pages/Home.svelte";
  import Proficiencies from "./Proficiencies.svelte"

  let page;
  let pageInfo = {};
  let params;

  let el;

  $: console.log("Page", page);

  router("/", () => {
    page = Home;
    updatePageInfo("home", "/");
  });

  // router("/proficiencies", () => {
  //   console.log("proficiencies PATH");
  //   page = Proficiencies;
  //   updatePageInfo("proficiencies","/proficiencies");
  // });


  router("/:projectName", (context,next) => {
    params = context.params;
    // updatePageInfo("python","/python");
    next();
  },() => page = Template);


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

  const backToTop = () => {
    if (window.pageYOffset >0){
      el.style.visibility = "visible";

    }else{
      el.style.visibility = "hidden";
    }

  };


  
</script>

<svelte:window on:scroll={backToTop}></svelte:window>
<main>
  <Navigation />
  <svelte:component this={page} {params}></svelte:component>
  <div class="back-to-top">
    <a href="#home" bind:this={el}>^</a>
  </div>

</main>

<style>
.back-to-top{
  color: white;
  position: fixed;
  bottom: 10px;
  right: 10px;
  visibility: hidden;
}
 
</style>
