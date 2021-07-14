<script>
  import Proficiencies from "../Proficiencies.svelte";
  import About from "../About.svelte"

</script>

<main>
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
    <div class="container" id="proficiencies">
      <Proficiencies />
    </div>
    <!-- <div class="container">
      <ProjectsList />
    </div> -->
  </div>
  <div class="about">
    <About/>
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
    color: #99b946;
    text-align: center;
    font-family: Georgia;
    font-weight: 600;
    vertical-align: middle;
    font-size: 4rem;
    padding: 10px;
    /* opacity: 50%; */
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
    flex-direction: row;
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
