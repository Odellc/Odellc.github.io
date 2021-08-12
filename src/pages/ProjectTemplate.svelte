<script>
  import projects from "./projects.js";
  import { getHref } from "../util/util.js";
  import { onMount } from "svelte";

  export let params;
  let projectInfo = {};
  let photoIndex = 0;

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

  $: console.log("photoIndex=", photoIndex);

  //   $: console.log("ProjectInfo:", projectInfo);
</script>

<div class="project-template">
  <div class="column">
    <div id="featured-photo">
      <img
        src={projectInfo.images[photoIndex]}
        alt="Image"
        width="100%"
        height="auto" />

    </div>
    {#if projectInfo.images.length > 1}
      <div class="thumbnails">
        {#each projectInfo.images as images_to_display, idx}
          <div>
            <img
              src={images_to_display}
              alt="Image"
              width="100"
              height="100"
              on:click={() => (photoIndex = idx)} />
          </div>
        {/each}
      </div>
    {/if}

  </div>
  <div class="column">
    <h3>{projectInfo.name}</h3>

    <div class="intro">
      <p class="subhead">{projectInfo.summary}</p>

    </div>

    <h4>Tools:</h4>
    <div class="pills">
      {#each projectInfo.tools as tool}
        <div class="pill">{tool}</div>
      {/each}
    </div>

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

  .column:first-of-type {
    display: flex;
    flex-direction: column;
    padding-right: 30px;
  }

  .column:last-of-type {
    min-height: 100%;
    flex-basis: 55%;
  }

  #featured-photo {
    margin-bottom: 15px;
  }

  .intro {
    display: inline-block;
  }

  img {
    float: left;
    shape-outside: ellipse();
  }

  .thumbnails {
    display: flex;
    gap: 10px;
    justify-content: center;
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

  .subhead {
    line-height: 40px;
  }

  .subhead::first-letter {
    font-size: 32px;
    float: left;
    color: #99b946;
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .pills {
    display: flex;
  }

  .pill {
    padding: 8px;
    background-color: #99b946;
    border-radius: 5px;
    border: 1px solid black;
    color: black;
    width: 120px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
</style>
