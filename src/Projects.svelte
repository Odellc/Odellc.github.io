<script>
  import About from "./About.svelte";
  import App from "./App.svelte";
  import Cards from "./Cards.svelte";
  import projects from "./pages/projects.js";
  import skills from "./skills.js";

  export let projectFilter;

  $: filteredProjects =
    projectFilter == null
      ? projects
      : projects.filter(project => {
          return project.filter.includes(projectFilter.toLowerCase());
        });

  const filterBySkill = name => {
    projectFilter = name == "All" ? null : name.toLowerCase();
  };
</script>

<div class="filter-buttons">
  {#each [{ name: 'All' }, ...skills.slice(0, -1)] as skill}
    <button
      on:click={() => filterBySkill(skill.name)}
      class:selected={projectFilter == skill.name.toLowerCase() || (projectFilter == null && skill.name == 'All')}>
      {skill.name}
    </button>
  {/each}
</div>
<div class="card-container">
  {#each filteredProjects as project}
    <Cards {project} />
  {/each}

</div>

<style>
  .filter-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .filter-buttons button {
    padding: 10px;
    overflow: hidden;
    border: hidden;
    border-left: 0.5px solid black;
    border-right: 0.5px solid black;
    font-weight: 600;
  }

  .filter-buttons button:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .filter-buttons button:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }

  .selected {
    background-color: #99b946;
  }

  .card-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 25px;
  }
</style>
