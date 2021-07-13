<script>
  import Proficiencies from "./Proficiencies.svelte";
  import Navigation from "./Navigation.svelte";
  import ProjectsList from "./ProjectsList.svelte";
</script>

<main>
  <Navigation />
  <div class="start" style="background-image: url(./assets/background.jpg);">
    <!-- <div class="name">
      <p class="name_tag"></p>
    </div> -->
    <h1 class="name">Christopher Odell</h1>
    <h2 class="open">
      Data Analytics Management | Data scientist | Data Engineer
    </h2>
  </div>

  <div class="main_section">
    <div class="container">
      <Proficiencies />
    </div>
    <!-- <div class="container">
      <ProjectsList />
    </div> -->
  </div>
  <div class="about">
    <p>
      As a data scientist. I value integrity, communication, and problem
      solving. My values help me organize facts in systematic ways that
      influence decision making through clear communication. As a result, I can
      think of new ways to make an impactful difference in real life problems. I
      would like to be known for great reliable and accurate work that can be
      counted on in a continuous basis.
    </p>
  </div>

</main>

<style>
  main {
    /* height: 100vh; */
    overflow: auto;
    flex-direction: column;
    display: flex;
  }

  .start {
    display: grid;
    width: 100%;
    color: white;
    min-height: 500px;
    background-size: cover;
    height: 100vh;
    align-content: center;
    text-align: center;
  }

  .name {
    color: red;
    text-align: center;
    font-family: cursive;
    font-weight: 600;
    vertical-align: middle;
    font-size: 4rem;
  }

  .start .open {
    position: relative;
  }

  .main_section {
    display: flex;
    flex-direction: row;
  }

  .container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 25px;
  }

  .about {
    flex: 1;
    color: black;
    justify-content: center;
    font-weight: 600;
  }
</style>
