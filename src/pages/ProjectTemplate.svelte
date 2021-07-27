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

  <h3>Summary</h3>
  <div class="intro">
    <p>{projectInfo.descriptionIntro}</p>

    <img src={projectInfo.imageA} alt="Image One" width="300" height="300" />

  </div>

  <h3>Body</h3>
  <p>{projectInfo.descriptionBody}</p>

  <img src={projectInfo.imageB} alt="Image Two" width="300" height="300" />

  <h3>Conclusion</h3>
  <p>{projectInfo.descriptionConclusion}</p>

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
