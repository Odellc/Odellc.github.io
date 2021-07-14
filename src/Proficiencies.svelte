<script>
  import { blur } from "svelte/transition";
  import { onMount } from "svelte";
  import skillData from "./skills";

  let skills = [];

  // lifecycle
  onMount(() => (skills = skillData));
</script>

<div class="skill_type">
  {#each skillData as skill, index (skill.id)}
    <div class="sub-skill">
    <a href="{skill.url || "#"}">
      <img
        src={skill.src}
        alt={skill.name}
        transition:blur={{ duration: 2000, amount: 20 }} />
    
    <div class="blurb">
    {skill.blurb}
    </div>
    </a>
    </div>
  {/each}

</div>

<style>
  .skill_type{
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    width: 100%;
    justify-content: center;
    gap: 25px;
  }

  .skill_type > div:hover{
    background-color: rgb(80, 145, 145);
    cursor: pointer;
    box-shadow: 0 0 10px white;
  }

  .sub-skill, a {
    display: flex;
    /* flex-wrap: wrap; */
    flex: 1;
    flex-direction: row;
    flex-basis: 30%;
    /* flex: 0 1 calc(70% - 8px); */
    gap: 25px;
    /* row-gap: 60px; */
    /* border: 1px solid white; */
    /* justify-content: center; */
  }

  .sub-skill:last-of-type a:hover{
    background-color: #010f18;
    cursor: default;
  }

  .sub-skill:last-of-type:hover{
    box-shadow: 0 0 0px rgb(0,0,0);
  }

  img {
    width: 70px;
    height: 70px;
    /* transition: all 0.2s ease-in-out; */
  }

  img:hover {
    box-shadow: 0 0 10px #303030;
  }

  .blurb{
    display: flex;
    flex-direction: column;
    color:white;
    font-size: .9rem;
    justify-content: center;
    align-items: center;
    
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
