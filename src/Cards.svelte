<script>
  import { getHref } from "./util/util.js";
  export let project;

  let anchor;
  let h3;
  let image;

  $: if (image) {
    console.log(
      " anchor H3 ParseIntH3",
      anchor.offsetHeight,
      h3.offsetHeight,
      parseInt(window.getComputedStyle(h3).marginBottom)
    );
    image.style.height = `${anchor.offsetHeight -
      h3.offsetHeight -
      parseInt(window.getComputedStyle(h3).marginBottom)}px`;
  }
</script>

<div class="card">
  <a href={getHref(project.name)} bind:this={anchor}>
    <h3 bind:this={h3}>{project.name}</h3>
    <div bind:this={image} class="image-class">
      <img src={project.images[0]} alt={project.name} />

    </div>
  </a>
</div>

<style>
  .card {
    /* flex: 1 1 150px; */
    height: 250px;
    border: 1px solid #aaa;
    border-radius: 3px;
    box-shadow: 2px 2px 10px rgba(255, 255, 255);
    padding: 1em;
  }

  a {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  h3 {
    flex: 0 0 25px;
    /* flex-basis: 50px; */
    height: 20px;
    width: 100%;
    /* padding: 0 0 1.4em 0; */
    /* margin: 0 0 1em 0; */
    border-bottom: 1px solid #ff3e00;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .image-class {
    padding-top: 10px;
    flex: 0 1 auto;
  }

  :global(.image-class img) {
    width: 100%;
    height: 100%;
  }
</style>
