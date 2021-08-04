<script>
  import projects from "./projects.js";
  import { getHref } from "../util/util.js";
  import { onMount } from "svelte";

  export let params;
  let projectInfo = {};

  onMount(async () => {
    console.log("Params", params);

    for (let i = 0; i < projects.length; i++) {
      let name = getHref(projects[i].name).slice(1);

      if (params.projectName == name) {
        projectInfo = projects[i];
      }
    }
  });

  $: console.log("params:", projectInfo);
</script>

<div class="project-template">
  <h1>{projectInfo.name}</h1>

  <h5>{projectInfo.tools}</h5>

  <div class="intro">
    <p>{projectInfo.summary}</p>

  </div>

  <h3>Image</h3>

  {#each projectInfo.images as images_to_display}
    <div>
      <img src={images_to_display} alt="Image" width="300" height="300" />
    </div>
  {/each}

</div>

<style>
  .intro {
    display: inline-block;
  }

  img {
    float: left;
    shape-outside: ellipse();
  }

  .project-template {
    display: flex;
    flex-direction: column;
    padding: 25px;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    margin-top: 100px;
  }

  h1 {
    color: white;
  }

  h3 {
    display: flex;
    width: 100%;
    color: #99b946;
    /* text-align: center; */
    justify-content: center;
    align-items: center;
    padding: 0 0 0.4em 0;
    margin: 0 0 1em 0;
    border-bottom: 1px solid white;
    font-size: 2em;
  }
</style>
