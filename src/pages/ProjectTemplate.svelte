<script>
  import projects from "./projects.js";
  import { getHref } from "../util/util.js";
  import { onMount } from "svelte";

  export let params;
  let projectInfo = {};

  //   onMount(() => {
  // console.log("Params", params);

  $: if (projects != null) {
    for (let i = 0; i < projects.length; i++) {
      let name = getHref(projects[i].name).slice(1);

      if (params.projectName == name) {
        projectInfo = projects[i];
      }
    }
  }

  //   $: console.log("ProjectInfo:", projectInfo);
</script>

<div class="project-template">
  <div class="column">
    {#each projectInfo.images as images_to_display}
      <div>
        <img src={images_to_display} alt="Image" width="300" height="300" />
      </div>
    {/each}

    <div class="thumbnails">
      {#each projectInfo.images as images_to_display}
        <div>
          <img src={images_to_display} alt="Image" width="100" height="100" />
        </div>
      {/each}
    </div>

  </div>
  <div class="column">
    <h3>{projectInfo.name}</h3>

    <div class="intro">
      <p>{projectInfo.summary}</p>

    </div>

    <h4>{projectInfo.tools}</h4>

  </div>

</div>

<style>
  .project-template {
    display: flex;
    flex-direction: row;
    padding: 25px;
    /* align-items: center;
    justify-content: center; */
    padding-top: 100px;
    min-height: 100vh;
  }

  .column {
    min-height: 100%;
    flex-basis: 45%;
  }

  .column:last-of-type {
    min-height: 100%;
    flex-basis: 55%;
  }

  .intro {
    display: inline-block;
  }

  img {
    float: left;
    shape-outside: ellipse();
  }

  .thumbnails {
  }

  h4 {
    color: white;
    margin-top: 15px;
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
