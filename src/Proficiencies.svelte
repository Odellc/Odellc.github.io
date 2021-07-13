<script>
  import { blur } from "svelte/transition";
  import { onMount } from "svelte";
  import skillData from "./skills";

  let skills = [];

  // lifecycle
  onMount(() => (skills = skillData));
</script>

<div>
  {#each skillData as skill, index (skill.id)}
    <a href="#">
      <img
        src={skill.src}
        alt={skill.name}
        transition:blur={{ duration: 2000, amount: 20 }} />
    </a>
  {/each}

</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    flex-basis: auto;
    flex: 0 1 calc(60% - 8px);
    gap: 25px;
    row-gap: 60px;
  }
  img {
    width: 100px;
    height: 100px;
    transition: all 0.2s ease-in-out;
  }

  img:hover {
    box-shadow: 0 0 10px #303030;
  }

  /* @media only screen and (max-width: 999px) and (min-width: 600px) {
    img {
      width: 50px;
    }
  }

  @media only screen and (min-width: 1000px) {
    img {
      width: 400px;
    } */
</style>
